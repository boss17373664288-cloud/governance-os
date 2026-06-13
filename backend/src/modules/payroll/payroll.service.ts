import { Injectable, HttpException, OnModuleInit } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { v4 as uuidv4 } from "uuid";

// 2025 Taiwan rates
const LABOR_RATE = 0.12;       // 勞保費率 12%
const LABOR_EE_SHARE = 0.20;   // 員工負擔 20%
const LABOR_ER_SHARE = 0.70;   // 公司負擔 70%

const HEALTH_RATE = 0.0517;    // 健保費率 5.17%
const HEALTH_EE_SHARE = 0.30;  // 員工負擔 30%
const HEALTH_ER_SHARE = 0.60;  // 公司負擔 60%

const PENSION_ER = 0.06;       // 勞退公司強制 6%

const LABOR_INSURED_SALARY_GRADES = [
  28590, 28800, 30300, 31800, 33300, 34800, 36300, 38200, 40100, 42000,
  43900, 45800, 48200, 50600, 53000, 55400, 57800, 60800, 63800, 66800,
  69800, 72800, 76500, 80200, 83900, 87600, 91300, 95000, 98700, 102400,
  106100, 109800, 113500, 117200, 120900, 124600, 128300, 132000, 135700, 139400,
  143100, 146800, 150500, 154200, 157900, 161600, 165300, 169000, 172700, 176400,
  180100, 183800, 187500, 191200, 194900, 198600, 202300, 206000, 209700, 213400,
  217100, 220800, 224500, 228200, 231900, 235600, 239300, 243000, 246700, 250400,
  254100, 257800, 261500, 265200, 268900, 272600, 276300, 280000, 283700, 287400,
  291100, 294800, 298500, 302200, 305900, 309600, 313300, 317000, 320700, 324400,
  328100, 331800, 335500, 339200, 342900, 346600, 350300, 354000, 357700, 361400,
  365100, 368800, 372500, 376200, 379900, 383600, 387300, 391000, 394700, 398400,
  402100, 405800, 409500, 413200, 416900, 420600, 424300, 428000, 431700, 435400,
  439100, 442800, 446500, 450200, 453900, 457600, 461300, 465000, 468700, 472400,
  476100, 479800, 483500, 487200, 490900, 494600, 498300, 502000, 505700, 509400,
  513100, 516800, 520500, 524200, 527900, 531600, 535300, 539000, 542700, 546400
];

export interface PayrollCalcResult {
  insured_salary: number;
  labor_ee: number;
  labor_er: number;
  health_ee: number;
  health_er: number;
  pension_er: number;
  pension_ee: number;
  total_deductions: number;
  net_salary: number;
}

