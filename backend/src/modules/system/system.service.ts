import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";

import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  // ====== Enums ======
  async getEnums(type?: string) {
    const allEnums: Record<string, any[]> = {
      customer_type: [
        { code: "HOSPITAL", label: "醫院" }, { code: "CLINIC", label: "診所" },
        { code: "DISTRIBUTOR", label: "經銷商" }, { code: "PERSONAL", label: "個人" },
      ],
      customer_source: [
        { code: "SELF_DEV", label: "自主開發" }, { code: "EXHIBITION", label: "展會獲取" },
        { code: "REFERRAL", label: "客戶轉介紹" }, { code: "ONLINE", label: "線上諮詢" },
        { code: "AGENT", label: "代理商" }, { code: "OTHER", label: "其他" },
      ],
      industry_type: [
        { code: "HOSPITAL", label: "醫院" }, { code: "CLINIC", label: "診所" },
        { code: "BEAUTY_SALON", label: "美容院" }, { code: "PHARMACY", label: "藥房" },
        { code: "DISTRIBUTOR", label: "經銷商" }, { code: "ONLINE_SHOP", label: "電商" },
        { code: "OTHER", label: "其他" },
      ],
      payment_terms: [
        { code: "CASH", label: "現金" }, { code: "TRANSFER", label: "匯款" },
        { code: "CASH_DUPLICATE", label: "現金/二聯" }, { code: "TRANSFER_CHECK", label: "匯款/支票" },
        { code: "NET_30", label: "月結30天" }, { code: "NET_60", label: "月結60天" },
        { code: "NET_90", label: "月結90天" },
        { code: "CHECK", label: "支票" }, { code: "DUPLICATE", label: "二聯" },
      ],
      recall_level: [
        { code: "R1", label: "觀察" }, { code: "R2", label: "內部限制" },
        { code: "R3", label: "正式召回" }, { code: "R4", label: "緊急召回" },
      ],
      product_category: [
        { code: "DEVICE", label: "醫療器材" }, { code: "COSMETIC", label: "化妝品" },
        { code: "CONSUMABLE", label: "耗材" }, { code: "EQUIPMENT", label: "設備" },
        { code: "RAW_MATERIAL", label: "原料" },
      ],
      customer_status: [
        { code: "LEAD", label: "線索" }, { code: "DEVELOPING", label: "開發中" },
        { code: "SAMPLING", label: "打板中" }, { code: "A", label: "A級" },
        { code: "B", label: "B級" }, { code: "C", label: "C級" },
        { code: "VIP", label: "VIP" }, { code: "INACTIVE", label: "停用" },
      ],
      region_code: [
        { code: "NORTH", label: "北區" }, { code: "CENTRAL", label: "中區" },
        { code: "SOUTH", label: "南區" }, { code: "EAST", label: "東區" },
      ],
      visit_type: [
        { code: "ROUTINE", label: "常規拜訪" }, { code: "NEW_VISIT", label: "新客戶拜訪" },
        { code: "FOLLOW_UP", label: "追蹤回訪" }, { code: "COMPLAINT", label: "客訴處理" },
      ],
      visit_result: [
        { code: "INTERESTED", label: "有興趣" }, { code: "NOT_INTERESTED", label: "無興趣" },
        { code: "NEED_FOLLOWUP", label: "需追蹤" }, { code: "READY_TO_ORDER", label: "準備下單" },
        { code: "NEED_SAMPLE", label: "需樣品" }, { code: "NEED_QUOTE", label: "需報價" },
        { code: "PRICE_ISSUE", label: "價格問題" }, { code: "PAYMENT_ISSUE", label: "回款問題" },
      ],
    };
    if (type) return allEnums[type] || [];
    return allEnums;
  }

  // ====== System Params ======
  async getParams() {
    const params = await this.em.query("SELECT * FROM system_param ORDER BY param_key");
    return params.map((p: any) => ({
      ...p,
      param_value: typeof p.param_value === "string" ? p.param_value : JSON.stringify(p.param_value),
    }));
  }

  async updateParam(key: string, value: string, userId: string) {
    const params = await this.em.query("SELECT * FROM system_param WHERE param_key = $1", [key]);
    if (params.length === 0) throw new HttpException({ errorCode: "SYSTEM_001", message: "參數不存在" }, HttpStatus.NOT_FOUND);

    const param = params[0];
    let typedValue: any = value;
    if (param.param_type === "NUMBER") typedValue = Number(value);
    else if (param.param_type === "BOOLEAN") typedValue = value === "true";
    else if (param.param_type === "ARRAY") typedValue = JSON.parse(value);

    await this.em.query(
      "UPDATE system_param SET param_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE param_key = $3",
      [JSON.stringify(typedValue), userId, key]
    );

    await this.writeAudit(userId, "SYSTEM_PARAM_UPDATE", "system_param", params[0].param_id,
      { param_value: param.param_value }, { param_value: JSON.stringify(typedValue) }
    );

    this.logger.log(`Param ${key} updated by ${userId}`);
    return { param_key: key, param_value: typedValue };
  }

  // ====== Roles ======
  async getRoles() {
    const roles = await this.em.query(`
      SELECT r.*, 
        (SELECT COUNT(*) FROM employee_master WHERE role_code = r.role_code AND deleted_at IS NULL AND is_active = true) as user_count,
        (SELECT COUNT(*) FROM role_permission WHERE role_id = r.role_id) as permission_count
      FROM role r ORDER BY r.role_code
    `);
    return roles;
  }

  async getRoleDetail(roleId: string) {
    const roles = await this.em.query("SELECT * FROM role WHERE role_id = $1", [roleId]);
    if (roles.length === 0) throw new HttpException({ errorCode: "SYSTEM_002", message: "角色不存在" }, HttpStatus.NOT_FOUND);
    return roles[0];
  }

  async updateRole(roleId: string, dto: any, userId: string) {
    const roles = await this.em.query("SELECT * FROM role WHERE role_id = $1", [roleId]);
    if (roles.length === 0) throw new HttpException({ errorCode: "SYSTEM_002", message: "角色不存在" }, HttpStatus.NOT_FOUND);
    if (dto.role_name) await this.em.query("UPDATE role SET role_name = $1, updated_at = CURRENT_TIMESTAMP WHERE role_id = $2", [dto.role_name, roleId]);
    if (dto.is_active !== undefined) await this.em.query("UPDATE role SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE role_id = $2", [dto.is_active, roleId]);
    if (dto.description !== undefined) await this.em.query("UPDATE role SET description = $1, updated_at = CURRENT_TIMESTAMP WHERE role_id = $2", [dto.description, roleId]);
    return this.getRoleDetail(roleId);
  }

  // ====== Permissions ======
  async getPermissions() {
    return this.em.query("SELECT * FROM permission ORDER BY resource_type, action");
  }

  // ====== Role-Permission Binding ======
  async getRolePermissions(roleId: string) {
    return this.em.query(
      `SELECT p.*, CASE WHEN rp.permission_id IS NOT NULL THEN true ELSE false END as assigned
       FROM permission p
       LEFT JOIN role_permission rp ON rp.permission_id = p.permission_id AND rp.role_id = $1
       ORDER BY p.resource_type, p.action`, [roleId]
    );
  }

  async setRolePermissions(roleId: string, permissionIds: string[], userId: string) {
    await this.em.transaction(async (tx) => {
      await tx.query("DELETE FROM role_permission WHERE role_id = $1", [roleId]);
      for (const pid of permissionIds) {
        await tx.query("INSERT INTO role_permission (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [roleId, pid]);
      }
    });
    this.logger.log(`Role ${roleId} permissions updated by ${userId}`);
    return { role_id: roleId, permission_count: permissionIds.length };
  }

  // ====== Users ======
  async getUsers(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(query.page_size) || 20));
    const offset = (page - 1) * pageSize;
    const search = query.search || "";

    let where = "WHERE e.deleted_at IS NULL";
    const params: any[] = [];
    let pi = 0;

    if (search) {
      pi++; where += ` AND (e.full_name ILIKE $${pi} OR e.employee_no ILIKE $${pi} OR e.email ILIKE $${pi})`;
      params.push(`%${search}%`);
    }
    if (query.role_code) {
      pi++; where += ` AND e.role_code = $${pi}`;
      params.push(query.role_code);
    }

    const countR = await this.em.query(`SELECT COUNT(*) as cnt FROM employee_master e ${where}`, params);
    const total = parseInt(countR[0].cnt);

    pi++; params.push(pageSize);
    pi++; params.push(offset);

    const items = await this.em.query(
      `SELECT e.employee_id, e.employee_no, e.full_name, e.display_name, e.email, e.phone, e.mobile, e.job_title, e.role_code, e.birth_date, e.region_code,
        e.is_active, e.last_login_at, e.last_login_ip, e.status, e.created_at,
        (SELECT COUNT(*) FROM device_binding WHERE employee_id = e.employee_id) as device_count
       FROM employee_master e ${where}
       ORDER BY e.employee_no LIMIT $${pi - 1} OFFSET $${pi}`, params
    );

    return { items, pagination: { page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) } };
  }

  async createUser(dto: any, userId: string) {
    const exists = await this.em.query("SELECT employee_id FROM employee_master WHERE employee_no = $1", [dto.employee_no]);
    if (exists.length > 0) throw new HttpException({ errorCode: "SYSTEM_003", message: "員工編號已存在" }, HttpStatus.BAD_REQUEST);

    // Simple password hash - in production use bcrypt
    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash(dto.password || "123456", 10);

    const empId = uuidv4();
    await this.em.query(
      `INSERT INTO employee_master (employee_id, employee_no, full_name, display_name, role_code, job_title, region_code, email, phone, mobile, birth_date, password_hash, tenant_id, is_active, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,'ACTIVE',$13)`,
      [empId, dto.employee_no, dto.full_name, dto.display_name || null, dto.role_code, dto.job_title || null, dto.region_code || null, dto.email || null, dto.phone || null, dto.mobile || null, dto.birth_date || null,
       passwordHash, "00000000-0000-0000-0000-000000000001", userId]
    );

    this.logger.log(`User ${dto.employee_no} created by ${userId}`);
    return { employee_id: empId, employee_no: dto.employee_no, full_name: dto.full_name };
  }

  async deleteUser(empId: string) {
    const emps = await this.em.query("SELECT * FROM employee_master WHERE employee_id = $1", [empId]);
    if (emps.length === 0) throw new (require("@nestjs/common").HttpException)({ errorCode: "SYSTEM_004", message: "使用者不存在" }, 404);
    await this.em.query("DELETE FROM employee_master WHERE employee_id = $1", [empId]);
    return { message: "已刪除" };
  }

  async updateUser(empId: string, dto: any, userId: string) {
    const emps = await this.em.query("SELECT * FROM employee_master WHERE employee_id = $1", [empId]);
    if (emps.length === 0) throw new HttpException({ errorCode: "SYSTEM_004", message: "使用者不存在" }, HttpStatus.NOT_FOUND);

    const fields: string[] = [];
    const vals: any[] = [];
    let vi = 0;
    if (dto.full_name !== undefined) { vi++; fields.push(`full_name=$${vi}`); vals.push(dto.full_name); }
    if (dto.role_code !== undefined) { vi++; fields.push(`role_code=$${vi}`); vals.push(dto.role_code); }
    if (dto.region_code !== undefined) { vi++; fields.push(`region_code=$${vi}`); vals.push(dto.region_code); }
    if (dto.email !== undefined) { vi++; fields.push(`email=$${vi}`); vals.push(dto.email); }
    if (dto.phone !== undefined) { vi++; fields.push(`phone=$${vi}`); vals.push(dto.phone); }
    if (dto.mobile !== undefined) { vi++; fields.push(`mobile=$${vi}`); vals.push(dto.mobile); }
    if (dto.display_name !== undefined) { vi++; fields.push(`display_name=$${vi}`); vals.push(dto.display_name); }
    if (dto.job_title !== undefined) { vi++; fields.push(`job_title=$${vi}`); vals.push(dto.job_title); }
    if (dto.is_active !== undefined) { vi++; fields.push(`is_active=$${vi}`); vals.push(dto.is_active); }

    if (fields.length > 0) {
      vi++; fields.push("updated_at=CURRENT_TIMESTAMP");
      vi++; fields.push(`updated_by=$${vi}`); vals.push(userId);
      vi++; vals.push(empId);
      await this.em.query(`UPDATE employee_master SET ${fields.join(",")} WHERE employee_id=$${vi}`, vals);
    }

    return this.em.query("SELECT employee_id, employee_no, full_name, role_code, region_code, email, is_active FROM employee_master WHERE employee_id = $1", [empId]).then(r => r[0]);
  }

  // ====== Audit Log ======
  async getAuditLogs(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const pageSize = Math.min(100, parseInt(query.page_size) || 50);
    const offset = (page - 1) * pageSize;

    let where = "WHERE 1=1";
    const params: any[] = [];
    let pi = 0;
    if (query.user_id) { pi++; where += ` AND user_id=$${pi}`; params.push(query.user_id); }
    if (query.action) { pi++; where += ` AND action=$${pi}`; params.push(query.action); }

    const countR = await this.em.query(`SELECT COUNT(*) as cnt FROM audit_log ${where}`, params);
    const total = parseInt(countR[0].cnt);

    pi++; params.push(pageSize);
    pi++; params.push(offset);

    const items = await this.em.query(
      `SELECT al.*, em.full_name, em.employee_no FROM audit_log al LEFT JOIN employee_master em ON em.employee_id = al.user_id ${where} ORDER BY al.created_at DESC LIMIT $${pi - 1} OFFSET $${pi}`, params
    );
    return { items, pagination: { page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) } };
  }

  // ====== Device Binding ======
  async getDevices(query: any) {
    const items = await this.em.query(`
      SELECT db.*, e.employee_no, e.full_name
      FROM device_binding db
      JOIN employee_master e ON e.employee_id = db.employee_id
      ORDER BY db.created_at DESC
    `);
    return { items, total: items.length };
  }

  async unbindDevice(deviceId: string, reason: string, userId: string) {
    const devices = await this.em.query("SELECT * FROM device_binding WHERE device_id = $1", [deviceId]);
    if (devices.length === 0) throw new HttpException({ errorCode: "SYSTEM_005", message: "設備不存在" }, HttpStatus.NOT_FOUND);

    await this.em.query("DELETE FROM device_binding WHERE device_id = $1", [deviceId]);
    await this.writeAudit(userId, "DEVICE_UNBIND", "device_binding", deviceId, { reason }, { status: "unbound" });
    return { device_id: deviceId, status: "unbound" };
  }

  // ====== Helper ======
  private async writeAudit(userId: string, action: string, entityType: string, entityId: string, oldVal: any, newVal: any) {
    try {
      await this.em.query(
        `INSERT INTO audit_log (log_id, user_id, action, entity_type, entity_id, old_value, new_value, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP)`,
        [uuidv4(), userId, action, entityType, entityId, oldVal ? JSON.stringify(oldVal) : null, newVal ? JSON.stringify(newVal) : null]
      );
    } catch (e) { this.logger.error("Audit write failed: " + e.message); }
  }

  // ====== Profile ======
  async getProfile(userId: string) {
    const emps = await this.em.query(
      `SELECT employee_id, employee_no, full_name, display_name, email, phone, mobile, role_code, region_code,
        is_active, last_login_at, last_login_ip, mfa_enabled, created_at
       FROM employee_master WHERE employee_id = $1`, [userId]
    );
    if (emps.length === 0) throw new HttpException({ errorCode: "SYSTEM_004", message: "使用者不存在" }, HttpStatus.NOT_FOUND);
    const devices = await this.em.query("SELECT * FROM device_binding WHERE employee_id = $1 ORDER BY created_at DESC", [userId]);
    return { ...emps[0], devices };
  }

  async updateProfile(userId: string, dto: any) {
    const fields: string[] = []; const vals: any[] = []; let vi = 0;
    if (dto.full_name !== undefined) { vi++; fields.push("full_name=${vi}"); vals.push(dto.full_name); }
    if (dto.email !== undefined) { vi++; fields.push("email=${vi}"); vals.push(dto.email); }
    if (dto.phone !== undefined) { vi++; fields.push("phone=${vi}"); vals.push(dto.phone); }
    vi++; fields.push("updated_at=CURRENT_TIMESTAMP");
    vi++; vals.push(userId);
    await this.em.query(`UPDATE employee_master SET ${fields.join(",")} WHERE employee_id=${vi}`, vals);
    return this.getProfile(userId);
  }

  async changePassword(userId: string, dto: any) {
    if (!dto.old_password || !dto.new_password) throw new HttpException({ errorCode: "SYSTEM_006", message: "請輸入舊密碼和新密碼" }, HttpStatus.BAD_REQUEST);
    if (dto.new_password.length < 6) throw new HttpException({ errorCode: "SYSTEM_007", message: "新密碼至少6位" }, HttpStatus.BAD_REQUEST);

    const emps = await this.em.query("SELECT password_hash FROM employee_master WHERE employee_id = $1", [userId]);
    const bcrypt = require("bcryptjs");
    const valid = await bcrypt.compare(dto.old_password, emps[0].password_hash);
    if (!valid) throw new HttpException({ errorCode: "SYSTEM_008", message: "舊密碼不正確" }, HttpStatus.BAD_REQUEST);

    const newHash = await bcrypt.hash(dto.new_password, 10);
    await this.em.query("UPDATE employee_master SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $2", [newHash, userId]);
    await this.writeAudit(userId, "PASSWORD_CHANGE", "employee_master", userId, null, { action: "password_changed" });
    return { message: "密碼已更新" };
  }

  async getMyDevices(userId: string) {
    return this.em.query("SELECT * FROM device_binding WHERE employee_id = $1 ORDER BY created_at DESC", [userId]);
  }

  async unbindMyDevice(deviceId: string, userId: string) {
    const devices = await this.em.query("SELECT * FROM device_binding WHERE device_id = $1 AND employee_id = $2", [deviceId, userId]);
    if (devices.length === 0) throw new HttpException({ errorCode: "SYSTEM_005", message: "設備不存在或無權限" }, HttpStatus.FORBIDDEN);
    await this.em.query("DELETE FROM device_binding WHERE device_id = $1", [deviceId]);
    await this.writeAudit(userId, "DEVICE_SELF_UNBIND", "device_binding", deviceId, null, { status: "self_unbound" });
    return { device_id: deviceId, status: "unbound" };
  }

  // ====== Export ======
  private toCsv(headers: string[], rows: any[][]): string {
    return [headers.map(h => `"${h}"`).join(","), ...rows.map(row => row.map(c => `"${String(c ?? "").replace(/"/g, "\"\"")}"`).join(","))].join("\r\n");
  }

  async exportCustomersData(): Promise<string> {
    const rows = await this.em.query(`SELECT cm.customer_code, cm.old_erp_customer_code, cm.customer_name, cm.customer_short_name, 
        cm.customer_type, cm.customer_source, cm.industry_type, cm.unified_business_no, cm.medical_institution_code,
        cm.contact_person, cm.contact_position, cm.mobile_phone, cm.contact_email, cm.phone, cm.email, cm.website,
        cm.company_zip_code, cm.company_address, cm.shipping_address, cm.shipping_recipient, cm.shipping_recipient_phone,
        cm.billing_address, cm.billing_recipient, cm.billing_recipient_phone, cm.invoice_remark,
        cm.business_hours_start, cm.business_hours_end, cm.payment_terms, cm.closing_day, cm.invoice_date, cm.credit_days,
        cm.credit_limit, cm.credit_status, cm.outstanding_ar, cm.consignment_balance, cm.contract_signed, cm.allow_transaction,
        cm.pause_start_date, em.full_name as owning_employee_name, cm.region_code, cm.customer_status, cm.total_sample_count,
        cm.import_source, cm.created_at
        FROM customer_master cm
        LEFT JOIN employee_master em ON em.employee_id = cm.owning_employee_id
        WHERE cm.deleted_at IS NULL ORDER BY cm.customer_code`);
    return this.toCsv([
        "客戶編碼","客戶舊編碼","客戶名稱","客戶簡稱","客戶類型","客戶來源","行業類型","統一編號","醫療機構代碼",
        "聯絡人","聯絡人職稱","手機","聯絡Email","公司電話","公司Email","網站",
        "郵遞區號","公司地址","送貨地址","收貨人","收貨人電話",
        "發票地址","收票人","收票人電話","發票備註",
        "營業開始","營業結束","付款條件","結帳日","請款日","信用天數",
        "信用額度","信用狀態","未收AR","寄庫餘額","合約已簽","允許交易",
        "暫停起始日","負責業務","區域","客戶狀態","累計打板次數",
        "導入來源","建檔日期"
      ], rows.map((r:any) => [
        r.customer_code, r.old_erp_customer_code, r.customer_name, r.customer_short_name,
        r.customer_type, r.customer_source, r.industry_type, r.unified_business_no, r.medical_institution_code,
        r.contact_person, r.contact_position, r.mobile_phone, r.contact_email, r.phone, r.email, r.website,
        r.company_zip_code, r.company_address, r.shipping_address, r.shipping_recipient, r.shipping_recipient_phone,
        r.billing_address, r.billing_recipient, r.billing_recipient_phone, r.invoice_remark,
        r.business_hours_start, r.business_hours_end, r.payment_terms, r.closing_day, r.invoice_date, r.credit_days,
        r.credit_limit, r.credit_status, r.outstanding_ar, r.consignment_balance, r.contract_signed ? "是" : "否", r.allow_transaction ? "是" : "否",
        r.pause_start_date ? new Date(r.pause_start_date).toISOString().slice(0,10) : "", r.owning_employee_name, r.region_code, r.customer_status, r.total_sample_count,
        r.import_source, r.created_at ? new Date(r.created_at).toISOString().slice(0,10) : ""
      ]));
  }
  async exportProductsData(): Promise<string> {
    const rows = await this.em.query("SELECT product_code, product_name, product_category, base_price FROM product_master WHERE deleted_at IS NULL ORDER BY product_code");
    return this.toCsv(["產品編碼","產品名稱","類別","牌價"], rows.map((r:any) => [r.product_code, r.product_name, r.category, r.base_price]));
  }
  async exportSuppliersData(): Promise<string> {
    const rows = await this.em.query("SELECT supplier_code, supplier_name, contact_person, contact_phone, payment_terms FROM supplier_master WHERE deleted_at IS NULL ORDER BY supplier_code");
    return this.toCsv(["供應商編碼","名稱","聯絡人","電話","付款條件"], rows.map((r:any) => [r.supplier_code, r.supplier_name, r.contact_person, r.contact_phone, r.payment_terms]));
  }
  async exportOrdersData(): Promise<string> {
    const rows = await this.em.query("SELECT so.order_no, cm.customer_name, so.order_date, so.total_amount, so.status FROM sales_order so JOIN customer_master cm ON cm.customer_id = so.customer_id WHERE so.deleted_at IS NULL ORDER BY so.order_date DESC");
    return this.toCsv(["訂單編號","客戶","日期","金額","狀態"], rows.map((r:any) => [r.order_no, r.customer_name, r.order_date ? new Date(r.order_date).toISOString().slice(0,10) : "", r.total_amount, r.status]));
  }
  async exportFinanceArData(): Promise<string> {
    const rows = await this.em.query("SELECT so.order_no, cm.customer_name, ar.amount, ar.paid_amount, ar.due_date, ar.status FROM ar_detail ar JOIN sales_order so ON so.order_id = ar.order_id JOIN customer_master cm ON cm.customer_id = ar.customer_id ORDER BY ar.due_date ASC");
    return this.toCsv(["訂單編號","客戶","應收金額","已收金額","到期日","狀態"], rows.map((r:any) => [r.order_no, r.customer_name, r.amount, r.paid_amount, r.due_date ? new Date(r.due_date).toISOString().slice(0,10) : "", r.status]));
  }
  async exportAuditLogsData(): Promise<string> {
    const rows = await this.em.query("SELECT created_at, user_id, action, entity_type FROM audit_log ORDER BY created_at DESC LIMIT 5000");
    return this.toCsv(["時間","使用者","操作","對象類型"], rows.map((r:any) => [r.created_at ? new Date(r.created_at).toISOString() : "", r.user_id, r.action, r.entity_type]));
  }
    async exportEmployeesData(): Promise<string> {
    const rows = await this.em.query("SELECT employee_no, full_name, role_code, region_code, email, phone, is_active FROM employee_master WHERE deleted_at IS NULL ORDER BY employee_no LIMIT 5000");
    return this.toCsv(["員工編號","姓名","角色","區域","Email","電話","啟用"], rows.map((r:any) => [r.employee_no, r.full_name, r.role_code || "", r.region_code || "", r.email || "", r.phone || "", r.is_active ? "是" : "否"]));
  }

  async exportInventoryData(): Promise<string> {
    const rows = await this.em.query("SELECT b.batch_no, p.product_code, p.product_name, b.total_quantity, b.qa_status, b.expiry_date, b.manufacturer FROM batch_master b LEFT JOIN product_master p ON p.product_id::VARCHAR = b.product_id::VARCHAR ORDER BY b.batch_no LIMIT 5000");
    return this.toCsv(["批號","產品編碼","產品名稱","數量","QA狀態","效期","製造商"], rows.map((r:any) => [r.batch_no, r.product_code, r.product_name, r.total_quantity, r.qa_status, r.expiry_date ? new Date(r.expiry_date).toISOString().slice(0,10) : "", r.manufacturer]));
  }

  // ====== Import ======
  async importData(entity: string, body: any, userId: string) {
    const rows: any[] = body.rows || [];
    if (rows.length === 0) throw new HttpException("無匯入資料", HttpStatus.BAD_REQUEST);
    if (rows.length > 500) throw new HttpException("單次最多 500 筆", HttpStatus.BAD_REQUEST);

    let success = 0; let failed = 0; const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        switch (entity) {
          case "customers":
            await this.em.query(
              "INSERT INTO customer_master (customer_id, customer_code, customer_name, customer_short_name, customer_type, contact_person, phone, email, company_address, company_zip_code, tenant_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
              [uuidv4(), row.customer_code || ("CUST-" + Date.now() + "-" + i), row.customer_name, row.customer_name?.substring(0, 100) || row.customer_name, row.customer_type || "HOSPITAL", row.contact_person || null, row.phone || "", row.email || null, row.company_address || row.address || "", row.company_zip_code || "000", "00000000-0000-0000-0000-000000000001"]
            );
            break;
          case "products":
            await this.em.query(
              "INSERT INTO product_master (product_id, product_code, product_name, product_category, base_price) VALUES ($1,$2,$3,$4,$5)",
              [uuidv4(), row.product_code || ("PROD-" + Date.now() + "-" + i), row.product_name, row.product_category || "DEVICE", row.base_price || 0]
            );
            break;
          case "suppliers":
            await this.em.query(
              "INSERT INTO supplier_master (supplier_id, supplier_code, supplier_name, contact_person, contact_phone, payment_terms) VALUES ($1,$2,$3,$4,$5,$6)",
              [uuidv4(), row.supplier_code || ("SUPP-" + Date.now() + "-" + i), row.supplier_name, row.contact_person, row.contact_phone, row.payment_terms || "NET_30"]
            );
            break;
          case "employees":
            const bcrypt = require("bcryptjs");
            const pwdHash = await bcrypt.hash(row.password || "123456", 10);
            await this.em.query(
              "INSERT INTO employee_master (employee_id, employee_no, full_name, role_code, region_code, email, phone, password_hash, tenant_id, is_active, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,'ACTIVE')",
              [uuidv4(), row.employee_no || ("EMP-" + Date.now().toString(36).toUpperCase().slice(-6)), row.full_name, row.role_code || "SALES", row.region_code || "NORTH", row.email, row.phone, pwdHash, "00000000-0000-0000-0000-000000000001"]
            );
            break;
          case "inventory":
            await this.em.query(
              "INSERT INTO batch_master (batch_id, batch_no, product_id, expiry_date, manufacturer, qa_status, total_quantity) VALUES ($1,$2,$3,$4,$5,$6,$7)",
              [uuidv4(), row.batch_no || ("BT-" + Date.now() + "-" + i), row.product_id, row.expiry_date || null, row.manufacturer || null, row.qa_status || "PENDING", parseInt(row.total_quantity) || 0]
            );
            break;
          default:
            throw new Error("不支援的匯入類型: " + entity);
        }
        success++;
      } catch (e: any) {
        failed++;
        errors.push(`第 ${i + 1} 行: ${e.message}`);
      }
    }

    await this.writeAudit(userId, "IMPORT", entity, "", { total: rows.length, success, failed }, {});
    this.logger.log(`Import ${entity}: ${success} success, ${failed} failed`);
    return { entity, total: rows.length, success, failed, errors: errors.slice(0, 20) };
  }
  // ====== Account Applications ======
  async submitAccountApplication(dto: { applicant_name: string; applicant_email: string; applicant_phone?: string; company_name?: string; department?: string; reason?: string }) {
    if (!dto.applicant_name?.trim()) throw new HttpException({ message: "請填寫申請人姓名" }, 400);
    if (!dto.applicant_email?.trim()) throw new HttpException({ message: "請填寫Email" }, 400);

    const appId = uuidv4();
    await this.em.query(
      `INSERT INTO account_applications (application_id, applicant_name, applicant_email, applicant_phone, company_name, department, reason, status, tenant_id)
       VALUES (
},$2,$3,$4,$5,$6,$7,'PENDING','00000000-0000-0000-0000-000000000001')`,
      [appId, dto.applicant_name.trim(), dto.applicant_email.trim(), dto.applicant_phone || null, dto.company_name || null, dto.department || null, dto.reason || null]
    );

    // Create notification for admins
    try {
      const admins = await this.em.query("SELECT employee_id FROM employee_master WHERE role_code = 'ADMIN' AND deleted_at IS NULL LIMIT 5");
      for (const admin of admins) {
        const notiId = uuidv4();
        await this.em.query(
          `INSERT INTO notifications (notification_id, recipient_id, title, content, notification_type, entity_type, entity_id, is_read, tenant_id)
           VALUES ($1,$2,$3,$4,'SYSTEM','ACCOUNT_APPLICATION',$5,false,'00000000-0000-0000-0000-000000000001')`,
          [notiId, admin.employee_id, '新帳號申請', `${dto.applicant_name} (${dto.applicant_email}) 申請開通帳號`, appId]
        );
      }
    } catch (e) { this.logger.warn("Failed to create notification: " + e.message); }

    this.logger.log(`Account application submitted by ${dto.applicant_email}`);
    return { application_id: appId, message: "申請已提交，請等待管理員審批" };
  }

  async getAccountApplications(query: { status?: string; page?: number; page_size?: number }) {
    const page = query.page || 1;
    const pageSize = query.page_size || 20;
    const offset = (page - 1) * pageSize;

    const params: any[] = [];
    let where = "";
    if (query.status) {
      params.push(query.status);
      where = `WHERE status = $1`;
    }

    const countRow = await this.em.query(`SELECT COUNT(*) as cnt FROM account_applications ${where}`, params);
    const total = parseInt(countRow[0]?.cnt || 0);

    params.push(pageSize, offset);
    const rows = await this.em.query(
      `SELECT * FROM account_applications ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return { items: rows, pagination: { page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) } };
  }

  async reviewAccountApplication(appId: string, dto: { action: "APPROVED" | "REJECTED"; review_comment?: string }, reviewerId: string) {
    const apps = await this.em.query("SELECT * FROM account_applications WHERE application_id = $1", [appId]);
    if (apps.length === 0) throw new HttpException({ message: "申請不存在" }, 404);
    if (apps[0].status !== "PENDING") throw new HttpException({ message: "此申請已處理過" }, 400);

    await this.em.query(
      "UPDATE account_applications SET status = $1, reviewer_id = $2, review_comment = $3, updated_at = CURRENT_TIMESTAMP WHERE application_id = $4",
      [dto.action, reviewerId, dto.review_comment || null, appId]
    );

    if (dto.action === "APPROVED") {
      const app = apps[0];
      const bcrypt = require("bcryptjs");
      const passwordHash = await bcrypt.hash("123456", 10);
      const empId = uuidv4();
      const employeeNo = app.applicant_email; // 英文名作為登錄帳號

      await this.em.query(
        "INSERT INTO employee_master (employee_id, employee_no, full_name, display_name, email, phone, role_code, password_hash, tenant_id, is_active, status, created_by) VALUES ($1,$2,$3,$4,$5,$6,\"SALES\",$7,\"00000000-0000-0000-0000-000000000001\",true,\"ACTIVE\",$8)",
        [empId, employeeNo, app.applicant_name, app.applicant_email, app.applicant_email, app.applicant_phone, passwordHash, reviewerId] // employee_no = english_name
      );

      await this.em.query("UPDATE account_applications SET created_employee_id = $1 WHERE application_id = $2", [empId, appId]);

      this.logger.log(`Account application ${appId} approved, employee ${employeeNo} created`);
      return { application_id: appId, status: "APPROVED", employee_no: employeeNo, message: "已開通帳號，預設密碼 123456" };
    }

    this.logger.log(`Account application ${appId} rejected`);
    return { application_id: appId, status: "REJECTED", message: "已拒絕申請" };
  }
  // ====== Workflows ======
  async getWorkflows() {
    return this.em.query("SELECT * FROM workflow_definition ORDER BY entity_type, workflow_code");
  }

  async getStateMachines() {
    return this.em.query("SELECT * FROM state_machine_definition ORDER BY entity_type, from_state");
  }

  async createWorkflow(dto: any, userId: string) {
    const id = uuidv4();
    await this.em.query(
      "INSERT INTO workflow_definition (workflow_id, workflow_code, workflow_name, entity_type, steps, is_active, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [id, dto.workflow_code, dto.workflow_name, dto.entity_type, JSON.stringify(dto.steps || []), dto.is_active !== false, userId]
    );
    await this.writeAudit(userId, "CREATE_WORKFLOW", "workflow_definition", id, {}, dto);
    return this.getWorkflows();
  }

  async updateWorkflow(id: string, dto: any, userId: string) {
    const sets: string[] = [];
    const vals: any[] = [];
    let pi = 1;
    if (dto.workflow_code !== undefined) { sets.push("workflow_code=$" + pi++); vals.push(dto.workflow_code); }
    if (dto.workflow_name !== undefined) { sets.push("workflow_name=$" + pi++); vals.push(dto.workflow_name); }
    if (dto.entity_type !== undefined) { sets.push("entity_type=$" + pi++); vals.push(dto.entity_type); }
    if (dto.steps !== undefined) { sets.push("steps=$" + pi++); vals.push(JSON.stringify(dto.steps)); }
    if (dto.is_active !== undefined) { sets.push("is_active=$" + pi++); vals.push(dto.is_active); }
    if (sets.length === 0) return this.getWorkflows();
    sets.push("updated_at=CURRENT_TIMESTAMP");
    vals.push(id);
    await this.em.query("UPDATE workflow_definition SET " + sets.join(",") + " WHERE workflow_id=$" + pi, vals);
    await this.writeAudit(userId, "UPDATE_WORKFLOW", "workflow_definition", id, {}, dto);
    return this.getWorkflows();
  }

  async deleteWorkflow(id: string, userId: string) {
    await this.em.query("DELETE FROM workflow_definition WHERE workflow_id = $1", [id]);
    await this.writeAudit(userId, "DELETE_WORKFLOW", "workflow_definition", id, {}, {});
    return { message: "已刪除" };
  }

  // ====== Field Policies ======
  async getFieldPolicies() {
    return this.em.query("SELECT * FROM field_policy ORDER BY entity_type, field_name, role_code");
  }

  async createFieldPolicy(dto: any, userId: string) {
    const id = require("uuid").v4();
    await this.em.query(
      "INSERT INTO field_policy (policy_id, role_code, entity_type, field_name, access_level) VALUES ($1,$2,$3,$4,$5)",
      [id, dto.role_code, dto.entity_type, dto.field_name, dto.access_level || "READ"]
    );
    await this.writeAudit(userId, "CREATE_FIELD_POLICY", "field_policy", id, {}, dto);
    return { policy_id: id, ...dto };
  }

  async updateFieldPolicy(id: string, dto: any, userId: string) {
    const rows = await this.em.query("SELECT * FROM field_policy WHERE policy_id = $1", [id]);
    if (rows.length === 0) throw new (require("@nestjs/common").HttpException)({ message: "策略不存在" }, 404);
    const old = rows[0];
    await this.em.query(
      "UPDATE field_policy SET role_code=$1, entity_type=$2, field_name=$3, access_level=$4 WHERE policy_id=$5",
      [dto.role_code ?? old.role_code, dto.entity_type ?? old.entity_type, dto.field_name ?? old.field_name, dto.access_level ?? old.access_level, id]
    );
    await this.writeAudit(userId, "UPDATE_FIELD_POLICY", "field_policy", id, old, dto);
    return { policy_id: id, ...dto };
  }

  async deleteFieldPolicy(id: string, userId: string) {
    const rows = await this.em.query("SELECT * FROM field_policy WHERE policy_id = $1", [id]);
    if (rows.length === 0) throw new (require("@nestjs/common").HttpException)({ message: "策略不存在" }, 404);
    await this.em.query("DELETE FROM field_policy WHERE policy_id = $1", [id]);
    await this.writeAudit(userId, "DELETE_FIELD_POLICY", "field_policy", id, rows[0], {});
    return { message: "已刪除" };
  }


  // ====== Enum Options Management ======
  private defaultEnums: Record<string, any[]> = {
    customer_type: [
      { code: "HOSPITAL", label: "醫院" }, { code: "CLINIC", label: "診所" },
      { code: "DISTRIBUTOR", label: "經銷商" }, { code: "PERSONAL", label: "個人" },
      { code: "CHAIN", label: "連鎖" }, { code: "GOV", label: "政府機構" },
    ],
    customer_source: [
      { code: "SELF_DEV", label: "自主開發" }, { code: "EXHIBITION", label: "展會獲取" },
      { code: "REFERRAL", label: "客戶轉介紹" }, { code: "ONLINE", label: "線上諮詢" },
      { code: "AGENT", label: "代理商" }, { code: "OTHER", label: "其他" },
    ],
    industry_type: [
      { code: "HOSPITAL", label: "醫院" }, { code: "CLINIC", label: "診所" },
      { code: "BEAUTY_SALON", label: "美容院" }, { code: "PHARMACY", label: "藥房" },
      { code: "DISTRIBUTOR", label: "經銷商" }, { code: "ONLINE_SHOP", label: "電商" },
      { code: "OTHER", label: "其他" },
    ],
    payment_terms: [
      { code: "CASH", label: "現金" }, { code: "TRANSFER", label: "匯款" },
      { code: "CASH_DUPLICATE", label: "現金/二聯" }, { code: "TRANSFER_CHECK", label: "匯款/支票" },
      { code: "NET_30", label: "月結30天" }, { code: "NET_60", label: "月結60天" },
      { code: "NET_90", label: "月結90天" },
      { code: "CHECK", label: "支票" }, { code: "DUPLICATE", label: "二聯" },
    ],
    product_category: [
      { code: "DEVICE", label: "醫療器材" }, { code: "COSMETIC", label: "化妝品" },
      { code: "CONSUMABLE", label: "耗材" }, { code: "EQUIPMENT", label: "設備" },
      { code: "RAW_MATERIAL", label: "原料" },
    ],
    region_code: [
      { code: "NORTH", label: "北區" }, { code: "CENTRAL", label: "中區" },
      { code: "SOUTH", label: "南區" }, { code: "EAST", label: "東區" },
    ],
    customer_status: [
      { code: "LEAD", label: "潛在" }, { code: "ACTIVE", label: "活躍" },
      { code: "SAMPLING", label: "打板中" }, { code: "INACTIVE", label: "非活躍" },
      { code: "FROZEN", label: "已凍結" },
    ],
  };


  async getEnumOptions(type: string) {
    const key = "enum_" + type;
    const rows = await this.em.query("SELECT param_value FROM system_param WHERE param_key = $1", [key]);
    if (rows.length > 0 && rows[0].param_value) {
      try {
        const val = rows[0].param_value;
        return typeof val === "string" ? JSON.parse(val) : val;
      } catch { return this.defaultEnums[type] || []; }
    }
    return this.defaultEnums[type] || [];
  }

  async saveEnumOptions(type: string, options: any[], userId: string) {
    const key = "enum_" + type;
    await this.em.query("DELETE FROM system_param WHERE param_key = $1", [key]);
    await this.em.query(
      "INSERT INTO system_param (param_key, param_value, param_type, updated_by) VALUES ($1, $2, 'JSON', $3)",
      [key, JSON.stringify(options), userId]
    );
    return { message: "OK" };
  }

  async addEnumOption(type: string, body: any, userId: string) {
    const options = await this.getEnumOptions(type);
    if (options.some((o: any) => o.code === body.code)) throw new (require("@nestjs/common").HttpException)({ message: "已有此代碼" }, 400);
    options.push({ code: body.code, label: body.label });
    return this.saveEnumOptions(type, options, userId);
  }

  async deleteEnumOption(type: string, code: string, userId: string) {
    const options = await this.getEnumOptions(type);
    const filtered = options.filter((o: any) => o.code !== code);
    if (filtered.length === options.length) throw new (require("@nestjs/common").HttpException)({ message: "代碼不存在" }, 404);
    return this.saveEnumOptions(type, filtered, userId);
  }

}
