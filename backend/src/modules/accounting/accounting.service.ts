import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class AccountingService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  // ====== 會計科目 ======
  async getAccounts() {
    return this.em.query("SELECT * FROM chart_of_accounts ORDER BY account_code");
  }

  async createAccount(dto: any) {
    if (!dto.account_code || !dto.account_name) throw new HttpException("代碼與名稱為必填", 400);
    const exist = await this.em.query("SELECT 1 FROM chart_of_accounts WHERE account_code = $1", [dto.account_code]);
    if (exist.length > 0) throw new HttpException("科目代碼已存在", 409);
    await this.em.query(
      "INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_id, description) VALUES ($1,$2,$3,$4,$5)",
      [dto.account_code, dto.account_name, dto.account_type, dto.parent_id || null, dto.description || null]
    );
    return { message: "已建立" };
  }

  async updateAccount(id: string, dto: any) {
    const rows = await this.em.query("SELECT * FROM chart_of_accounts WHERE account_id = $1", [id]);
    if (rows.length === 0) throw new HttpException("科目不存在", 404);
    await this.em.query(
      "UPDATE chart_of_accounts SET account_name=$1, account_type=$2, description=$3, is_active=$4 WHERE account_id=$5",
      [dto.account_name, dto.account_type, dto.description || null, dto.is_active !== false, id]
    );
    return { message: "已更新" };
  }

  // ====== 日記帳分錄 ======
  async getJournalEntries(query: any) {
    const page = +query.page || 1;
    const page_size = +query.page_size || 20;
    const countR = await this.em.query("SELECT COUNT(*) as cnt FROM journal_entry");
    const total = parseInt(countR[0].cnt);
    const items = await this.em.query(
      "SELECT * FROM journal_entry ORDER BY entry_date DESC, created_at DESC LIMIT $1 OFFSET $2",
      [page_size, (page - 1) * page_size]
    );
    
    // 為每筆分錄附上明細行摘要 + 來源單號
    for (const item of items) {
      const lines = await this.em.query(
        "SELECT jl.*, ca.account_code, ca.account_name FROM journal_line jl JOIN chart_of_accounts ca ON ca.account_id = jl.account_id WHERE jl.entry_id = $1 ORDER BY jl.debit DESC, jl.credit ASC",
        [item.entry_id]
      );
      item.lines = lines;
      item.total_debit = lines.reduce((s: number, l: any) => s + Number(l.debit), 0);
      item.total_credit = lines.reduce((s: number, l: any) => s + Number(l.credit), 0);
      
      // 解析來源單號
      if (item.source_type === "SALES" || item.source_type === "COGS") {
        const orders = await this.em.query(
          "SELECT so.order_no, cm.customer_name FROM sales_order so LEFT JOIN customer_master cm ON cm.customer_id = so.customer_id WHERE so.order_id = $1",
          [item.source_id]
        );
        item.source_ref = orders.length > 0 ? orders[0].order_no : item.source_id;
        item.customer_name = orders.length > 0 ? orders[0].customer_name : null;
      } else if (item.source_type === "AP_PAYMENT") {
        const aps = await this.em.query("SELECT s.supplier_name FROM ap_detail ap JOIN supplier_master s ON s.supplier_id = ap.supplier_id WHERE ap.ap_id = $1", [item.source_id]);
        item.source_ref = aps.length > 0 ? "付-" + aps[0].supplier_name : item.source_id;
      } else {
        item.source_ref = item.source_id;
      }
    }
    
    return { items, pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
  }

  async getJournalEntry(id: string) {
    const entries = await this.em.query("SELECT * FROM journal_entry WHERE entry_id = $1", [id]);
    if (entries.length === 0) throw new HttpException("分錄不存在", 404);
    const lines = await this.em.query(
      "SELECT jl.*, ca.account_code, ca.account_name FROM journal_line jl JOIN chart_of_accounts ca ON ca.account_id = jl.account_id WHERE jl.entry_id = $1 ORDER BY jl.line_id",
      [id]
    );
    return { ...entries[0], lines };
  }

  async createJournalEntry(dto: any, userId: string) {
    if (!dto.lines || dto.lines.length < 2) throw new HttpException("至少需要借方和貸方各一筆", 400);
    
    const totalDebit = dto.lines.reduce((s: number, l: any) => s + (+l.debit || 0), 0);
    const totalCredit = dto.lines.reduce((s: number, l: any) => s + (+l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) throw new HttpException("借貸不平衡", 400);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const countResult = await this.em.query("SELECT COUNT(*) as cnt FROM journal_entry WHERE entry_no LIKE $1", ["JE" + dateStr + "%"]);
    const seq = String((parseInt(countResult[0].cnt) || 0) + 1).padStart(4, "0");
    const entryNo = "JE" + dateStr + seq;

    return this.em.transaction(async (tx) => {
      const entryId = uuidv4();
      await tx.query(
        "INSERT INTO journal_entry (entry_id, entry_no, entry_date, description, source_type, source_id, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [entryId, entryNo, dto.entry_date || new Date(), dto.description || "", dto.source_type || null, dto.source_id || null, userId]
      );
      for (const line of dto.lines) {
        await tx.query(
          "INSERT INTO journal_line (entry_id, account_id, debit, credit, description) VALUES ($1,$2,$3,$4,$5)",
          [entryId, line.account_id, +line.debit || 0, +line.credit || 0, line.description || null]
        );
      }
      return { entry_id: entryId, entry_no: entryNo };
    });
  }

  // ====== 總帳 ======
  async getGeneralLedger(query: any) {
    const accountId = query.account_id;
    const startDate = query.start_date || "2020-01-01";
    const endDate = query.end_date || "2099-12-31";

    let where = "WHERE je.entry_date BETWEEN $1 AND $2";
    const params: any[] = [startDate, endDate];
    if (accountId) { where += " AND jl.account_id = $" + (params.length + 1); params.push(accountId); }

    const lines = await this.em.query(
      "SELECT je.entry_no, je.entry_date, je.description as entry_desc, jl.debit, jl.credit, jl.description as line_desc, ca.account_code, ca.account_name " +
      "FROM journal_line jl JOIN journal_entry je ON je.entry_id = jl.entry_id JOIN chart_of_accounts ca ON ca.account_id = jl.account_id " +
      where + " ORDER BY je.entry_date, je.entry_no",
      params
    );
    return { items: lines };
  }

  // ====== 損益表 ======
  async getIncomeStatement(query: any) {
    const year = query.year || new Date().getFullYear();
    const startDate = year + "-01-01";
    const endDate = year + "-12-31";

    const revenue = await this.em.query(
      "SELECT COALESCE(SUM(jl.credit),0) as total FROM journal_line jl JOIN journal_entry je ON je.entry_id = jl.entry_id JOIN chart_of_accounts ca ON ca.account_id = jl.account_id WHERE ca.account_type = 'REVENUE' AND je.entry_date BETWEEN $1 AND $2",
      [startDate, endDate]
    );
    const expenses = await this.em.query(
      "SELECT ca.account_code, ca.account_name, COALESCE(SUM(jl.debit),0) as total FROM journal_line jl JOIN journal_entry je ON je.entry_id = jl.entry_id JOIN chart_of_accounts ca ON ca.account_id = jl.account_id WHERE ca.account_type = 'EXPENSE' AND je.entry_date BETWEEN $1 AND $2 GROUP BY ca.account_code, ca.account_name ORDER BY ca.account_code",
      [startDate, endDate]
    );
    const totalExpense = expenses.reduce((s: number, e: any) => s + Number(e.total), 0);
    const netIncome = Number(revenue[0].total) - totalExpense;

    return { year, total_revenue: Number(revenue[0].total), expenses, total_expense: totalExpense, net_income: netIncome };
  }

  // ====== 資產負債表 ======
  async getBalanceSheet() {
    const bs = await this.em.query(
      "SELECT ca.account_type, ca.account_code, ca.account_name, " +
      "COALESCE(SUM(jl.debit),0) - COALESCE(SUM(jl.credit),0) as balance " +
      "FROM chart_of_accounts ca LEFT JOIN journal_line jl ON jl.account_id = ca.account_id " +
      "WHERE ca.account_type IN ('ASSET','LIABILITY','EQUITY') " +
      "GROUP BY ca.account_type, ca.account_code, ca.account_name ORDER BY ca.account_code"
    );
    
    const assets = bs.filter((r: any) => r.account_type === "ASSET");
    const liabilities = bs.filter((r: any) => r.account_type === "LIABILITY");
    const equity = bs.filter((r: any) => r.account_type === "EQUITY");
    
    const totalAssets = assets.reduce((s: number, r: any) => s + Number(r.balance), 0);
    const totalLiabilities = liabilities.reduce((s: number, r: any) => s + Number(r.balance), 0);
    const totalEquity = equity.reduce((s: number, r: any) => s + Number(r.balance), 0);

    return { assets, total_assets: totalAssets, liabilities, total_liabilities: totalLiabilities, equity, total_equity: totalEquity };
  }

  
  // ====== 現金帳 ======
  async getCashBook(query: any) {
    const startDate = query.start_date || new Date().toISOString().slice(0, 7) + "-01";
    const endDate = query.end_date || new Date().toISOString().slice(0, 10);
    const accountCode = query.account_code || "1001";
    
    const rows = await this.em.query(
      `SELECT je.entry_no, je.entry_date, je.description, je.source_type,
        jl.debit, jl.credit,
        ca.account_code, ca.account_name
      FROM journal_line jl
      JOIN journal_entry je ON je.entry_id = jl.entry_id
      JOIN chart_of_accounts ca ON ca.account_id = jl.account_id
      WHERE ca.account_code IN ('1001','1002','1003')
        AND je.entry_date BETWEEN $1 AND $2
      ORDER BY je.entry_date ASC, je.entry_no ASC`,
      [startDate, endDate]
    );
    
    // Calculate running balance
    let balance = 0;
    const result = rows.map((r: any) => {
      balance += Number(r.debit) - Number(r.credit);
      return {
        ...r,
        debit: Number(r.debit),
        credit: Number(r.credit),
        balance: balance
      };
    });
    
    // Get opening balance (before start date)
    const opening = await this.em.query(
      `SELECT COALESCE(SUM(jl.debit),0) - COALESCE(SUM(jl.credit),0) as opening
      FROM journal_line jl
      JOIN journal_entry je ON je.entry_id = jl.entry_id
      JOIN chart_of_accounts ca ON ca.account_id = jl.account_id
      WHERE ca.account_code IN ('1001','1002','1003')
        AND je.entry_date < $1`,
      [startDate]
    );
    
    return { 
      opening_balance: Number(opening[0].opening),
      items: result 
    };
  }

  // ====== AP 應付帳款 ======
  async getApList(query: any) {
    const page = +query.page || 1;
    const page_size = +query.page_size || 20;
    const status = query.status;
    let where = "";
    const params: any[] = [];
    if (status) { where = "WHERE ap.status = $1"; params.push(status); }
    
    const countR = await this.em.query("SELECT COUNT(*) as cnt FROM ap_detail ap " + where, params);
    const total = parseInt(countR[0].cnt);
    
    const items = await this.em.query(
      "SELECT ap.*, s.supplier_name, po.po_no FROM ap_detail ap JOIN supplier_master s ON s.supplier_id = ap.supplier_id LEFT JOIN purchase_order po ON po.po_id = ap.po_id " + where + " ORDER BY ap.due_date ASC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2),
      [...params, page_size, (page - 1) * page_size]
    );
    return { items, pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
  }

  async recordApPayment(dto: any, userId: string) {
    const aps = await this.em.query("SELECT * FROM ap_detail WHERE ap_id = $1 FOR UPDATE", [dto.ap_id]);
    if (aps.length === 0) throw new HttpException("應付不存在", 404);
    const ap = aps[0];
    if (ap.status === "PAID") throw new HttpException("已付清", 400);
    
    const remaining = Number(ap.amount) - Number(ap.paid_amount);
    if (dto.amount > remaining) throw new HttpException("付款超過應付餘額", 400);
    
    const newPaid = Number(ap.paid_amount) + dto.amount;
    const newStatus = newPaid >= Number(ap.amount) ? "PAID" : "PARTIAL";
    
    await this.em.query("UPDATE ap_detail SET paid_amount=$1, status=$2, updated_at=CURRENT_TIMESTAMP WHERE ap_id=$3", [newPaid, newStatus, dto.ap_id]);
    
    // Auto journal entry for AP payment
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const countResult = await this.em.query("SELECT COUNT(*) as cnt FROM journal_entry WHERE entry_no LIKE $1", ["JE" + dateStr + "%"]);
    const seq = String((parseInt(countResult[0].cnt) || 0) + 1).padStart(4, "0");
    const entryId = uuidv4();
    const apAccount = await this.em.query("SELECT account_id FROM chart_of_accounts WHERE account_code = '2001'");
    const cashAccount = await this.em.query("SELECT account_id FROM chart_of_accounts WHERE account_code = '1001'");
    
    await this.em.query("INSERT INTO journal_entry (entry_id, entry_no, entry_date, description, source_type, source_id, created_by) VALUES ($1,$2,CURRENT_DATE,$3,'AP_PAYMENT',$4,$5)", [entryId, "JE" + dateStr + seq, "應付帳款付款", dto.ap_id, userId]);
    await this.em.query("INSERT INTO journal_line (entry_id, account_id, debit, credit) VALUES ($1,$2,$3,0)", [entryId, apAccount[0].account_id, dto.amount]);
    await this.em.query("INSERT INTO journal_line (entry_id, account_id, debit, credit) VALUES ($1,$2,0,$3)", [entryId, cashAccount[0].account_id, dto.amount]);
    
    return { ap_id: dto.ap_id, paid: dto.amount, status: newStatus };
  }

  
  
  // ====== 銀行對帳 ======
  async getBankStatement(query: any) {
    const items = await this.em.query(
      "SELECT * FROM bank_statement ORDER BY transaction_date DESC, created_at DESC"
    );
    const reconciled = items.filter((r: any) => r.is_reconciled).reduce((s: number, r: any) => s + (r.type === "DEPOSIT" ? Number(r.amount) : -Number(r.amount)), 0);
    const unreconciled = items.filter((r: any) => !r.is_reconciled).reduce((s: number, r: any) => s + (r.type === "DEPOSIT" ? Number(r.amount) : -Number(r.amount)), 0);
    return { items, reconciled_total: reconciled, unreconciled_total: unreconciled, total: reconciled + unreconciled };
  }

  async addBankStatement(dto: any) {
    if (!dto.type || !dto.amount) throw new HttpException("類型與金額為必填", 400);
    await this.em.query(
      "INSERT INTO bank_statement (transaction_date, description, bank_reference, type, amount, note) VALUES ($1,$2,$3,$4,$5,$6)",
      [dto.transaction_date || new Date(), dto.description || null, dto.bank_reference || null, dto.type, dto.amount, dto.note || null]
    );
    return { message: "已新增" };
  }

  async updateBankStatement(id: string, dto: any) {
    await this.em.query(
      "UPDATE bank_statement SET transaction_date=$1, description=$2, bank_reference=$3, type=$4, amount=$5, note=$6, updated_at=CURRENT_TIMESTAMP WHERE statement_id=$7",
      [dto.transaction_date, dto.description, dto.bank_reference, dto.type, dto.amount, dto.note || null, id]
    );
    return { message: "已更新" };
  }

  async deleteBankStatement(id: string) {
    await this.em.query("DELETE FROM bank_statement WHERE statement_id = $1", [id]);
    return { message: "已刪除" };
  }

  async reconcileBank(id: string) {
    await this.em.query("UPDATE bank_statement SET is_reconciled = NOT is_reconciled, updated_at = CURRENT_TIMESTAMP WHERE statement_id = $1", [id]);
    return { message: "已切換對帳狀態" };
  }

  async getReconciliation() {
    // 銀行明細
    const bankItems = await this.em.query("SELECT * FROM bank_statement ORDER BY transaction_date ASC");
    // 公司現金記錄（零用金 + 現金相關日記帳）
    const cashItems = await this.em.query(
      `SELECT jl.*, je.entry_no, je.entry_date, je.description, ca.account_code, ca.account_name
       FROM journal_line jl
       JOIN journal_entry je ON je.entry_id = jl.entry_id
       JOIN chart_of_accounts ca ON ca.account_id = jl.account_id
       WHERE ca.account_code IN ('1001','1002','1003')
         AND (jl.debit > 0 OR jl.credit > 0)
       ORDER BY je.entry_date ASC`
    );
    
    const pettyItems = await this.em.query("SELECT * FROM petty_cash ORDER BY transaction_date ASC");
    
    return { bank_items: bankItems, cash_items: cashItems, petty_items: pettyItems };
  }

  // ====== 零用金 ======
  async getPettyCash(query: any) {
    const startDate = query.start_date;
    const endDate = query.end_date;
    let where = "";
    const params: any[] = [];
    
    if (startDate) { params.push(startDate); where += " AND transaction_date >= $" + params.length; }
    if (endDate) { params.push(endDate); where += " AND transaction_date <= $" + params.length; }
    
    const items = await this.em.query(
      "SELECT * FROM petty_cash WHERE 1=1" + where + " ORDER BY transaction_date ASC, created_at ASC",
      params
    );
    
    // Recalculate running balance
    let balance = 0;
    const result = items.map((r: any) => {
      if (r.type === "INCOME") balance += Number(r.amount);
      else balance -= Number(r.amount);
      return { ...r, amount: Number(r.amount), running_balance: balance };
    });
    
    // Get opening balance
    let openingBalance = 0;
    if (startDate) {
      const prior = await this.em.query(
        "SELECT COALESCE(SUM(CASE WHEN type='INCOME' THEN amount ELSE -amount END), 0) as bal FROM petty_cash WHERE transaction_date < $1",
        [startDate]
      );
      openingBalance = Number(prior[0].bal);
    }
    
    return { opening_balance: openingBalance, items: result };
  }

  async createPettyCash(dto: any, userId: string) {
    if (!dto.type || !dto.amount) throw new HttpException("類型與金額為必填", 400);
    if (!["INCOME", "EXPENSE"].includes(dto.type)) throw new HttpException("類型錯誤", 400);
    if (Number(dto.amount) <= 0) throw new HttpException("金額須大於0", 400);
    
    await this.em.query(
      "INSERT INTO petty_cash (transaction_date, type, amount, category, description, created_by) VALUES ($1,$2,$3,$4,$5,$6)",
      [dto.transaction_date || new Date(), dto.type, dto.amount, dto.category || "雜項", dto.description || null, userId]
    );
    return { message: "已記錄" };
  }

  async updatePettyCash(id: string, dto: any) {
    const rows = await this.em.query("SELECT * FROM petty_cash WHERE pc_id = $1", [id]);
    if (rows.length === 0) throw new HttpException("記錄不存在", 404);
    
    await this.em.query(
      "UPDATE petty_cash SET transaction_date=$1, type=$2, amount=$3, category=$4, description=$5, updated_at=CURRENT_TIMESTAMP WHERE pc_id=$6",
      [dto.transaction_date, dto.type, dto.amount, dto.category || "雜項", dto.description || null, id]
    );
    return { message: "已更新" };
  }

  async deletePettyCash(id: string) {
    const rows = await this.em.query("SELECT * FROM petty_cash WHERE pc_id = $1", [id]);
    if (rows.length === 0) throw new HttpException("記錄不存在", 404);
    await this.em.query("DELETE FROM petty_cash WHERE pc_id = $1", [id]);
    return { message: "已刪除" };
  }

  // ====== 自動分錄：銷售出貨時產生 AR ======
  async createSalesJournal(orderId: string, customerId: string, totalAmount: number, totalCost: number, userId: string) {
    const arAccount = await this.em.query("SELECT account_id FROM chart_of_accounts WHERE account_code = '1101'");
    const revenueAccount = await this.em.query("SELECT account_id FROM chart_of_accounts WHERE account_code = '4001'");
    const cogsAccount = await this.em.query("SELECT account_id FROM chart_of_accounts WHERE account_code = '5001'");
    const inventoryAccount = await this.em.query("SELECT account_id FROM chart_of_accounts WHERE account_code = '1201'");
    
    if (arAccount.length === 0 || revenueAccount.length === 0 || cogsAccount.length === 0 || inventoryAccount.length === 0) {
      // chart of accounts missing, skip
      return;
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    // 分錄1：收入認列 Dr AR / Cr Revenue
    const countResult1 = await this.em.query("SELECT COUNT(*) as cnt FROM journal_entry WHERE entry_no LIKE $1", ["JE" + dateStr + "%"]);
    const seq1 = String((parseInt(countResult1[0].cnt) || 0) + 1).padStart(4, "0");
    const entryId1 = uuidv4();
    await this.em.query("INSERT INTO journal_entry (entry_id, entry_no, entry_date, description, source_type, source_id, created_by) VALUES ($1,$2,CURRENT_DATE,$3,'SALES',$4,$5)",
      [entryId1, "JE" + dateStr + seq1, "銷貨收入認列", orderId, userId]);
    await this.em.query("INSERT INTO journal_line (entry_id, account_id, debit, credit) VALUES ($1,$2,$3,0)", [entryId1, arAccount[0].account_id, totalAmount]);
    await this.em.query("INSERT INTO journal_line (entry_id, account_id, debit, credit) VALUES ($1,$2,0,$3)", [entryId1, revenueAccount[0].account_id, totalAmount]);

    // 分錄2：成本結轉 Dr COGS / Cr Inventory
    const countResult2 = await this.em.query("SELECT COUNT(*) as cnt FROM journal_entry WHERE entry_no LIKE $1", ["JE" + dateStr + "%"]);
    const seq2 = String((parseInt(countResult2[0].cnt) || 0) + 1).padStart(4, "0");
    const entryId2 = uuidv4();
    await this.em.query("INSERT INTO journal_entry (entry_id, entry_no, entry_date, description, source_type, source_id, created_by) VALUES ($1,$2,CURRENT_DATE,$3,'COGS',$4,$5)",
      [entryId2, "JE" + dateStr + seq2, "銷貨成本結轉", orderId, userId]);
    await this.em.query("INSERT INTO journal_line (entry_id, account_id, debit, credit) VALUES ($1,$2,$3,0)", [entryId2, cogsAccount[0].account_id, totalCost]);
    await this.em.query("INSERT INTO journal_line (entry_id, account_id, debit, credit) VALUES ($1,$2,0,$3)", [entryId2, inventoryAccount[0].account_id, totalCost]);

    // 取得客戶付款條件
    const customers = await this.em.query(
      "SELECT payment_terms, closing_day, invoice_date, credit_days FROM customer_master WHERE customer_id = $1",
      [customerId]
    );
    const cust = customers[0] || {};
    
    // 計算到期日
    const today = new Date();
    let dueDate = new Date(today);
    const closingDay = cust.closing_day || 31;
    const creditDays = cust.credit_days || 30;
    
    // 結帳日計算：若今天超過結帳日，則下個月結帳日 + credit_days
    if (today.getDate() > closingDay) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }
    dueDate.setDate(Math.min(closingDay, new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate()));
    dueDate.setDate(dueDate.getDate() + creditDays);

    // 建立應收帳款紀錄
    await this.em.query(
      `INSERT INTO ar_detail (order_id, customer_id, tenant_id, amount, paid_amount, due_date, 
        snapshot_payment_terms, snapshot_closing_day, snapshot_invoice_date, snapshot_credit_days, status, created_by)
      VALUES ($1,$2,$3,$4,0,$5,$6,$7,$8,$9,'PENDING',$10)`,
      [orderId, customerId, '00000000-0000-0000-0000-000000000001', totalAmount, dueDate.toISOString().slice(0, 10),
       cust.payment_terms || null, cust.closing_day || null, cust.invoice_date || null, cust.credit_days || null, userId]
    );
  }
}