@Injectable()
export class PayrollService implements OnModuleInit {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async onModuleInit() {
    await this.em.query(`
      CREATE TABLE IF NOT EXISTS employee_salary_config (
        config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employee_master(employee_id) ON DELETE CASCADE,
        base_salary NUMERIC(18,2) NOT NULL DEFAULT 0,
        allowances NUMERIC(18,2) NOT NULL DEFAULT 0,
        management_bonus NUMERIC(18,2) NOT NULL DEFAULT 0,
        housing_allowance NUMERIC(18,2) NOT NULL DEFAULT 0,
        festival_bonus NUMERIC(18,2) NOT NULL DEFAULT 0,
        birthday_bonus NUMERIC(18,2) NOT NULL DEFAULT 0,
        year_end_bonus NUMERIC(18,2) NOT NULL DEFAULT 0,
        insured_salary INTEGER NOT NULL DEFAULT 30300,
        dependents INTEGER NOT NULL DEFAULT 0,
        voluntary_pension DECIMAL(3,0) NOT NULL DEFAULT 0 CHECK (voluntary_pension >= 0 AND voluntary_pension <= 6),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id)
      )
    `);
    await this.em.query(`
      CREATE TABLE IF NOT EXISTS payroll_item (
        payroll_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employee_master(employee_id),
        payroll_month VARCHAR(6) NOT NULL,
        gross_salary NUMERIC(18,2) NOT NULL DEFAULT 0,
        insured_salary INTEGER NOT NULL DEFAULT 30300,
        labor_insurance_ee NUMERIC(18,2) NOT NULL DEFAULT 0,
        labor_insurance_er NUMERIC(18,2) NOT NULL DEFAULT 0,
        health_insurance_ee NUMERIC(18,2) NOT NULL DEFAULT 0,
        health_insurance_er NUMERIC(18,2) NOT NULL DEFAULT 0,
        pension_er NUMERIC(18,2) NOT NULL DEFAULT 0,
        pension_ee NUMERIC(18,2) NOT NULL DEFAULT 0,
        other_deductions NUMERIC(18,2) NOT NULL DEFAULT 0,
        other_additions NUMERIC(18,2) NOT NULL DEFAULT 0,
        net_salary NUMERIC(18,2) NOT NULL DEFAULT 0,
        notes TEXT,
        posted_to_journal BOOLEAN NOT NULL DEFAULT false,
        journal_entry_id UUID,
        created_by UUID,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private findGrade(salary: number): number {
    for (const g of LABOR_INSURED_SALARY_GRADES) {
      if (salary <= g) return g;
    }
    return LABOR_INSURED_SALARY_GRADES[LABOR_INSURED_SALARY_GRADES.length - 1];
  }

  calculateBreakdown(insuredSalary: number, dependents: number, voluntaryPension: number, grossSalary: number): PayrollCalcResult {
    const laborEe = Math.round(insuredSalary * LABOR_RATE * LABOR_EE_SHARE);
    const laborEr = Math.round(insuredSalary * LABOR_RATE * LABOR_ER_SHARE);
    const healthEe = Math.round(insuredSalary * HEALTH_RATE * HEALTH_EE_SHARE * (1 + dependents));
    const healthEr = Math.round(insuredSalary * HEALTH_RATE * HEALTH_ER_SHARE * (1 + dependents * 0.7));
    const pensionEr = Math.round(insuredSalary * PENSION_ER);
    const pensionEe = Math.round(insuredSalary * (voluntaryPension / 100));
    const totalDeductions = laborEe + healthEe + pensionEe;
    const netSalary = grossSalary - totalDeductions;

    return { insured_salary: insuredSalary, labor_ee: laborEe, labor_er: laborEr, health_ee: healthEe, health_er: healthEr, pension_er: pensionEr, pension_ee: pensionEe, total_deductions: totalDeductions, net_salary: netSalary };
  }

  async getConfigs() {
    return this.em.query(`
      SELECT esc.*, em.full_name, em.employee_no
      FROM employee_salary_config esc
      JOIN employee_master em ON em.employee_id = esc.employee_id
      ORDER BY em.employee_no
    `);
  }

  async saveConfig(body: any) {
    const existing = await this.em.query("SELECT config_id FROM employee_salary_config WHERE employee_id = $1", [body.employee_id]);
    if (existing.length > 0) {
      await this.em.query(
        "UPDATE employee_salary_config SET base_salary=$1, allowances=$2, management_bonus=$3, housing_allowance=$4, festival_bonus=$5, birthday_bonus=$6, year_end_bonus=$7, insured_salary=$8, dependents=$9, voluntary_pension=$10, updated_at=NOW() WHERE employee_id=$11",
        [body.base_salary || 0, body.allowances || 0, body.management_bonus || 0, body.housing_allowance || 0, body.festival_bonus || 0, body.birthday_bonus || 0, body.year_end_bonus || 0, body.insured_salary || 30300, body.dependents || 0, body.voluntary_pension || 0, body.employee_id]
      );
    } else {
      await this.em.query(
        "INSERT INTO employee_salary_config (employee_id, base_salary, allowances, management_bonus, housing_allowance, festival_bonus, birthday_bonus, year_end_bonus, insured_salary, dependents, voluntary_pension) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [body.employee_id, body.base_salary || 0, body.allowances || 0, body.management_bonus || 0, body.housing_allowance || 0, body.festival_bonus || 0, body.birthday_bonus || 0, body.year_end_bonus || 0, body.insured_salary || 30300, body.dependents || 0, body.voluntary_pension || 0]
      );
    }
    return { message: "已儲存" };
  }

  async calculatePreview(employeeId: string, month: string) {
    const configs = await this.em.query("SELECT * FROM employee_salary_config WHERE employee_id = $1", [employeeId]);
    if (configs.length === 0) throw new HttpException("該員工尚無薪資設定", 400);
    const cfg = configs[0];
    const grossSalary = Number(cfg.base_salary) + Number(cfg.allowances) + Number(cfg.management_bonus) + Number(cfg.housing_allowance || 0) + Number(cfg.festival_bonus || 0) + Number(cfg.birthday_bonus || 0) + Number(cfg.year_end_bonus || 0);
    const dependents = cfg.dependents || 0;
    const voluntaryPension = Number(cfg.voluntary_pension) || 0;
    const result = this.calculateBreakdown(cfg.insured_salary, dependents, voluntaryPension, grossSalary);
    return { ...result, base_salary: Number(cfg.base_salary), allowances: Number(cfg.allowances), management_bonus: Number(cfg.management_bonus), housing_allowance: Number(cfg.housing_allowance || 0), festival_bonus: Number(cfg.festival_bonus || 0), birthday_bonus: Number(cfg.birthday_bonus || 0), year_end_bonus: Number(cfg.year_end_bonus || 0) };
  }

  async list(q: any) {
    const page = Math.max(1, parseInt(q.page) || 1);
    const pageSize = Math.min(100, parseInt(q.page_size) || 20);
    const offset = (page - 1) * pageSize;
    const rows = await this.em.query(
      `SELECT pi.*, em.full_name, em.employee_no
       FROM payroll_item pi
       JOIN employee_master em ON em.employee_id = pi.employee_id
       ORDER BY pi.payroll_month DESC, em.employee_no
       LIMIT $1 OFFSET $2`, [pageSize, offset]
    );
    const countR = await this.em.query("SELECT COUNT(*) as cnt FROM payroll_item");
    return { items: rows, total: parseInt(countR[0].cnt), page, page_size: pageSize };
  }

  async generateMonthly(body: any, userId: string) {
    const { payroll_month, employee_ids } = body;
    if (!payroll_month) throw new HttpException("請指定月份", 400);

    const configs = employee_ids && employee_ids.length > 0
      ? await this.em.query("SELECT esc.*, em.full_name FROM employee_salary_config esc JOIN employee_master em ON em.employee_id = esc.employee_id WHERE esc.employee_id = ANY($1)", [employee_ids])
      : await this.em.query("SELECT esc.*, em.full_name FROM employee_salary_config esc JOIN employee_master em ON em.employee_id = esc.employee_id");

    if (configs.length === 0) throw new HttpException("尚無員工薪資設定", 400);

    const results: any[] = [];
    for (const cfg of configs) {
      const existing = await this.em.query(
        "SELECT payroll_id FROM payroll_item WHERE employee_id=$1 AND payroll_month=$2",
        [cfg.employee_id, payroll_month]
      );
      if (existing.length > 0) {
        results.push({ employee_name: cfg.full_name, status: "已存在，跳過" });
        continue;
      }

      const grossSalary = Number(cfg.base_salary) + Number(cfg.allowances) + Number(cfg.management_bonus) + Number(cfg.housing_allowance || 0) + Number(cfg.festival_bonus || 0) + Number(cfg.birthday_bonus || 0) + Number(cfg.year_end_bonus || 0);
      const calc = this.calculateBreakdown(cfg.insured_salary, cfg.dependents || 0, Number(cfg.voluntary_pension) || 0, grossSalary);
      const payrollId = uuidv4();
      await this.em.query(
        `INSERT INTO payroll_item (payroll_id, employee_id, payroll_month, gross_salary, insured_salary,
          labor_insurance_ee, labor_insurance_er, health_insurance_ee, health_insurance_er,
          pension_er, pension_ee, net_salary, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [payrollId, cfg.employee_id, payroll_month, grossSalary, cfg.insured_salary,
         calc.labor_ee, calc.labor_er, calc.health_ee, calc.health_er,
         calc.pension_er, calc.pension_ee, calc.net_salary, null, userId]
      );
      results.push({ employee_name: cfg.full_name, gross_salary: grossSalary, net_salary: calc.net_salary, status: "已生成" });
    }
    return { generated: results.filter(r => r.status === "已生成").length, skipped: results.filter(r => r.status !== "已生成").length, details: results };
  }

