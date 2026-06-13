import { Injectable, HttpException, OnModuleInit } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CommissionService implements OnModuleInit {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async onModuleInit() {
    await this.em.query(`
      CREATE TABLE IF NOT EXISTS employee_commission_config (
        config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employee_master(employee_id) ON DELETE CASCADE,
        new_customer_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        existing_customer_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        tier1_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
        tier1_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        tier2_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
        tier2_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        tier3_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
        tier3_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        per_product_bonus JSONB DEFAULT '[]',
        ar_collection_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id)
      )
    `);
    await this.em.query(`
      CREATE TABLE IF NOT EXISTS commission_record (
        record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employee_master(employee_id),
        period_month VARCHAR(6) NOT NULL,
        total_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
        new_customer_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
        existing_customer_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
        new_customer_commission NUMERIC(18,2) NOT NULL DEFAULT 0,
        existing_customer_commission NUMERIC(18,2) NOT NULL DEFAULT 0,
        tiered_commission NUMERIC(18,2) NOT NULL DEFAULT 0,
        product_commission NUMERIC(18,2) NOT NULL DEFAULT 0,
        total_commission NUMERIC(18,2) NOT NULL DEFAULT 0,
        ar_collection_commission NUMERIC(18,2) NOT NULL DEFAULT 0,
        breakdown JSONB DEFAULT '{}',
        posted_to_journal BOOLEAN NOT NULL DEFAULT false,
        journal_entry_id UUID,
        created_by UUID,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getConfigs() {
    return this.em.query(`
      SELECT ecc.*, em.full_name, em.employee_no
      FROM employee_commission_config ecc
      JOIN employee_master em ON em.employee_id = ecc.employee_id
      ORDER BY em.employee_no
    `);
  }

  async getProducts() {
    return this.em.query("SELECT product_id, product_code, product_name FROM product_master WHERE deleted_at IS NULL ORDER BY product_code");
  }

  async saveConfig(body: any) {
    const perProduct = Array.isArray(body.per_product_bonus) ? JSON.stringify(body.per_product_bonus) : (body.per_product_bonus || '[]');
    const existing = await this.em.query("SELECT config_id FROM employee_commission_config WHERE employee_id = $1", [body.employee_id]);
    if (existing.length > 0) {
      await this.em.query(
        `UPDATE employee_commission_config SET
          new_customer_rate=$1, existing_customer_rate=$2,
          tier1_amount=$3, tier1_rate=$4, tier2_amount=$5, tier2_rate=$6,
          tier3_amount=$7, tier3_rate=$8, per_product_bonus=$9, ar_collection_rate=$10, updated_at=NOW()
         WHERE employee_id=$11`,
        [body.new_customer_rate||0, body.existing_customer_rate||0,
         body.tier1_amount||0, body.tier1_rate||0, body.tier2_amount||0, body.tier2_rate||0,
         body.tier3_amount||0, body.tier3_rate||0, perProduct, body.ar_collection_rate||0, body.employee_id]
      );
    } else {
      await this.em.query(
        `INSERT INTO employee_commission_config
          (employee_id, new_customer_rate, existing_customer_rate,
           tier1_amount, tier1_rate, tier2_amount, tier2_rate, tier3_amount, tier3_rate, per_product_bonus, ar_collection_rate)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [body.employee_id, body.new_customer_rate||0, body.existing_customer_rate||0,
         body.tier1_amount||0, body.tier1_rate||0, body.tier2_amount||0, body.tier2_rate||0,
         body.tier3_amount||0, body.tier3_rate||0, perProduct, body.ar_collection_rate||0]
      );
    }
    return { message: "已儲存" };
  }

  async calculate(employeeId: string, month: string) {
    const configs = await this.em.query("SELECT * FROM employee_commission_config WHERE employee_id = $1", [employeeId]);
    if (configs.length === 0) throw new HttpException("該員工尚無獎金設定", 400);
    const cfg = configs[0];

    const startDate = month.slice(0,4) + "-" + month.slice(4) + "-01";
    const endDate = new Date(Number(month.slice(0,4)), Number(month.slice(4)), 0).toISOString().slice(0,10);

    // Get fully paid orders for this employee in this period
    const orders = await this.em.query(`
      SELECT so.order_id, so.order_no, so.customer_id, so.total_amount, so.created_at,
        cm.customer_name,
        COALESCE(SUM(ad.amount), 0) as total_ar,
        COALESCE(SUM(ad.paid_amount), 0) as total_paid
      FROM sales_order so
      JOIN customer_master cm ON cm.customer_id = so.customer_id
      LEFT JOIN ar_detail ad ON ad.order_id = so.order_id
      WHERE so.created_by = $1
        AND so.order_date >= $2::date
        AND so.order_date <= $3::date
        AND so.deleted_at IS NULL
      GROUP BY so.order_id, so.order_no, so.customer_id, so.total_amount, so.created_at, cm.customer_name
    `, [employeeId, startDate, endDate]);

    // Filter: only fully paid orders
    const paidOrders = orders.filter((o: any) => Number(o.total_paid) >= Number(o.total_ar) && Number(o.total_ar) > 0);
    const totalSales = paidOrders.reduce((s: number, o: any) => s + Number(o.total_amount), 0);

    // New vs existing customer detection
    const customerFirstOrders = new Map<string, Date>();
    for (const o of paidOrders) {
      const cid = o.customer_id;
      if (!customerFirstOrders.has(cid)) {
        const firstOrder = await this.em.query(
          "SELECT MIN(order_date) as first_date FROM sales_order WHERE customer_id = $1 AND deleted_at IS NULL",
          [cid]
        );
        customerFirstOrders.set(cid, firstOrder[0]?.first_date);
      }
    }

    let newCustomerSales = 0;
    let existingCustomerSales = 0;
    for (const o of paidOrders) {
      const firstDate = customerFirstOrders.get(o.customer_id);
      const orderDate = new Date(o.order_date || o.created_at).toISOString().slice(0,10);
      if (firstDate && orderDate === new Date(firstDate).toISOString().slice(0,10)) {
        newCustomerSales += Number(o.total_amount);
      } else {
        existingCustomerSales += Number(o.total_amount);
      }
    }

    // Commission calculations
    const newCommission = Math.round(newCustomerSales * Number(cfg.new_customer_rate) / 100);
    const existingCommission = Math.round(existingCustomerSales * Number(cfg.existing_customer_rate) / 100);

    // Tiered commission
    let tieredCommission = 0;
    const t1 = Number(cfg.tier1_amount), r1 = Number(cfg.tier1_rate);
    const t2 = Number(cfg.tier2_amount), r2 = Number(cfg.tier2_rate);
    const t3 = Number(cfg.tier3_amount), r3 = Number(cfg.tier3_rate);
    if (t3 > 0 && totalSales >= t3) {
      tieredCommission = Math.round(totalSales * r3 / 100);
    } else if (t2 > 0 && totalSales >= t2) {
      tieredCommission = Math.round(totalSales * r2 / 100);
    } else if (t1 > 0 && totalSales >= t1) {
      tieredCommission = Math.round(totalSales * r1 / 100);
    }

    // Company-wide AR collection commission (for managers)
    let arCollectionCommission = 0;
    const arRate = Number(cfg.ar_collection_rate) || 0;
    if (arRate > 0) {
      // Sum ALL fully-paid AR across entire company for this month
      const allPaidAR = await this.em.query(`
        SELECT COALESCE(SUM(so.total_amount), 0) as total
        FROM sales_order so
        LEFT JOIN ar_detail ad ON ad.order_id = so.order_id
        WHERE so.order_date >= $1::date AND so.order_date <= $2::date
          AND so.deleted_at IS NULL
        GROUP BY so.order_id
        HAVING COALESCE(SUM(ad.paid_amount), 0) >= COALESCE(SUM(ad.amount), 0)
          AND COALESCE(SUM(ad.amount), 0) > 0
      `, [startDate, endDate]);
      const companyTotal = allPaidAR.reduce((s: number, r: any) => s + Number(r.total), 0);
      arCollectionCommission = Math.round(companyTotal * arRate / 100);
    }

    // Per-product bonus
    const perProductBonus: any[] = typeof cfg.per_product_bonus === 'string' ? JSON.parse(cfg.per_product_bonus || '[]') : (cfg.per_product_bonus || []);
    let productCommission = 0;
    const productBreakdown: any[] = [];
    if (perProductBonus.length > 0) {
      const orderItems = await this.em.query(`
        SELECT oi.product_id, oi.product_name, SUM(oi.quantity) as total_qty
        FROM order_item oi
        JOIN sales_order so ON so.order_id = oi.order_id
        WHERE so.created_by = $1
          AND so.order_date >= $2::date AND so.order_date <= $3::date
          AND so.deleted_at IS NULL
        GROUP BY oi.product_id, oi.product_name
      `, [employeeId, startDate, endDate]);

      for (const item of orderItems) {
        const bonus = perProductBonus.find((b: any) => b.product_id === item.product_id);
        if (bonus && bonus.bonus_per_unit > 0) {
          const amount = Math.round(Number(item.total_qty) * Number(bonus.bonus_per_unit));
          productCommission += amount;
          productBreakdown.push({ product_name: item.product_name, qty: Number(item.total_qty), per_unit: Number(bonus.bonus_per_unit), total: amount });
        }
      }
    }

    const totalCommission = newCommission + existingCommission + tieredCommission + arCollectionCommission + productCommission;

    return {
      total_sales: totalSales,
      new_customer_sales: newCustomerSales,
      existing_customer_sales: existingCustomerSales,
      new_customer_commission: newCommission,
      existing_customer_commission: existingCommission,
      tiered_commission: tieredCommission,
      product_commission: productCommission,
      ar_collection_commission: arCollectionCommission,
      total_commission: totalCommission,
      product_breakdown: productBreakdown,
      paid_order_count: paidOrders.length,
      rates_used: {
        new_customer_rate: Number(cfg.new_customer_rate),
        existing_customer_rate: Number(cfg.existing_customer_rate),
        tier1: { amount: t1, rate: r1 },
        tier2: { amount: t2, rate: r2 },
        tier3: { amount: t3, rate: r3 },
        ar_collection_rate: arRate,
      }
    };
  }

  async generate(body: any, userId: string) {
    const { employee_ids, period_month } = body;
    if (!period_month) throw new HttpException("請指定月份", 400);
    const configs = employee_ids && employee_ids.length > 0
      ? await this.em.query("SELECT * FROM employee_commission_config WHERE employee_id = ANY($1)", [employee_ids])
      : await this.em.query("SELECT * FROM employee_commission_config");
    const results: any[] = [];
    for (const cfg of configs) {
      const existing = await this.em.query("SELECT record_id FROM commission_record WHERE employee_id=$1 AND period_month=$2", [cfg.employee_id, period_month]);
      if (existing.length > 0) { results.push({ employee_id: cfg.employee_id, status: "已存在" }); continue; }
      const calc = await this.calculate(cfg.employee_id, period_month);
      const recordId = uuidv4();
      await this.em.query(
        `INSERT INTO commission_record (record_id, employee_id, period_month, total_sales,
          new_customer_sales, existing_customer_sales, new_customer_commission, existing_customer_commission,
          tiered_commission, product_commission, ar_collection_commission, total_commission, breakdown, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [recordId, cfg.employee_id, period_month, calc.total_sales,
         calc.new_customer_sales, calc.existing_customer_sales, calc.new_customer_commission, calc.existing_customer_commission,
         calc.tiered_commission, calc.product_commission, calc.ar_collection_commission || 0, calc.total_commission, JSON.stringify(calc), userId]
      );
      results.push({ employee_id: cfg.employee_id, total_commission: calc.total_commission, status: "已生成" });
    }
    return { generated: results.filter(r => r.status === "已生成").length, skipped: results.filter(r => r.status !== "已生成").length, details: results };
  }

  async list(q: any) {
    const page = Math.max(1, parseInt(q.page) || 1);
    const pageSize = Math.min(100, parseInt(q.page_size) || 20);
    const rows = await this.em.query(
      `SELECT cr.*, em.full_name, em.employee_no
       FROM commission_record cr
       JOIN employee_master em ON em.employee_id = cr.employee_id
       ORDER BY cr.period_month DESC, em.employee_no
       LIMIT $1 OFFSET $2`, [pageSize, (page-1)*pageSize]
    );
    const countR = await this.em.query("SELECT COUNT(*) as cnt FROM commission_record");
    return { items: rows, total: parseInt(countR[0].cnt), page, page_size: pageSize };
  }

  async getOne(id: string) {
    const rows = await this.em.query(
      `SELECT cr.*, em.full_name, em.employee_no
       FROM commission_record cr
       JOIN employee_master em ON em.employee_id = cr.employee_id
       WHERE cr.record_id = $1`, [id]
    );
    if (rows.length === 0) throw new HttpException("不存在", 404);
    return rows[0];
  }

  async remove(id: string) {
    const rows = await this.em.query("SELECT posted_to_journal FROM commission_record WHERE record_id = $1", [id]);
    if (rows.length === 0) throw new HttpException("不存在", 404);
    if (rows[0].posted_to_journal) throw new HttpException("已記帳，不可刪除", 400);
    await this.em.query("DELETE FROM commission_record WHERE record_id = $1", [id]);
    return { message: "已刪除" };
  }

  async postToJournal(id: string, userId: string) {
    const rows = await this.em.query(
      `SELECT cr.*, em.full_name, em.employee_no FROM commission_record cr
       JOIN employee_master em ON em.employee_id = cr.employee_id WHERE cr.record_id = $1`, [id]
    );
    if (rows.length === 0) throw new HttpException("不存在", 404);
    const rec = rows[0];
    if (rec.posted_to_journal) throw new HttpException("已記帳", 400);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const countR = await this.em.query("SELECT COUNT(*) as cnt FROM journal_entry WHERE entry_no LIKE $1", ["JE" + dateStr + "%"]);
    const seq = String((parseInt(countR[0].cnt) || 0) + 1).padStart(4, "0");
    const entryNo = "JE" + dateStr + seq;
    const entryId = uuidv4();

    await this.em.transaction(async (tx: any) => {
      await tx.query(
        "INSERT INTO journal_entry (entry_id, entry_no, entry_date, description, source_type, source_id, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [entryId, entryNo, new Date(), "銷售獎金-" + rec.full_name + "-" + rec.period_month, "COMMISSION", rec.record_id, userId]
      );
      // Debit: 佣金支出
      await tx.query(
        "INSERT INTO journal_line (entry_id, account_id, debit, credit, description) SELECT $1, account_id, $2, 0, $3 FROM chart_of_accounts WHERE account_code = '5502'",
        [entryId, Number(rec.total_commission), "銷售獎金 - " + rec.full_name]
      );
      // Credit: 銀行存款
      await tx.query(
        "INSERT INTO journal_line (entry_id, account_id, debit, credit, description) SELECT $1, account_id, 0, $2, $3 FROM chart_of_accounts WHERE account_code = '1002'",
        [entryId, Number(rec.total_commission), "獎金支付 - " + rec.full_name]
      );
      await tx.query("UPDATE commission_record SET posted_to_journal=true, journal_entry_id=$1, updated_at=NOW() WHERE record_id=$2", [entryId, id]);
    });
    return { message: "已記帳", entry_no: entryNo };
  }
}
