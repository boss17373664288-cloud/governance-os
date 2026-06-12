import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly eventEmitter: EventEmitter2
  ) {}

  private async getTenantId(): Promise<string> { return "f05423ce-13ae-42c5-9c78-12bb759048bd"; }

  // ====== Dashboard ======
  async getDashboard(): Promise<any> {
    const tenantId = await this.getTenantId();
    const rows: any[] = await this.em.query(
      `SELECT * FROM budget_plan WHERE tenant_id = $1 ORDER BY budget_year DESC, department`,
      [tenantId]
    );
    let totalPlanned = 0, totalSpent = 0;
    const deptMap: Record<string, { planned: number; spent: number }> = {};
    for (const r of rows) {
      const p = Number(r.planned_amount) || 0;
      const s = Number(r.spent_amount) || 0;
      totalPlanned += p;
      totalSpent += s;
      const dept = r.department || "未分類";
      if (!deptMap[dept]) deptMap[dept] = { planned: 0, spent: 0 };
      deptMap[dept].planned += p;
      deptMap[dept].spent += s;
    }
    const departments = Object.entries(deptMap).map(([name, v]) => ({
      name, planned: v.planned, spent: v.spent,
      pct: v.planned ? Math.round((v.spent / v.planned) * 100) : 0,
    }));
    const overrunAlerts: string[] = [];
    for (const d of departments) {
      if (d.pct >= 100) overrunAlerts.push(`${d.name} 預算已耗盡 (${d.pct}%)`);
      else if (d.pct >= 80) overrunAlerts.push(`${d.name} 預算使用已達 ${d.pct}%，即將超支`);
    }
    return {
      total_planned: totalPlanned,
      total_spent: totalSpent,
      departments,
      overrun_alerts: overrunAlerts,
    };
  }

  // ====== Budget Plan CRUD ======
  async listPlans(year?: number, department?: string) {
    const tenantId = await this.getTenantId();
    let sql = "SELECT * FROM budget_plan WHERE tenant_id = $1";
    const params: any[] = [tenantId];
    if (year) { params.push(year); sql += ` AND budget_year = $${params.length}`; }
    if (department) { params.push(department); sql += ` AND department = $${params.length}`; }
    sql += " ORDER BY budget_year DESC, department, expense_type";
    return this.em.query(sql, params);
  }

  async createPlan(dto: { budget_year: number; budget_month?: number; department: string; expense_type: string; planned_amount: number; overrun_policy?: string }) {
    const tenantId = await this.getTenantId();
    const id = uuidv4();
    await this.em.query(
      `INSERT INTO budget_plan (budget_id, budget_year, budget_month, department, expense_type, planned_amount, overrun_policy, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, dto.budget_year, dto.budget_month || null, dto.department, dto.expense_type, dto.planned_amount, dto.overrun_policy || "BLOCK", tenantId]
    );
    return { budget_id: id, ...dto };
  }

  async updatePlan(budgetId: string, dto: { planned_amount?: number; overrun_policy?: string; department?: string; expense_type?: string }) {
    const sets: string[] = [];
    const params: any[] = [];
    if (dto.planned_amount !== undefined) { params.push(dto.planned_amount); sets.push(`planned_amount = $${params.length}`); }
    if (dto.overrun_policy) { params.push(dto.overrun_policy); sets.push(`overrun_policy = $${params.length}`); }
    if (dto.department) { params.push(dto.department); sets.push(`department = $${params.length}`); }
    if (dto.expense_type) { params.push(dto.expense_type); sets.push(`expense_type = $${params.length}`); }
    if (sets.length === 0) throw new HttpException("無變更內容", HttpStatus.BAD_REQUEST);
    sets.push("updated_at = CURRENT_TIMESTAMP");
    params.push(budgetId);
    await this.em.query(`UPDATE budget_plan SET ${sets.join(", ")} WHERE budget_id = $${params.length}`, params);
    return { success: true };
  }

  async deletePlan(budgetId: string) {
    await this.em.query("DELETE FROM budget_adjustment WHERE budget_id = $1", [budgetId]);
    await this.em.query("DELETE FROM budget_plan WHERE budget_id = $1", [budgetId]);
    return { success: true };
  }

  // ====== Budget Check ======
  async checkBudget(params: { department: string; expenseType: string; amount: number }): Promise<{ allowed: boolean; reason?: string }> {
    const tenantId = await this.getTenantId();
    const rows = await this.em.query(
      `SELECT * FROM budget_plan WHERE tenant_id = $1 AND department = $2 AND expense_type = $3`,
      [tenantId, params.department, params.expenseType]
    );
    if (rows.length === 0) {
      return { allowed: false, reason: `無 ${params.department} / ${this.labelFor(params.expenseType)} 的預算計畫` };
    }
    const plan = rows[0];
    const planned = Number(plan.planned_amount);
    const spent = Number(plan.spent_amount);
    const remaining = planned - spent;
    if (params.amount > remaining) {
      return { allowed: false, reason: `預算不足：剩餘 NT$ ${remaining.toLocaleString()}，需求 NT$ ${params.amount.toLocaleString()}` };
    }
    return { allowed: true };
  }

  private labelFor(expenseType: string): string {
    const map: Record<string, string> = { TRAVEL: "差旅費", ENTERTAINMENT: "交際費", OFFICE: "辦公費", MARKETING: "行銷費", RND: "研發費", OTHER: "其他" };
    return map[expenseType] || expenseType;
  }

  // ====== Budget Commit ======
  async commitBudget(params: { department: string; expenseType: string; amount: number; referenceId: string }) {
    const check = await this.checkBudget(params);
    if (!check.allowed) throw new HttpException(check.reason || "預算不足", HttpStatus.BAD_REQUEST);
    const tenantId = await this.getTenantId();
    await this.em.query(
      `UPDATE budget_plan SET spent_amount = spent_amount + $1, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $2 AND department = $3 AND expense_type = $4`,
      [params.amount, tenantId, params.department, params.expenseType]
    );
    this.eventEmitter.emit("financial.budget_committed", params);
    this.logger.log(`Budget committed: ${params.department} ${params.amount} for ${params.referenceId}`);
    return { success: true };
  }

  // ====== Budget Adjustment ======
  async listAdjustments(budgetId?: string) {
    let sql = "SELECT a.*, b.department, b.expense_type, b.budget_year FROM budget_adjustment a JOIN budget_plan b ON b.budget_id = a.budget_id";
    const params: any[] = [];
    if (budgetId) { params.push(budgetId); sql += ` WHERE a.budget_id = $${params.length}`; }
    sql += " ORDER BY a.created_at DESC";
    return this.em.query(sql, params);
  }

  async createAdjustment(dto: { budget_id: string; adjustment_type: string; adjustment_amount: number; reason?: string }) {
    const id = uuidv4();
    await this.em.query(
      `INSERT INTO budget_adjustment (adjustment_id, budget_id, adjustment_type, adjustment_amount, reason) VALUES ($1,$2,$3,$4,$5)`,
      [id, dto.budget_id, dto.adjustment_type, dto.adjustment_amount, dto.reason || null]
    );
    const sign = dto.adjustment_type === "INCREASE" ? "+" : "-";
    await this.em.query(
      `UPDATE budget_plan SET planned_amount = planned_amount ${sign} $1, updated_at = CURRENT_TIMESTAMP WHERE budget_id = $2`,
      [dto.adjustment_amount, dto.budget_id]
    );
    return { adjustment_id: id, ...dto };
  }

        // ====== Expense Type Management (pg-native JSON build) ======
  async listExpenseTypes() {
    const rows = await this.em.query("SELECT param_value FROM system_param WHERE param_key = 'enum_budget_expense_type'");
    if (rows.length > 0 && rows[0].param_value) {
      const val = rows[0].param_value;
      return typeof val === "object" ? val : JSON.parse(typeof val === "string" ? val : JSON.stringify(val));
    }
    return [];
  }

  async addExpenseType(code: string, label: string) {
    // Check if code already exists
    const existing = await this.em.query(
      "SELECT 1 FROM system_param WHERE param_key = $1 AND param_value @> $2::jsonb",
      ["enum_budget_expense_type", JSON.stringify([{ code }])]
    );
    if (existing.length > 0) throw new (require("@nestjs/common").HttpException)("此代碼已存在", 400);
    
    // Use pg-native jsonb_build_object to avoid Node.js encoding issues
    await this.em.query(
      "UPDATE system_param SET param_value = param_value || jsonb_build_array(jsonb_build_object('code', $1::text, 'label', $2::text)), updated_at = CURRENT_TIMESTAMP WHERE param_key = 'enum_budget_expense_type'",
      [code, label]
    );
    return { success: true };
  }

  async deleteExpenseType(code: string) {
    await this.em.query(
      "UPDATE system_param SET param_value = (SELECT jsonb_agg(elem) FROM jsonb_array_elements(param_value) AS elem WHERE elem->>'code' <> $1), updated_at = CURRENT_TIMESTAMP WHERE param_key = 'enum_budget_expense_type'",
      [code]
    );
    return { success: true };
  }

}