  async getOne(id: string) {
    const rows = await this.em.query(
      `SELECT pi.*, em.full_name, em.employee_no
       FROM payroll_item pi
       JOIN employee_master em ON em.employee_id = pi.employee_id
       WHERE pi.payroll_id = $1`, [id]
    );
    if (rows.length === 0) throw new HttpException("不存在", 404);
    return rows[0];
  }

  async remove(id: string) {
    const rows = await this.em.query("SELECT posted_to_journal FROM payroll_item WHERE payroll_id = $1", [id]);
    if (rows.length === 0) throw new HttpException("不存在", 404);
    if (rows[0].posted_to_journal) throw new HttpException("已記入日記帳，不可刪除", 400);
    await this.em.query("DELETE FROM payroll_item WHERE payroll_id = $1", [id]);
    return { message: "已刪除" };
  }

  async postToJournal(id: string, userId: string) {
    const rows = await this.em.query(
      `SELECT pi.*, em.full_name, em.employee_no
       FROM payroll_item pi
       JOIN employee_master em ON em.employee_id = pi.employee_id
       WHERE pi.payroll_id = $1`, [id]
    );
    if (rows.length === 0) throw new HttpException("不存在", 404);
    const payroll = rows[0];
    if (payroll.posted_to_journal) throw new HttpException("已記入日記帳", 400);

    const totalDebit = Number(payroll.gross_salary) + Number(payroll.labor_insurance_er) + Number(payroll.health_insurance_er) + Number(payroll.pension_er);
    const totalCredit = Number(payroll.net_salary) + Number(payroll.labor_insurance_ee) + Number(payroll.health_insurance_ee) + Number(payroll.pension_ee)
                       + Number(payroll.labor_insurance_er) + Number(payroll.health_insurance_er) + Number(payroll.pension_er);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const countR = await this.em.query("SELECT COUNT(*) as cnt FROM journal_entry WHERE entry_no LIKE $1", ["JE" + dateStr + "%"]);
    const seq = String((parseInt(countR[0].cnt) || 0) + 1).padStart(4, "0");
    const entryNo = "JE" + dateStr + seq;
    const entryId = uuidv4();

    await this.em.transaction(async (tx: any) => {
      await tx.query(
        "INSERT INTO journal_entry (entry_id, entry_no, entry_date, description, source_type, source_id, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [entryId, entryNo, new Date(), "薪資-" + payroll.full_name + "-" + payroll.payroll_month, "PAYROLL", payroll.payroll_id, userId]
      );

      // Debit: 薪資費用 (gross + employer burdens)
      await tx.query(
        "INSERT INTO journal_line (entry_id, account_id, debit, credit, description) SELECT $1, account_id, $2, 0, $3 FROM chart_of_accounts WHERE account_code = '5101'",
        [entryId, totalDebit, "薪資費用 - " + payroll.full_name]
      );

      // Credit: 銀行存款 (net salary)
      await tx.query(
        "INSERT INTO journal_line (entry_id, account_id, debit, credit, description) SELECT $1, account_id, 0, $2, $3 FROM chart_of_accounts WHERE account_code = '1002'",
        [entryId, Number(payroll.net_salary), "實發薪資 - " + payroll.full_name]
      );

      // Credit: 應付勞保費 (ee + er)
      await tx.query(
        "INSERT INTO journal_line (entry_id, account_id, debit, credit, description) SELECT $1, account_id, 0, $2, $3 FROM chart_of_accounts WHERE account_code = '2121'",
        [entryId, Number(payroll.labor_insurance_ee) + Number(payroll.labor_insurance_er), "勞保費 - " + payroll.full_name]
      );

      // Credit: 應付健保費 (ee + er)
      await tx.query(
        "INSERT INTO journal_line (entry_id, account_id, debit, credit, description) SELECT $1, account_id, 0, $2, $3 FROM chart_of_accounts WHERE account_code = '2122'",
        [entryId, Number(payroll.health_insurance_ee) + Number(payroll.health_insurance_er), "健保費 - " + payroll.full_name]
      );

      // Credit: 應付勞退金 (ee + er)
      await tx.query(
        "INSERT INTO journal_line (entry_id, account_id, debit, credit, description) SELECT $1, account_id, 0, $2, $3 FROM chart_of_accounts WHERE account_code = '2123'",
        [entryId, Number(payroll.pension_ee) + Number(payroll.pension_er), "勞退金 - " + payroll.full_name]
      );

      await tx.query(
        "UPDATE payroll_item SET posted_to_journal=true, journal_entry_id=$1, updated_at=NOW() WHERE payroll_id=$2",
        [entryId, id]
      );
    });

    return { message: "已記入日記帳", entry_no: entryNo };
  }
}
