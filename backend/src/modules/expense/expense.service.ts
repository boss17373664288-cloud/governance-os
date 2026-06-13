import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class ExpenseService {
  private readonly logger = new Logger(ExpenseService.name);
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async ensureTables() {
    await this.em.query(`
      CREATE TABLE IF NOT EXISTS expense_reimbursement (
        expense_id UUID PRIMARY KEY,
        expense_no VARCHAR(20) NOT NULL UNIQUE,
        employee_id UUID NOT NULL,
        expense_month VARCHAR(6) NOT NULL,
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        notes TEXT,
        posted_to_journal BOOLEAN NOT NULL DEFAULT false,
        journal_entry_id UUID,
        created_by UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.em.query(`
      CREATE TABLE IF NOT EXISTS expense_reimbursement_item (
        item_id UUID PRIMARY KEY,
        expense_id UUID NOT NULL REFERENCES expense_reimbursement(expense_id) ON DELETE CASCADE,
        account_id UUID,
        account_code VARCHAR(10),
        account_name VARCHAR(100),
        description TEXT,
        amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        sort_order INT NOT NULL DEFAULT 0
      )
    `);
    await this.em.query(`
      CREATE TABLE IF NOT EXISTS expense_budget (
        budget_id UUID PRIMARY KEY,
        employee_id UUID NOT NULL UNIQUE,
        monthly_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        updated_by UUID,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    this.logger.log("Expense tables ensured");
  }

  async onModuleInit() {
    await this.ensureTables();
  }

  // ====== Employees with budget ======
  async getEmployeesWithBudget() {
    const emps = await this.em.query(
      `SELECT em.employee_id, em.employee_no, em.full_name, em.department, em.job_title,
              eb.monthly_amount as budget_amount
       FROM employee_master em
       LEFT JOIN expense_budget eb ON eb.employee_id = em.employee_id
       WHERE em.status = 'ACTIVE'
       ORDER BY em.employee_no`
    );
    return emps;
  }

  async setEmployeeBudget(employeeId: string, monthlyAmount: number) {
    const exist = await this.em.query(
      "SELECT budget_id FROM expense_budget WHERE employee_id = $1",
      [employeeId]
    );
    if (exist.length > 0) {
      await this.em.query(
        "UPDATE expense_budget SET monthly_amount = $1, updated_at = NOW() WHERE employee_id = $2",
        [monthlyAmount, employeeId]
      );
    } else {
      await this.em.query(
        "INSERT INTO expense_budget (budget_id, employee_id, monthly_amount) VALUES ($1,$2,$3)",
        [uuidv4(), employeeId, monthlyAmount]
      );
    }
    return { message: "OK" };
  }

  // ====== Reimbursements ======
  async list(query: any) {
    const page = +query.page || 1;
    const pageSize = +query.page_size || 20;
    const countR = await this.em.query("SELECT COUNT(*) as cnt FROM expense_reimbursement");
    const total = parseInt(countR[0].cnt);
    const items = await this.em.query(
      `SELECT er.*, em.full_name as employee_name, em.employee_no
       FROM expense_reimbursement er
       LEFT JOIN employee_master em ON em.employee_id = er.employee_id
       ORDER BY er.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, (page - 1) * pageSize]
    );
    return { items, pagination: { page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) } };
  }

  async getOne(id: string) {
    const rows = await this.em.query(
      `SELECT er.*, em.full_name as employee_name, em.employee_no
       FROM expense_reimbursement er
       LEFT JOIN employee_master em ON em.employee_id = er.employee_id
       WHERE er.expense_id = $1`,
      [id]
    );
    if (rows.length === 0) throw new HttpException("報銷單不存在", 404);
    const items = await this.em.query(
      "SELECT * FROM expense_reimbursement_item WHERE expense_id = $1 ORDER BY sort_order",
      [id]
    );
    rows[0].items = items;
    return rows[0];
  }

  async create(dto: any, userId: string) {
    if (!dto.employee_id) throw new HttpException("請選擇員工", 400);
    if (!dto.expense_month) throw new HttpException("請選擇報銷月份", 400);
    if (!dto.items || dto.items.length === 0) throw new HttpException("請至少填寫一筆報銷明細", 400);

    const expenseId = uuidv4();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const countR = await this.em.query("SELECT COUNT(*) as cnt FROM expense_reimbursement WHERE expense_no LIKE $1", ["EX" + dateStr + "%"]);
    const seq = String((parseInt(countR[0].cnt) || 0) + 1).padStart(4, "0");
    const expenseNo = "EX" + dateStr + seq;

    const total = dto.items.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);

    await this.em.transaction(async (tx) => {
      await tx.query(
        "INSERT INTO expense_reimbursement (expense_id, expense_no, employee_id, expense_month, total_amount, status, notes, created_by) VALUES ($1,$2,$3,$4,$5,'DRAFT',$6,$7)",
        [expenseId, expenseNo, dto.employee_id, dto.expense_month, total, dto.notes || null, userId]
      );
      for (let i = 0; i < dto.items.length; i++) {
        const item = dto.items[i];
        if (!item.account_id && !item.account_code) throw new HttpException("明細行需選擇會計科目", 400);
        let accountId = item.account_id;
        let accountCode = item.account_code;
        let accountName = item.account_name;
        if (!accountId && accountCode) {
          const accts = await tx.query("SELECT account_id, account_code, account_name FROM chart_of_accounts WHERE account_code = $1", [accountCode]);
          if (accts.length > 0) {
            accountId = accts[0].account_id;
            accountCode = accts[0].account_code;
            accountName = accts[0].account_name;
          }
        }
        await tx.query(
          "INSERT INTO expense_reimbursement_item (item_id, expense_id, account_id, account_code, account_name, description, amount, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
          [uuidv4(), expenseId, accountId || null, accountCode || null, accountName || null, item.description || "", Number(item.amount) || 0, i]
        );
      }
    });

    return { expense_id: expenseId, expense_no: expenseNo };
  }

  async update(id: string, dto: any) {
    const rows = await this.em.query("SELECT * FROM expense_reimbursement WHERE expense_id = $1", [id]);
    if (rows.length === 0) throw new HttpException("報銷單不存在", 404);
    if (rows[0].posted_to_journal) throw new HttpException("已記入日記帳，不可修改", 400);

    const total = dto.items.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);

    await this.em.transaction(async (tx) => {
      await tx.query(
        "UPDATE expense_reimbursement SET employee_id=$1, expense_month=$2, total_amount=$3, notes=$4, updated_at=NOW() WHERE expense_id=$5",
        [dto.employee_id, dto.expense_month, total, dto.notes || null, id]
      );
      await tx.query("DELETE FROM expense_reimbursement_item WHERE expense_id = $1", [id]);
      for (let i = 0; i < dto.items.length; i++) {
        const item = dto.items[i];
        let accountId = item.account_id;
        let accountCode = item.account_code;
        let accountName = item.account_name;
        if (!accountId && accountCode) {
          const accts = await tx.query("SELECT account_id, account_code, account_name FROM chart_of_accounts WHERE account_code = $1", [accountCode]);
          if (accts.length > 0) {
            accountId = accts[0].account_id;
            accountCode = accts[0].account_code;
            accountName = accts[0].account_name;
          }
        }
        await tx.query(
          "INSERT INTO expense_reimbursement_item (item_id, expense_id, account_id, account_code, account_name, description, amount, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
          [uuidv4(), id, accountId || null, accountCode || null, accountName || null, item.description || "", Number(item.amount) || 0, i]
        );
      }
    });

    return { message: "已更新" };
  }

  async remove(id: string) {
    const rows = await this.em.query("SELECT * FROM expense_reimbursement WHERE expense_id = $1", [id]);
    if (rows.length === 0) throw new HttpException("報銷單不存在", 404);
    if (rows[0].posted_to_journal) throw new HttpException("已記入日記帳，不可刪除", 400);
    await this.em.query("DELETE FROM expense_reimbursement WHERE expense_id = $1", [id]);
    return { message: "已刪除" };
  }

  async checkBudget(employeeId: string, expenseMonth: string) {
    const budget = await this.em.query(
      "SELECT monthly_amount FROM expense_budget WHERE employee_id = $1",
      [employeeId]
    );
    const monthlyBudget = budget.length > 0 ? Number(budget[0].monthly_amount) : 0;

    const spent = await this.em.query(
      `SELECT COALESCE(SUM(er.total_amount), 0) as total
       FROM expense_reimbursement er
       WHERE er.employee_id = $1 AND er.expense_month = $2 AND er.posted_to_journal = true`,
      [employeeId, expenseMonth]
    );
    const spentAmount = Number(spent[0].total);

    const pending = await this.em.query(
      `SELECT COALESCE(SUM(er.total_amount), 0) as total
       FROM expense_reimbursement er
       WHERE er.employee_id = $1 AND er.expense_month = $2 AND er.posted_to_journal = false`,
      [employeeId, expenseMonth]
    );
    const pendingAmount = Number(pending[0].total);

    return {
      monthly_budget: monthlyBudget,
      spent: spentAmount,
      pending: pendingAmount,
      remaining: monthlyBudget - spentAmount - pendingAmount,
    };
  }

  async postToJournal(id: string, userId: string) {
    const rows = await this.em.query(
      `SELECT er.*, em.full_name as employee_name, em.employee_no
       FROM expense_reimbursement er
       LEFT JOIN employee_master em ON em.employee_id = er.employee_id
       WHERE er.expense_id = $1`,
      [id]
    );
    if (rows.length === 0) throw new HttpException("報銷單不存在", 404);
    const expense = rows[0];
    if (expense.posted_to_journal) throw new HttpException("已記入日記帳", 400);

    const items = await this.em.query("SELECT * FROM expense_reimbursement_item WHERE expense_id = $1 ORDER BY sort_order", [id]);
    if (items.length === 0) throw new HttpException("無明細行", 400);

    // Build journal lines: debit each expense account, credit 現金 (1001)
    const lines: any[] = [];
    for (const item of items) {
      lines.push({
        account_id: item.account_id,
        debit: Number(item.amount),
        credit: 0,
        description: `${expense.employee_name || expense.employee_id} ${expense.expense_month} ${item.account_name || item.account_code} - ${item.description || ""}`
      });
    }
    // Credit 現金
    const cashAccount = await this.em.query("SELECT account_id FROM chart_of_accounts WHERE account_code = '1002'");
    if (cashAccount.length === 0) throw new HttpException("找不到現金科目(1001)", 500);
    const totalAmount = items.reduce((s: number, i: any) => s + Number(i.amount), 0);
    lines.push({
      account_id: cashAccount[0].account_id,
      debit: 0,
      credit: totalAmount,
      description: `報銷付款 - ${expense.employee_name || expense.employee_id} ${expense.expense_month}`
    });

    // Create journal entry
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const countR = await this.em.query("SELECT COUNT(*) as cnt FROM journal_entry WHERE entry_no LIKE $1", ["JE" + dateStr + "%"]);
    const seq = String((parseInt(countR[0].cnt) || 0) + 1).padStart(4, "0");
    const entryNo = "JE" + dateStr + seq;
    const entryId = uuidv4();

    await this.em.transaction(async (tx) => {
      await tx.query(
        "INSERT INTO journal_entry (entry_id, entry_no, entry_date, description, source_type, source_id, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [entryId, entryNo, new Date(), `報銷-${expense.employee_name || expense.employee_id}-${expense.expense_month} (${expense.expense_no})`, "EXPENSE_REIMBURSEMENT", expense.expense_id, userId]
      );
      for (const line of lines) {
        await tx.query(
          "INSERT INTO journal_line (entry_id, account_id, debit, credit, description) VALUES ($1,$2,$3,$4,$5)",
          [entryId, line.account_id, line.debit, line.credit, line.description]
        );
      }
      await tx.query(
        "UPDATE expense_reimbursement SET posted_to_journal=true, journal_entry_id=$1, status='POSTED', updated_at=NOW() WHERE expense_id=$2",
        [entryId, id]
      );
    });

    return { message: "已記入日記帳", entry_no: entryNo, expense_no: expense.expense_no };
  }

  async getChartOfAccounts() {
    const hiddenParam = await this.em.query("SELECT param_value FROM system_param WHERE param_key = 'EXPENSE_HIDDEN_ACCOUNTS'");
    const hiddenIds = hiddenParam.length > 0 ? (hiddenParam[0].param_value || []) : [];
    let query = "SELECT account_id, account_code, account_name, account_type FROM chart_of_accounts WHERE account_type = 'EXPENSE'";
    if (hiddenIds.length > 0) {
      query += " AND account_id NOT IN (" + hiddenIds.map((_, i) => "$" + (i + 1)).join(",") + ")";
    }
    query += " ORDER BY account_code";
    return this.em.query(query, hiddenIds);
  }

  async getHiddenAccounts() {
    const r = await this.em.query("SELECT param_value FROM system_param WHERE param_key = 'EXPENSE_HIDDEN_ACCOUNTS'");
    return r.length > 0 ? (r[0].param_value || []) : [];
  }

  async updateHiddenAccounts(accountIds) {
    await this.em.query(
      "UPDATE system_param SET param_value = $1, updated_at = CURRENT_TIMESTAMP WHERE param_key = 'EXPENSE_HIDDEN_ACCOUNTS'",
      [JSON.stringify(accountIds)]
    );
    return { hidden_ids: accountIds };
  }
}
