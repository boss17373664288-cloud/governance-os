import { Injectable, HttpException, OnModuleInit } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class ReferralService implements OnModuleInit {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async onModuleInit() {
    await this.em.query(`
      CREATE TABLE IF NOT EXISTS referrer_master (
        referrer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_name VARCHAR(100) NOT NULL,
        referrer_type VARCHAR(20) NOT NULL DEFAULT 'EXTERNAL',
        phone VARCHAR(20),
        notes TEXT,
        cash_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        product_reward JSONB DEFAULT '[]',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await this.em.query(`
      CREATE TABLE IF NOT EXISTS customer_referral (
        customer_id UUID PRIMARY KEY REFERENCES customer_master(customer_id) ON DELETE CASCADE,
        referrer_id UUID NOT NULL REFERENCES referrer_master(referrer_id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await this.em.query(`
      CREATE TABLE IF NOT EXISTS referral_reward_record (
        record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID NOT NULL REFERENCES referrer_master(referrer_id),
        period_month VARCHAR(6) NOT NULL,
        total_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
        cash_reward NUMERIC(18,2) NOT NULL DEFAULT 0,
        product_reward_detail JSONB DEFAULT '[]',
        breakdown JSONB DEFAULT '{}',
        posted_to_journal BOOLEAN NOT NULL DEFAULT false,
        journal_entry_id UUID,
        created_by UUID,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Referrers
  async getReferrers() {
    return this.em.query("SELECT * FROM referrer_master WHERE is_active = true ORDER BY referrer_name");
  }

  async saveReferrer(body: any) {
    const pp = Array.isArray(body.product_reward) ? JSON.stringify(body.product_reward) : '[]';
    if (body.referrer_id) {
      await this.em.query(
        "UPDATE referrer_master SET referrer_name=$1, referrer_type=$2, phone=$3, notes=$4, cash_rate=$5, product_reward=$6, updated_at=NOW() WHERE referrer_id=$7",
        [body.referrer_name, body.referrer_type||'EXTERNAL', body.phone||null, body.notes||null, body.cash_rate||0, pp, body.referrer_id]
      );
    } else {
      await this.em.query(
        "INSERT INTO referrer_master (referrer_name, referrer_type, phone, notes, cash_rate, product_reward) VALUES ($1,$2,$3,$4,$5,$6)",
        [body.referrer_name, body.referrer_type||'EXTERNAL', body.phone||null, body.notes||null, body.cash_rate||0, pp]
      );
    }
    return { message: "已儲存" };
  }

  async deleteReferrer(id: string) {
    await this.em.query("DELETE FROM customer_referral WHERE referrer_id = $1", [id]);
    await this.em.query("UPDATE referrer_master SET is_active = false WHERE referrer_id = $1", [id]);
    return { message: "已停用" };
  }

  // Customer links
  async getLinks() {
    return this.em.query(`
      SELECT cr.*, rm.referrer_name, cm.customer_name, cm.customer_code
      FROM customer_referral cr
      JOIN referrer_master rm ON rm.referrer_id = cr.referrer_id
      JOIN customer_master cm ON cm.customer_id = cr.customer_id
      ORDER BY cm.customer_name
    `);
  }

  async saveLink(body: any) {
    const exists = await this.em.query("SELECT customer_id FROM customer_referral WHERE customer_id = $1", [body.customer_id]);
    if (exists.length > 0) {
      await this.em.query("UPDATE customer_referral SET referrer_id = $1 WHERE customer_id = $2", [body.referrer_id, body.customer_id]);
    } else {
      await this.em.query("INSERT INTO customer_referral (customer_id, referrer_id) VALUES ($1,$2)", [body.customer_id, body.referrer_id]);
    }
    return { message: "已連結" };
  }

  async deleteLink(customerId: string) {
    await this.em.query("DELETE FROM customer_referral WHERE customer_id = $1", [customerId]);
    return { message: "已移除" };
  }

  async getUnlinkedCustomers(search?: string) {
    let q = "SELECT customer_id, customer_code, customer_name FROM customer_master WHERE deleted_at IS NULL AND customer_id NOT IN (SELECT customer_id FROM customer_referral)";
    const params: any[] = [];
    if (search) { q += " AND (customer_name ILIKE $1 OR customer_code ILIKE $1)"; params.push("%"+search+"%"); }
    q += " ORDER BY customer_name LIMIT 100";
    return this.em.query(q, params);
  }

  // Calculate reward for a referrer in a month
  async calculate(referrerId: string, month: string) {
    const ref = await this.em.query("SELECT * FROM referrer_master WHERE referrer_id = $1", [referrerId]);
    if (ref.length === 0) throw new HttpException("介紹人不存在", 404);
    const referrer = ref[0];

    const startDate = month.slice(0,4) + "-" + month.slice(4) + "-01";
    const endDate = new Date(Number(month.slice(0,4)), Number(month.slice(4)), 0).toISOString().slice(0,10);

    // Get all fully-paid orders from referred customers
    const orders = await this.em.query(`
      SELECT so.order_id, so.customer_id, so.total_amount, cm.customer_name
      FROM customer_referral cr
      JOIN sales_order so ON so.customer_id = cr.customer_id
      JOIN customer_master cm ON cm.customer_id = so.customer_id
      LEFT JOIN ar_detail ad ON ad.order_id = so.order_id
      WHERE cr.referrer_id = $1
        AND so.order_date >= $2::date AND so.order_date <= $3::date
        AND so.deleted_at IS NULL
      GROUP BY so.order_id, so.customer_id, so.total_amount, cm.customer_name
      HAVING COALESCE(SUM(ad.paid_amount),0) >= COALESCE(SUM(ad.amount),0) AND COALESCE(SUM(ad.amount),0) > 0
    `, [referrerId, startDate, endDate]);

    const totalSales = orders.reduce((s: number, o: any) => s + Number(o.total_amount), 0);
    const cashRate = Number(referrer.cash_rate) || 0;
    const cashReward = Math.round(totalSales * cashRate / 100);

    // Product rewards
    const productRewards: any[] = typeof referrer.product_reward === 'string' ? JSON.parse(referrer.product_reward || '[]') : (referrer.product_reward || []);
    const productDetail: any[] = [];
    if (productRewards.length > 0 && orders.length > 0) {
      for (const pr of productRewards) {
        const qty = Number(pr.quantity_per_sale || 1) * orders.length;
        productDetail.push({ product_id: pr.product_id, product_name: pr.product_name, quantity: qty });
      }
    }

    return {
      referrer_name: referrer.referrer_name,
      total_sales: totalSales,
      cash_rate: cashRate,
      cash_reward: cashReward,
      product_rewards: productDetail,
      order_count: orders.length,
      order_details: orders.map((o: any) => ({ customer: o.customer_name, amount: Number(o.total_amount) }))
    };
  }

  async generate(body: any, userId: string) {
    const { period_month, referrer_ids } = body;
    if (!period_month) throw new HttpException("請指定月份", 400);

    const referrers = referrer_ids && referrer_ids.length > 0
      ? await this.em.query("SELECT * FROM referrer_master WHERE referrer_id = ANY($1) AND is_active = true", [referrer_ids])
      : await this.em.query("SELECT * FROM referrer_master WHERE is_active = true");

    const results: any[] = [];
    for (const ref of referrers) {
      const existing = await this.em.query("SELECT record_id FROM referral_reward_record WHERE referrer_id=$1 AND period_month=$2", [ref.referrer_id, period_month]);
      if (existing.length > 0) { results.push({ name: ref.referrer_name, status: "已存在" }); continue; }

      const calc = await this.calculate(ref.referrer_id, period_month);
      if (calc.total_sales === 0) { results.push({ name: ref.referrer_name, status: "無銷售" }); continue; }

      const recordId = uuidv4();
      await this.em.query(
        "INSERT INTO referral_reward_record (record_id, referrer_id, period_month, total_sales, cash_reward, product_reward_detail, breakdown, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [recordId, ref.referrer_id, period_month, calc.total_sales, calc.cash_reward, JSON.stringify(calc.product_rewards), JSON.stringify(calc), userId]
      );
      results.push({ name: ref.referrer_name, total_sales: calc.total_sales, cash_reward: calc.cash_reward, status: "已生成" });
    }
    return { generated: results.filter(r => r.status === "已生成").length, skipped: results.filter(r => r.status !== "已生成").length, details: results };
  }

  async list(q: any) {
    const page = Math.max(1, parseInt(q.page) || 1);
    const pageSize = Math.min(100, parseInt(q.page_size) || 20);
    const rows = await this.em.query(
      `SELECT rr.*, rm.referrer_name
       FROM referral_reward_record rr
       JOIN referrer_master rm ON rm.referrer_id = rr.referrer_id
       ORDER BY rr.period_month DESC, rm.referrer_name
       LIMIT $1 OFFSET $2`, [pageSize, (page-1)*pageSize]
    );
    const countR = await this.em.query("SELECT COUNT(*) as cnt FROM referral_reward_record");
    return { items: rows, total: parseInt(countR[0].cnt), page, page_size: pageSize };
  }

  async getOne(id: string) {
    const rows = await this.em.query(
      "SELECT rr.*, rm.referrer_name FROM referral_reward_record rr JOIN referrer_master rm ON rm.referrer_id = rr.referrer_id WHERE rr.record_id = $1", [id]
    );
    if (rows.length === 0) throw new HttpException("不存在", 404);
    return rows[0];
  }

  async remove(id: string) {
    const rows = await this.em.query("SELECT posted_to_journal FROM referral_reward_record WHERE record_id = $1", [id]);
    if (rows.length === 0) throw new HttpException("不存在", 404);
    if (rows[0].posted_to_journal) throw new HttpException("已記帳", 400);
    await this.em.query("DELETE FROM referral_reward_record WHERE record_id = $1", [id]);
    return { message: "已刪除" };
  }

  async postToJournal(id: string, userId: string) {
    const rows = await this.em.query(
      "SELECT rr.*, rm.referrer_name FROM referral_reward_record rr JOIN referrer_master rm ON rm.referrer_id = rr.referrer_id WHERE rr.record_id = $1", [id]
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
        [entryId, entryNo, new Date(), "介紹酬謝-" + rec.referrer_name + "-" + rec.period_month, "REFERRAL", rec.record_id, userId]
      );
      // Debit: 佣金支出
      await tx.query(
        "INSERT INTO journal_line (entry_id, account_id, debit, credit, description) SELECT $1, account_id, $2, 0, $3 FROM chart_of_accounts WHERE account_code = '5502'",
        [entryId, Number(rec.cash_reward), "介紹酬謝 - " + rec.referrer_name]
      );
      // Credit: 銀行存款
      await tx.query(
        "INSERT INTO journal_line (entry_id, account_id, debit, credit, description) SELECT $1, account_id, 0, $2, $3 FROM chart_of_accounts WHERE account_code = '1002'",
        [entryId, Number(rec.cash_reward), "酬謝支付 - " + rec.referrer_name]
      );
      await tx.query("UPDATE referral_reward_record SET posted_to_journal=true, journal_entry_id=$1 WHERE record_id=$2", [entryId, id]);
    });
    return { message: "已記帳", entry_no: entryNo };
  }
}
