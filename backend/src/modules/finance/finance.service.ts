import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { PaymentDto } from "./dto/finance.dto";

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  /** Finance dashboard stats */
  async getDashboard() {
    const totalAR = await this.em.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM ar_detail WHERE status != 'PAID'"
    );
    const totalPaid = await this.em.query(
      "SELECT COALESCE(SUM(paid_amount), 0) as total FROM ar_detail"
    );
    const overdue = await this.em.query(
      "SELECT COALESCE(SUM(amount - paid_amount), 0) as total FROM ar_detail WHERE due_date < CURRENT_DATE AND status NOT IN ('PAID')"
    );
    const dueSoon = await this.em.query(
      "SELECT COALESCE(SUM(amount - paid_amount), 0) as total, COUNT(*) as cnt FROM ar_detail WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status NOT IN ('PAID')"
    );
    const overdueCount = await this.em.query(
      "SELECT COUNT(*) as cnt FROM ar_detail WHERE due_date < CURRENT_DATE AND status NOT IN ('PAID')"
    );
    const totalCount = await this.em.query(
      "SELECT COUNT(*) as cnt FROM ar_detail WHERE status NOT IN ('PAID')"
    );

    return {
      total_ar: Number(totalAR[0].total),
      total_paid: Number(totalPaid[0].total),
      total_outstanding: Number(totalAR[0].total) - Number(totalPaid[0].total),
      overdue_amount: Number(overdue[0].total),
      due_soon_amount: Number(dueSoon[0].total),
      due_soon_count: Number(dueSoon[0].cnt),
      overdue_count: Number(overdueCount[0].cnt),
      active_count: Number(totalCount[0].cnt),
    };
  }

  /** AR list with aging filters */
  async getArList(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(query.page_size) || 20));
    const offset = (page - 1) * pageSize;
    const search = query.search || "";
    const aging = query.aging || ""; // current, 1_30, 31_60, 61_90, 90_plus, overdue

    let where = "WHERE 1=1";
    const params: any[] = [];
    let paramIdx = 0;

    if (search) {
      paramIdx++;
      where += ` AND (cm.customer_name ILIKE $${paramIdx} OR cm.customer_code ILIKE $${paramIdx} OR so.order_no ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
    }

    switch (aging) {
      case "current":
        where += " AND ar.due_date >= CURRENT_DATE";
        break;
      case "1_30":
        where += " AND ar.due_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE";
        break;
      case "31_60":
        where += " AND ar.due_date BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE - INTERVAL '31 days'";
        break;
      case "61_90":
        where += " AND ar.due_date BETWEEN CURRENT_DATE - INTERVAL '90 days' AND CURRENT_DATE - INTERVAL '61 days'";
        break;
      case "90_plus":
        where += " AND ar.due_date < CURRENT_DATE - INTERVAL '90 days'";
        break;
      case "overdue":
        where += " AND ar.due_date < CURRENT_DATE AND ar.status NOT IN ('PAID')";
        break;
      case "paid":
        where += " AND ar.status = 'PAID'";
        break;
    }

    const countResult = await this.em.query(
      `SELECT COUNT(*) as cnt FROM ar_detail ar
       JOIN sales_order so ON so.order_id = ar.order_id
       JOIN customer_master cm ON cm.customer_id = ar.customer_id
       ${where}`, params
    );
    const total = parseInt(countResult[0].cnt);

    paramIdx++;
    params.push(pageSize);
    paramIdx++;
    params.push(offset);

    const items = await this.em.query(
      `SELECT ar.*, so.order_no, cm.customer_code, cm.customer_name
       FROM ar_detail ar
       JOIN sales_order so ON so.order_id = ar.order_id
       JOIN customer_master cm ON cm.customer_id = ar.customer_id
       ${where}
       ORDER BY ar.due_date ASC
       LIMIT $${paramIdx - 1} OFFSET $${paramIdx}`, params
    );

    // Compute aging days for each item
    const now = new Date();
    const enriched = items.map((item: any) => {
      const dueDate = new Date(item.due_date);
      const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / 86400000);
      return { ...item, days_overdue: diffDays > 0 ? diffDays : 0, is_overdue: diffDays > 0 && item.status !== "PAID" };
    });

    return { items: enriched, pagination: { page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) } };
  }

  /** AR detail */
  async getArDetail(arId: string) {
    const ars = await this.em.query(
      `SELECT ar.*, so.order_no, so.order_date, so.total_amount as order_total,
        cm.customer_code, cm.customer_name
       FROM ar_detail ar
       JOIN sales_order so ON so.order_id = ar.order_id
       JOIN customer_master cm ON cm.customer_id = ar.customer_id
       WHERE ar.ar_id = $1`, [arId]
    );
    if (ars.length === 0) throw new HttpException({ errorCode: "FINANCE_001", message: "應收明細不存在" }, HttpStatus.NOT_FOUND);
    return ars[0];
  }

  /** Customer AR detail */
  async getCustomerAr(customerId: string) {
    const items = await this.em.query(
      `SELECT ar.*, so.order_no, so.order_date
       FROM ar_detail ar
       JOIN sales_order so ON so.order_id = ar.order_id
       WHERE ar.customer_id = $1 AND ar.status != 'PAID'
       ORDER BY ar.due_date ASC`, [customerId]
    );
    const total = items.reduce((s: number, i: any) => s + Number(i.amount) - Number(i.paid_amount), 0);
    return { customer_id: customerId, items, total_outstanding: total };
  }

  /** Record payment */
  async processPayment(dto: PaymentDto, userId: string) {
    return this.em.transaction(async (tx) => {
      const ars = await tx.query("SELECT * FROM ar_detail WHERE ar_id = $1 FOR UPDATE", [dto.ar_id]);
      if (ars.length === 0) throw new HttpException({ errorCode: "FINANCE_001", message: "應收明細不存在" }, HttpStatus.NOT_FOUND);

      const ar = ars[0];
      if (ar.status === "PAID") throw new HttpException({ errorCode: "FINANCE_002", message: "應收已結清" }, HttpStatus.BAD_REQUEST);

      const remaining = Number(ar.amount) - Number(ar.paid_amount);
      if (dto.amount > remaining) throw new HttpException({ errorCode: "FINANCE_003", message: "收款金額超過應收餘額" }, HttpStatus.BAD_REQUEST);

      const newPaid = Number(ar.paid_amount) + dto.amount;
      const newStatus = newPaid >= Number(ar.amount) ? "PAID" : "PARTIAL";

      await tx.query(
        "UPDATE ar_detail SET paid_amount = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE ar_id = $3",
        [newPaid, newStatus, dto.ar_id]
      );

      // Insert payment record
      const paymentId = uuidv4();
      await tx.query(
        `INSERT INTO payment_record (payment_id, ar_id, amount, reference_no, paid_by, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [paymentId, dto.ar_id, dto.amount, dto.reference_no || "", userId]
      );

      this.logger.log(`Payment: ${dto.amount} for AR ${dto.ar_id}, remaining: ${Number(ar.amount) - newPaid}`);
      return { ar_id: dto.ar_id, paid_amount: dto.amount, new_total_paid: newPaid, remaining: Number(ar.amount) - newPaid, status: newStatus };
    });
  }

  /** Overdue AR list */
  async getOverdue() {
    const items = await this.em.query(
      `SELECT ar.*, so.order_no, cm.customer_code, cm.customer_name,
        (CURRENT_DATE - ar.due_date) as days_overdue
       FROM ar_detail ar
       JOIN sales_order so ON so.order_id = ar.order_id
       JOIN customer_master cm ON cm.customer_id = ar.customer_id
       WHERE ar.due_date < CURRENT_DATE AND ar.status NOT IN ('PAID')
       ORDER BY ar.due_date ASC`
    );
    return { items, total: items.length };
  }

  /** Aging report */
  async getAgingReport() {
    const current = await this.em.query(
      "SELECT COALESCE(SUM(amount - paid_amount),0) as total FROM ar_detail WHERE due_date >= CURRENT_DATE AND status NOT IN ('PAID')"
    );
    const d1_30 = await this.em.query(
      "SELECT COALESCE(SUM(amount - paid_amount),0) as total FROM ar_detail WHERE due_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE - INTERVAL '1 day' AND status NOT IN ('PAID')"
    );
    const d31_60 = await this.em.query(
      "SELECT COALESCE(SUM(amount - paid_amount),0) as total FROM ar_detail WHERE due_date BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE - INTERVAL '31 days' AND status NOT IN ('PAID')"
    );
    const d61_90 = await this.em.query(
      "SELECT COALESCE(SUM(amount - paid_amount),0) as total FROM ar_detail WHERE due_date BETWEEN CURRENT_DATE - INTERVAL '90 days' AND CURRENT_DATE - INTERVAL '61 days' AND status NOT IN ('PAID')"
    );
    const d90plus = await this.em.query(
      "SELECT COALESCE(SUM(amount - paid_amount),0) as total FROM ar_detail WHERE due_date < CURRENT_DATE - INTERVAL '90 days' AND status NOT IN ('PAID')"
    );

    return {
      current: Number(current[0].total),
      overdue_1_30: Number(d1_30[0].total),
      overdue_31_60: Number(d31_60[0].total),
      overdue_61_90: Number(d61_90[0].total),
      overdue_90_plus: Number(d90plus[0].total),
    };
  }
}