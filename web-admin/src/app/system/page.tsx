"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const ts = (bg: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color, whiteSpace: "nowrap" });
const bp: React.CSSProperties = { height: 36, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const bgBtn: React.CSSProperties = { ...bp, background: "#52c41a" };
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" };
const sl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const modalBg: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalCard: React.CSSProperties = { background: "#fff", borderRadius: 8, padding: 24, width: 600, maxHeight: "85vh", overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" };
const actionBtn: React.CSSProperties = { height: 28, padding: "0 10px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer" };

  const ACTION_MAP: Record<string, string> = { "SYSTEM_PARAM_UPDATE": "系統參數更新", "DEVICE_UNBIND": "設備解綁", "DEVICE_SELF_UNBIND": "自行解綁設備", "PASSWORD_CHANGE": "密碼變更", "IMPORT": "資料匯入", "CREATE_WORKFLOW": "建立審批流程", "UPDATE_WORKFLOW": "更新審批流程", "DELETE_WORKFLOW": "刪除審批流程", "CREATE_FIELD_POLICY": "建立欄位權限", "UPDATE_FIELD_POLICY": "更新欄位權限", "DELETE_FIELD_POLICY": "刪除欄位權限", "LOGIN": "登入", "LOGOUT": "登出" };

  const ENTITY_MAP: Record<string, string> = { "system_param": "系統參數", "device_binding": "設備綁定", "employee_master": "員工", "customer_master": "客戶", "product_master": "產品", "order_master": "訂單", "workflow_definition": "審批流程", "field_policy": "欄位權限", "inventory": "庫存", "supplier_master": "供應商", "sample_order": "樣品/打版", "consignment": "寄庫", "budget": "預算", "recall": "召回" };
const FIELD_OPTIONS: Record<string, { value: string; label: string }[]> = {
  customer: [
    { value: "customer_code", label: "客戶編碼" }, { value: "customer_name", label: "客戶名稱" }, { value: "short_name", label: "客戶簡稱" },
    { value: "customer_type", label: "客戶類型" }, { value: "customer_source", label: "客戶來源" }, { value: "industry_type", label: "行業類型" },
    { value: "tax_id", label: "統一編號" }, { value: "owning_employee_id", label: "負責業務" },
    { value: "contract_signed", label: "合約已簽" }, { value: "allow_transaction", label: "允許交易" },
    { value: "contact_person", label: "聯絡人" }, { value: "phone", label: "電話" }, { value: "email", label: "Email" },
    { value: "address", label: "公司地址" }, { value: "company_zip", label: "公司郵遞" }, { value: "website", label: "公司網址" },
    { value: "shipping_address", label: "送貨地址" }, { value: "shipping_zip", label: "送貨郵遞" }, { value: "recipient_name", label: "收貨人" }, { value: "recipient_phone", label: "收貨人電話" },
    { value: "billing_address", label: "發票地址" }, { value: "billing_zip", label: "發票郵遞" }, { value: "billing_recipient", label: "收票人" }, { value: "billing_recipient_phone", label: "收票人電話" },
    { value: "contact_phone_1", label: "聯絡人電話1" }, { value: "contact_phone_2", label: "聯絡人電話2" }, { value: "contact_phone_3", label: "聯絡人電話3" },
    { value: "payment_terms", label: "付款條件" }, { value: "credit_limit", label: "信用額度" }, { value: "outstanding_ar", label: "應收帳款" },
    { value: "bank_name", label: "公司銀行" }, { value: "bank_account", label: "銀行帳號" }, { value: "account_name", label: "抬頭/戶名" },
    { value: "invoice_tax_id", label: "開票統編" }, { value: "invoice_note", label: "開票備註" },
    { value: "institution_code", label: "醫事機構代碼" }, { value: "latitude", label: "緯度" }, { value: "longitude", label: "經度" },
  ],
  product: [
    { value: "product_code", label: "產品編碼" }, { value: "product_name", label: "產品名稱" }, { value: "product_specification", label: "產品規格" },
    { value: "category", label: "產品類別" }, { value: "brand_series_id", label: "品牌系列" },
    { value: "base_price", label: "基本售價" }, { value: "minimum_price", label: "最低售價" }, { value: "cost_price", label: "成本價" },
    { value: "unit", label: "單位" }, { value: "min_stock_qty", label: "安全庫存" },
  ],
  supplier: [
    { value: "supplier_code", label: "供應商編碼" }, { value: "supplier_name", label: "供應商名稱" },
    { value: "contact_person", label: "聯絡人" }, { value: "phone", label: "電話" }, { value: "email", label: "Email" }, { value: "address", label: "地址" },
    { value: "tax_id", label: "統一編號" }, { value: "payment_terms", label: "付款條件" },
  ],
  sales_order: [
    { value: "order_no", label: "訂單編號" }, { value: "customer_id", label: "客戶" }, { value: "order_date", label: "訂單日期" },
    { value: "total_amount", label: "訂單總額" }, { value: "status", label: "狀態" },
  ],
  purchase_order: [
    { value: "po_no", label: "採購單號" }, { value: "supplier_id", label: "供應商" },
    { value: "total_amount", label: "總金額" }, { value: "status", label: "狀態" },
  ],
  inventory: [
    { value: "warehouse_id", label: "倉庫" }, { value: "product_id", label: "產品" },
    { value: "batch_no", label: "批號" }, { value: "quantity", label: "庫存數量" }, { value: "expiry_date", label: "效期" },
  ],
  consignment: [
    { value: "customer_id", label: "客戶" }, { value: "product_id", label: "產品" }, { value: "remaining_qty", label: "剩餘數量" },
  ],
  employee: [
    { value: "employee_no", label: "員工編號" }, { value: "full_name", label: "姓名" }, { value: "email", label: "Email" },
    { value: "phone", label: "電話" }, { value: "department_id", label: "部門" }, { value: "position", label: "職位" },
    { value: "birth_date", label: "出生年月日" }, { value: "salary", label: "薪資" },
  ],
  recall: [{ value: "case_no", label: "召回單號" }, { value: "status", label: "狀態" }, { value: "product_id", label: "產品" }],
  sample: [{ value: "request_no", label: "打板單號" }, { value: "status", label: "狀態" }],
  visit: [{ value: "customer_id", label: "客戶" }, { value: "visit_date", label: "拜訪日期" }, { value: "notes", label: "備註" }],
  finance: [{ value: "ar_no", label: "應收單號" }, { value: "amount", label: "金額" }, { value: "status", label: "狀態" }],
};

  const formatAuditDetail = (l: any) => {
    const entityName = ENTITY_MAP[l.entity_type] || l.entity_type || "";
    const entityId = l.entity_id ? ` (${l.entity_id.slice(0, 8)})` : "";
    const oldStr = l.old_value && l.old_value !== "{}" && Object.keys(typeof l.old_value === "string" ? JSON.parse(l.old_value||"{}") : (l.old_value||{})).length > 0
      ? " 變更前: " + (typeof l.old_value === "string" ? l.old_value : JSON.stringify(l.old_value)).slice(0, 40)
      : "";
    const newStr = l.new_value && l.new_value !== "{}" && Object.keys(typeof l.new_value === "string" ? JSON.parse(l.new_value||"{}") : (l.new_value||{})).length > 0
      ? " 變更後: " + (typeof l.new_value === "string" ? l.new_value : JSON.stringify(l.new_value)).slice(0, 40)
      : "";
    return `${entityName}${entityId}${oldStr}${newStr}` || "-";
  };



const tabs = [
  { key: "params", label: "系統參數" },
  { key: "roles", label: "角色管理" },
  { key: "users", label: "使用者管理" },
  { key: "audit", label: "審計日誌" },
  { key: "devices", label: "設備綁定" },
{ key: "company", label: "公司資訊" },
  { key: "org", label: "組織架構" },
  { key: "imports", label: "資料匯入" },
  { key: "fieldPolicy", label: "欄位權限" },
{ key: "workflow", label: "審批流程" },
{ key: "print", label: "列印模板" },
{ key: "applications", label: "帳號申請" },
];

const importEntities = [
  { key: "customers", label: "客戶資料", template: "customer_code,customer_name,contact_person,phone,email,address" },
  { key: "products", label: "產品資料", template: "product_code,product_name,category,base_price" },
  { key: "suppliers", label: "供應商資料", template: "supplier_code,supplier_name,contact_person,contact_phone,payment_terms" },
  { key: "employees", label: "員工資料", template: "employee_no,full_name,role_code,region_code,email,phone" },
  { key: "inventory", label: "庫存資料", template: "batch_no,product_id,expiry_date,manufacturer,qa_status,total_quantity" },
];

function ImportSection() {
  const [entity, setEntity] = useState("customers");
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const parseCsv = (text: string): any[] => {
    const lines = text.trim().split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    return lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const row: any = {};
      headers.forEach((h, i) => { row[h] = vals[i] || ""; });
      return row;
    });
  };

  const doImport = async () => {
    const rows = parseCsv(csvText);
    if (rows.length === 0) { alert("請貼上有效的 CSV 資料（至少含標題行 + 1 筆資料）"); return; }
    if (rows.length > 500) { alert("單次最多 500 筆資料"); return; }
    setImporting(true); setResult(null);
    try {
      const r = await api.post("/system/import/" + entity, { rows });
      setResult(r.data);
    } catch (e: any) { alert(e?.response?.data?.message || "匯入失敗"); }
    finally { setImporting(false); }
  };

  const downloadTemplate = () => {
    const e = importEntities.find(ent => ent.key === entity);
    if (!e) return;
    const blob = new Blob(["\uFEFF" + e.template + "\n"], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = entity + "_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={cb}>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#999", marginBottom: 4 }}>匯入類型</div>
            <select value={entity} onChange={e => setEntity(e.target.value)} style={{ width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" }}>
              {importEntities.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
            </select>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#999" }}>CSV 資料內容</div>
              <button onClick={downloadTemplate} style={{ fontSize: 11, color: "#1890ff", background: "none", border: "none", cursor: "pointer" }}>下載模板</button>
            </div>
            <textarea style={{ width: "100%", height: 180, padding: "8px 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 12, fontFamily: "monospace", resize: "vertical", boxSizing: "border-box", outline: "none", background: "#fff" }}
              value={csvText} onChange={e => setCsvText(e.target.value)}
              placeholder={importEntities.find(e => e.key === entity)?.template + "\n..."} />
          </div>
          <button onClick={doImport} disabled={importing} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "none", background: "#52c41a", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", width: "fit-content", opacity: importing ? 0.6 : 1 }}>{importing ? "匯入中..." : "開始匯入"}</button>
        </div>
      </div>
      <div style={{ display: "grid", gap: 16 }}>
        {result && (
          <div style={cb}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#333", margin: "0 0 12px" }}>匯入結果</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div style={{ textAlign: "center", padding: 10, background: "#f6ffed", borderRadius: 4 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#52c41a" }}>{result.total}</div>
                <div style={{ fontSize: 11, color: "#999" }}>總計</div>
              </div>
              <div style={{ textAlign: "center", padding: 10, background: "#e6f7ff", borderRadius: 4 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#1890ff" }}>{result.success}</div>
                <div style={{ fontSize: 11, color: "#999" }}>成功</div>
              </div>
              <div style={{ textAlign: "center", padding: 10, background: "#fff1f0", borderRadius: 4 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#ff4d4f" }}>{result.failed}</div>
                <div style={{ fontSize: 11, color: "#999" }}>失敗</div>
              </div>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div style={{ fontSize: 11, color: "#ff4d4f", maxHeight: 120, overflow: "auto", marginTop: 8 }}>
                {result.errors.slice(0,10).map((e: string, i: number) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>
        )}
        <div style={cb}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: "0 0 10px" }}>快速導出</h3>
          <div style={{ display: "grid", gap: 6 }}>
            {[
              { label: "客戶列表", url: "/api/v1/system/export/customers" },
              { label: "產品列表", url: "/api/v1/system/export/products" },
              { label: "供應商列表", url: "/api/v1/system/export/suppliers" },
              { label: "員工列表", url: "/api/v1/system/export/employees" },
              { label: "庫存列表", url: "/api/v1/system/export/inventory" },
            ].map(item => (
              <a key={item.label} href={item.url}
                style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "#fafafa", borderRadius: 4, textDecoration: "none", color: "#333", fontSize: 13, border: "1px solid #f0f0f0" }}>
                <span>{item.label}</span>
                <span style={{ color: "#1890ff", fontSize: 11 }}>下載 CSV ↓</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ====== Main Page ======
export default function SystemPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("params");


  // ====== Roles ======
  const [roles, setRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const [filteredRoles, setFilteredRoles] = useState<any[]>([]);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleForm, setRoleForm] = useState<any>({});
  const [roleSaving, setRoleSaving] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [perms, setPerms] = useState<any[]>([]);
  const [permSaving, setPermSaving] = useState(false);

  const fetchRoles = useCallback(() => {
    setRolesLoading(true);
    api.get("/system/roles").then((r: any) => {
      const list = r.data || [];
      setRoles(list);
      setFilteredRoles(list);
    }).finally(() => setRolesLoading(false));
  }, []);
  useEffect(() => { if (activeTab === "roles") fetchRoles(); }, [activeTab, fetchRoles]);
  useEffect(() => {
    if (roleSearch) setFilteredRoles(roles.filter((r: any) => r.role_code?.toLowerCase().includes(roleSearch.toLowerCase()) || r.role_name?.toLowerCase().includes(roleSearch.toLowerCase())));
    else setFilteredRoles(roles);
  }, [roleSearch, roles]);

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("確定要刪除此角色嗎？此操作不可復原。")) return;
    try { await api.delete("/system/roles/" + roleId); fetchRoles(); } catch (e: any) { alert(e?.response?.data?.message || "刪除失敗"); }
  };

  const openRolePerms = async (role: any) => {
    setEditingRole(role);
    try {
      const permRes = await api.get("/system/permissions");
      setPerms(permRes.data || []);
      const rolePermRes = await api.get("/system/roles/" + role.role_id + "/permissions");
      const assignedIds = new Set<string>((rolePermRes.data || []).filter((p: any) => p.assigned).map((p: any) => p.permission_id));
      setSelectedPerms(assignedIds);
      setShowPermModal(true);
    } catch (e: any) { alert("載入權限失敗"); }
  };

  const saveRole = async () => {
    if (!roleForm.role_code || !roleForm.role_name) { alert("請填寫角色代碼和名稱"); return; }
    setRoleSaving(true);
    try {
      if (editingRole) {
        await api.put("/system/roles/" + editingRole.role_id, roleForm);
      } else {
        await api.post("/system/roles", roleForm);
      }
      setShowRoleModal(false);
      setEditingRole(null);
      fetchRoles();
    } catch (e: any) { alert(e?.response?.data?.message || "儲存失敗"); }
    finally { setRoleSaving(false); }
  };

  const saveRolePerms = async () => {
    if (!editingRole) return;
    setPermSaving(true);
    try {
      await api.put("/system/roles/" + editingRole.role_id + "/permissions", { permission_ids: Array.from(selectedPerms) });
      setShowPermModal(false);
      fetchRoles();
    } catch (e: any) { alert(e?.response?.data?.message || "儲存權限失敗"); }
    finally { setPermSaving(false); }
  };


  // ====== Users ======
  const [users, setUsers] = useState<any[]>([]);
  const [userPagination, setUserPagination] = useState<any>({});
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({ employee_no: "", full_name: "", role_code: "SALES", region_code: "", email: "", phone: "", password: "123456" });
  const [userSaving, setUserSaving] = useState(false);

  const fetchUsers = useCallback(() => { setUsersLoading(true); api.get("/system/users", { params: { page: userPage, page_size: 20, search: userSearch } }).then((r: any) => { setUsers(r.data?.items || []); setUserPagination(r.data?.pagination || {}); }).finally(() => setUsersLoading(false)); }, [userPage, userSearch]);
  useEffect(() => { if (activeTab === "users") fetchUsers(); }, [activeTab, userPage, userSearch, fetchUsers]);

  const addUser = async () => {
    if (!userForm.employee_no || !userForm.full_name) { alert("請填寫員工編號和姓名"); return; }
    setUserSaving(true);
    try { await api.post("/system/users", userForm); setShowAddUser(false); setUserForm({ employee_no: "", full_name: "", display_name: "", role_code: "SALES", job_title: "", region_code: "", email: "", phone: "", mobile: "", birth_date: "", password: "123456" }); fetchUsers(); } catch(e:any){ alert(e?.response?.data?.message||"新增失敗"); }
    finally { setUserSaving(false); }
  };

  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState("");
  const [editUserForm, setEditUserForm] = useState<any>({});

  const toggleUserActive = async (empId: string, isActive: boolean) => {
    try {
      await api.put("/system/users/" + empId, { is_active: !isActive });
      fetchUsers();
    } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
  };

  const editUser = (u: any) => {
    setEditingUserId(u.employee_id);
    setEditUserForm({ employee_no: u.employee_no, full_name: u.full_name, display_name: u.display_name || "", role_code: u.role_code, job_title: u.job_title || "", region_code: u.region_code || "", email: u.email || "", phone: u.phone || "", mobile: u.mobile || "", birth_date: u.birth_date || "" });
    setShowEditUser(true);
  };

  const saveEditUser = async () => {
    setUserSaving(true);
    try { await api.put("/system/users/" + editingUserId, editUserForm); setShowEditUser(false); fetchUsers(); } catch(e:any){ alert(e?.response?.data?.message||"修改失敗"); }
    finally { setUserSaving(false); }
  };

  const deleteUser = async (empId: string, name: string) => {
    if (!confirm("確定要刪除使用者「" + name + "」嗎？")) return;
    try { await api.delete("/system/users/" + empId); fetchUsers(); } catch(e:any){ alert(e?.response?.data?.message||"刪除失敗"); }
  };

  // ====== Audit Logs ======
  const [logs, setLogs] = useState<any[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [logPagination, setLogPagination] = useState<any>({});
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchLogs = useCallback(() => { setLogsLoading(true); api.get("/system/audit-logs", { params: { page: logPage, page_size: 50 } }).then((r: any) => { setLogs(r.data?.items || []); setLogPagination(r.data?.pagination || {}); }).finally(() => setLogsLoading(false)); }, [logPage]);
  useEffect(() => { if (activeTab === "audit") fetchLogs(); }, [activeTab, logPage, fetchLogs]);

  const [devices, setDevices] = useState<any[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const fetchDevices = useCallback(() => { setDevicesLoading(true); api.get("/system/devices").then((r: any) => setDevices(r.data?.items || [])).finally(() => setDevicesLoading(false)); }, []);
  const fetchPrintTemplates = useCallback(() => { setPrintLoading(true); api.get("/print/templates").then((r: any) => setPrintTemplates(r.data || [])).finally(() => setPrintLoading(false)); }, []);
  const savePrintTemplate = async () => { if (!printForm.template_name.trim()) { alert("請輸入模板名稱"); return; } setPrintSaving(true); try { await api.post("/print/templates", printForm); alert("模板已建立"); setShowPrintModal(false); fetchPrintTemplates(); } catch (e) { alert(e?.response?.data?.message || "儲存失敗"); } finally { setPrintSaving(false); } };
  const togglePrintActive = async (tpl) => { try { await api.put("/print/templates/" + tpl.template_id, { is_active: !tpl.is_active }); fetchPrintTemplates(); } catch (e) { alert("操作失敗"); } };
  const fetchWorkflows = useCallback(() => { setWorkflowLoading(true); Promise.all([api.get("/system/workflows"), api.get("/system/state-machines")]).then(([w, s]: any[]) => { setWorkflows(w.data || []); setStateMachines(s.data || []); }).finally(() => setWorkflowLoading(false)); }, []);


  const saveWorkflow = async () => {
    if (!wfForm.workflow_code || !wfForm.workflow_name) { alert("請填寫流程編碼和名稱"); return; }
    setWfSaving(true);
    try {
      if (editingWf) await api.put("/system/workflows/" + editingWf.workflow_id, wfForm);
      else await api.post("/system/workflows", wfForm);
      setShowWfModal(false);
      fetchWorkflows();
    } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
    finally { setWfSaving(false); }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm("確定要刪除此審批流程？")) return;
    try { await api.delete("/system/workflows/" + id); fetchWorkflows(); } catch (e: any) { alert("刪除失敗"); }
  };

  // ====== Account Applications ======
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsPage, setAppsPage] = useState(1);
  const [appsPagination, setAppsPagination] = useState<any>({});
  const [appsFilter, setAppsFilter] = useState("PENDING");

  const fetchApplications = useCallback(() => {
    setAppsLoading(true);
    api.get("/system/account-applications", { params: { page: appsPage, page_size: 20, status: appsFilter } })
      .then((r: any) => { setApplications(r.items || []); setAppsPagination(r.pagination || {}); })
      .finally(() => setAppsLoading(false));
  }, [appsPage, appsFilter]);
  useEffect(() => { if (activeTab === "applications") fetchApplications(); }, [activeTab, appsPage, appsFilter, fetchApplications]);

  const reviewApplication = async (appId: string, action: "APPROVED" | "REJECTED") => {
    const comment = action === "REJECTED" ? prompt("請輸入拒絕原因：") : "";
    if (action === "REJECTED" && comment === null) return;
    try {
      const r: any = await api.put("/system/account-applications/" + appId, { action, review_comment: comment || undefined });
      alert(r.message || (action === "APPROVED" ? "已開通帳號" : "已拒絕申請"));
      fetchApplications();
    } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
  };

  // ====== Company Info ======
  const [companies, setCompanies] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [editCompany, setEditCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState<any>({});
  const [companySaving, setCompanySaving] = useState(false);
  const [printTemplates, setPrintTemplates] = useState<any[]>([]);
  const [printLoading, setPrintLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printForm, setPrintForm] = useState({ template_code: "", template_name: "", entity_type: "SALES_ORDER", html_content: "", paper_size: "A4", is_active: true, remark: "" });
  const [printSaving, setPrintSaving] = useState(false);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [stateMachines, setStateMachines] = useState<any[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [showWfModal, setShowWfModal] = useState(false);
  const [editingWf, setEditingWf] = useState<any>(null);
  const [wfForm, setWfForm] = useState({ workflow_code: "", workflow_name: "", entity_type: "SalesOrder", steps: [] as any[], is_active: true });
  const [wfSaving, setWfSaving] = useState(false);
  const [fieldPolicies, setFieldPolicies] = useState<any[]>([]);
  const [fpLoading, setFpLoading] = useState(false);
  const [showFpModal, setShowFpModal] = useState(false);
  const [editingFp, setEditingFp] = useState<any>(null);
  const [fpForm, setFpForm] = useState({ role_code: "SALES", entity_type: "customer", field_name: "", access_level: "READ" });
  const [fpSaving, setFpSaving] = useState(false);

  // ====== Field Policies ======
  const fetchFieldPolicies = useCallback(() => {
    setFpLoading(true);
    api.get("/system/field-policies").then((r: any) => {
      setFieldPolicies(r.data || []);
    }).finally(() => setFpLoading(false));
  }, []);
  useEffect(() => { if (activeTab === "fieldPolicy") fetchFieldPolicies(); }, [activeTab, fetchFieldPolicies]);

  const saveFieldPolicy = async () => {
    if (!fpForm.field_name) { alert("請填寫欄位名稱"); return; }
    setFpSaving(true);
    try {
      if (editingFp) await api.put("/system/field-policies/" + editingFp.policy_id, fpForm);
      else await api.post("/system/field-policies", fpForm);
      alert(editingFp ? "欄位權限已更新" : "欄位權限已建立");
      setShowFpModal(false);
      fetchFieldPolicies();
    } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
    finally { setFpSaving(false); }
  };

  const deleteFieldPolicy = async (fp: any) => {
    if (!confirm("確定要刪除此欄位權限規則？")) return;
    try { await api.delete("/system/field-policies/" + fp.policy_id); alert("已刪除"); fetchFieldPolicies(); } catch (e: any) { alert("刪除失敗"); }
  };
  // System Params
  const [paramSearch, setParamSearch] = useState("");
  const [paramsLoading, setParamsLoading] = useState(false);
  const [params, setParams] = useState<any[]>([]);
  const [filteredParams, setFilteredParams] = useState<any[]>([]);
  const [editingParam, setEditingParam] = useState<any>(null);
  const [paramForm, setParamForm] = useState({ param_code: "", param_name: "", param_value: "", data_type: "STRING", description: "" });
  const [showParamModal, setShowParamModal] = useState(false);
  const [paramSaving, setParamSaving] = useState(false);

  const fetchParams = useCallback(() => {
    setParamsLoading(true);
    api.get("/system/params").then((r: any) => {
      const list = r.data || [];
      setParams(list);
      setFilteredParams(list);
    }).finally(() => setParamsLoading(false));
  }, []);
  useEffect(() => { if (activeTab === "params") fetchParams(); }, [activeTab, fetchParams]);
  useEffect(() => {
    if (paramSearch) setFilteredParams(params.filter((p: any) => p.param_key?.toLowerCase().includes(paramSearch.toLowerCase()) || p.description?.toLowerCase().includes(paramSearch.toLowerCase())));
    else setFilteredParams(params);
  }, [paramSearch, params]);

  const saveParam = async () => {
    if (!paramForm.param_code) { alert("請填寫參數代碼"); return; }
    setParamSaving(true);
    try {
      if (editingParam) await api.put("/system/params/" + editingParam.param_key, { value: paramForm.param_value });
      else await api.post("/system/params", paramForm);
      alert(editingParam ? "參數已更新" : "參數已建立");
      setShowParamModal(false);
      fetchParams();
    } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
    finally { setParamSaving(false); }
  };

  const handleDeleteParam = async (id: string) => {
    if (!confirm("確定要刪除此參數？")) return;
    try { await api.delete("/system/params/" + id); fetchParams(); } catch (e: any) { alert("刪除失敗"); }
  };

  const fetchCompanies = useCallback(() => {
    setCompanyLoading(true);
    api.get("/companies").then((r: any) => {
      const list = r.data || [];
      setCompanies(list);
      if (list.length > 0) { setCompany(list[0]); setCompanyForm(list[0]); }
    }).finally(() => setCompanyLoading(false));
  }, []);
  useEffect(() => { if (activeTab === "company") fetchCompanies(); }, [activeTab, fetchCompanies]);
  const handleDeleteCompany = async (id: string, name: string) => {
    if (!confirm("確定要刪除公司「" + name + "」嗎？此操作不可復原。")) return;
    try { await api.delete("/companies/" + id); alert("已刪除"); fetchCompanies(); } catch (e: any) { alert(e?.response?.data?.message || "刪除失敗"); }
  };

  const saveCompany = async () => {
    if (!companyForm.company_code || !companyForm.company_name) { alert("請填寫公司代碼和全稱"); return; }
    setCompanySaving(true);
    try {
      const target = editingCompany || company;
      if (target?.company_id) {
        await api.put("/companies/" + target.company_id, companyForm);
      } else {
        await api.post("/companies", companyForm);
      }
      alert(target?.company_id ? "已更新" : "已建立");
      setShowCompanyModal(false);
      setEditCompany(false);
      await fetchCompanies();
    } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
    finally { setCompanySaving(false); }
  };
  useEffect(() => { if (activeTab === "devices") fetchDevices(); }, [activeTab, fetchDevices]);
  useEffect(() => { if (activeTab === "workflow") fetchWorkflows(); }, [activeTab, fetchWorkflows]);

  const unbindDevice = async (deviceId: string) => {
    const reason = prompt("請輸入解綁原因：");
    if (!reason) return;
    try { await api.delete("/system/devices/" + deviceId, { data: { reason } }); fetchDevices(); alert("設備已解綁"); } catch (e: any) { alert(e?.response?.data?.message || "解綁失敗"); }
  };

  const handleExport = (type: string) => {
    const urls: Record<string, string> = { orders: "/system/export/orders", customers: "/system/export/customers", products: "/system/export/products", suppliers: "/system/export/suppliers", inventory: "/system/export/inventory", finance: "/system/export/finance-ar", audit: "/system/export/audit-logs", employees: "/system/export/employees" };
    const name = type + "_export_" + new Date().toISOString().slice(0, 10) + ".csv";
    downloadCsv("/api/v1" + (urls[type] || "/system/export/" + type), name);
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 }}>系統設置</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tabs.map(t => <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ height: 36, padding: "0 16px", borderRadius: 6, border: "none", background: activeTab === t.key ? "#1890ff" : "#f0f0f0", color: activeTab === t.key ? "#fff" : "#666", fontSize: 13, fontWeight: activeTab === t.key ? 600 : 400, cursor: "pointer", transition: "all 0.2s" }}>{t.label}</button>)}
          </div>
        </div>

        {/* ====== 系統參數 ====== */}
        {activeTab === "params" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <input style={{ ...si, width: 280 }} placeholder="搜尋參數..." value={paramSearch} onChange={e => setParamSearch(e.target.value)} />
              <button onClick={() => { setEditingParam(null); setParamForm({ param_code: "", param_name: "", param_value: "", data_type: "STRING", description: "" }); setShowParamModal(true); }} style={bp}>+ 新增參數</button>
            </div>
            {paramsLoading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : filteredParams.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無系統參數</div> : (
              <div style={cb}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><th style={th}>參數代碼</th><th style={th}>名稱</th><th style={th}>值</th><th style={th}>類型</th><th style={th}>說明</th><th style={{ ...th, textAlign: "center" }}>操作</th></tr></thead>
                  <tbody>
                    {filteredParams.map((p: any) => (
                      <tr key={p.param_id} style={{ background: "#fff" }}>
                        <td style={{ ...td, fontWeight: 500, fontFamily: "monospace", fontSize: 12 }}>{p.param_key}</td>
                        <td style={td}>{p.param_key}</td>
                        <td style={{ ...td, fontFamily: "monospace", fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{p.param_value}</td>
                        <td style={td}><span style={ts("#e6f7ff", "#1890ff")}>{p.param_type}</span></td>
                        <td style={{ ...td, fontSize: 12, color: "#888" }}>{p.description || "-"}</td>
                        <td style={{ ...td, textAlign: "center" }}>
                          <button onClick={() => { setEditingParam(p); setParamForm({ param_code: p.param_key, param_name: p.param_name || p.param_key, param_value: p.param_value, data_type: p.param_type || "STRING", description: p.description || "" }); setShowParamModal(true); }} style={actionBtn}>編輯</button>
                          <button onClick={() => handleDeleteParam(p.param_id)} style={{ ...actionBtn, color: "#ff4d4f", borderColor: "#ffccc7" }}>刪除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {showParamModal && (
              <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowParamModal(false); }}>
                <div style={modalCard}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>{editingParam ? "編輯參數" : "新增參數"}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div><div style={sl}>參數代碼 <span style={{ color: "#ff4d4f" }}>*</span></div><input style={si} value={paramForm.param_code} onChange={e => setParamForm({ ...paramForm, param_code: e.target.value })} disabled={!!editingParam} /></div>
                    <div><div style={sl}>名稱</div><input style={si} value={paramForm.param_name} onChange={e => setParamForm({ ...paramForm, param_name: e.target.value })} /></div>
                    <div><div style={sl}>值</div><input style={si} value={paramForm.param_value} onChange={e => setParamForm({ ...paramForm, param_value: e.target.value })} /></div>
                    <div><div style={sl}>類型</div><select style={si} value={paramForm.data_type} onChange={e => setParamForm({ ...paramForm, data_type: e.target.value })}><option>STRING</option><option>NUMBER</option><option>BOOLEAN</option><option>JSON</option></select></div>
                    <div style={{ gridColumn: "1/-1" }}><div style={sl}>說明</div><input style={si} value={paramForm.description || ""} onChange={e => setParamForm({ ...paramForm, description: e.target.value })} /></div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                    <button onClick={() => setShowParamModal(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                    <button onClick={saveParam} disabled={paramSaving} style={{ ...bp, opacity: paramSaving ? 0.6 : 1 }}>{paramSaving ? "儲存中..." : "儲存"}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====== 角色管理 ====== */}
        {activeTab === "roles" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <input style={{ ...si, width: 280 }} placeholder="搜尋角色..." value={roleSearch} onChange={e => setRoleSearch(e.target.value)} />
              <button onClick={() => { setEditingRole(null); setRoleForm({ role_code: "", role_name: "", description: "" }); setShowRoleModal(true); }} style={bp}>+ 新增角色</button>
            </div>
            {rolesLoading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : filteredRoles.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無角色</div> : (
              <div style={cb}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><th style={th}>角色代碼</th><th style={th}>名稱</th><th style={th}>描述</th><th style={th}>權限數</th><th style={{ ...th, textAlign: "center" }}>操作</th></tr></thead>
                  <tbody>
                    {filteredRoles.map((r: any) => (
                      <tr key={r.role_id} style={{ background: "#fff" }}>
                        <td style={{ ...td, fontWeight: 500, fontFamily: "monospace", fontSize: 12 }}>{r.role_code}</td>
                        <td style={td}>{r.role_name}</td>
                        <td style={{ ...td, fontSize: 12, color: "#888" }}>{r.description || "-"}</td>
                        <td style={td}><span style={ts("#e6f7ff", "#1890ff")}>{r.permission_count || 0}</span></td>
                        <td style={{ ...td, textAlign: "center" }}>
                          <button onClick={() => openRolePerms(r)} style={{ ...actionBtn, color: "#52c41a", borderColor: "#b7eb8f" }}>權限</button>
                          <button onClick={() => { setEditingRole(r); setRoleForm({ role_code: r.role_code, role_name: r.role_name, description: r.description || "" }); setShowRoleModal(true); }} style={actionBtn}>編輯</button>
                          <button onClick={() => handleDeleteRole(r.role_id)} style={{ ...actionBtn, color: "#ff4d4f", borderColor: "#ffccc7" }}>刪除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {showRoleModal && (
              <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowRoleModal(false); }}>
                <div style={modalCard}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>{editingRole ? "編輯角色" : "新增角色"}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div><div style={sl}>角色代碼 <span style={{ color: "#ff4d4f" }}>*</span></div><input style={si} value={roleForm.role_code} onChange={e => setRoleForm({ ...roleForm, role_code: e.target.value })} disabled={!!editingRole} /></div>
                    <div><div style={sl}>角色名稱 <span style={{ color: "#ff4d4f" }}>*</span></div><input style={si} value={roleForm.role_name} onChange={e => setRoleForm({ ...roleForm, role_name: e.target.value })} /></div>
                    <div style={{ gridColumn: "1/-1" }}><div style={sl}>描述</div><textarea style={{ ...si, height: 60, resize: "vertical" }} value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} /></div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                    <button onClick={() => setShowRoleModal(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                    <button onClick={saveRole} disabled={roleSaving} style={{ ...bp, opacity: roleSaving ? 0.6 : 1 }}>{roleSaving ? "儲存中..." : "儲存"}</button>
                  </div>
                </div>
              </div>
            )}
            {showPermModal && editingRole && (
              <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowPermModal(false); }}>
                <div style={{ ...modalCard, width: 700 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>設定權限 — {editingRole.role_name}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, maxHeight: 450, overflow: "auto" }}>
                    {perms.map((perm: any) => {
                      const checked = selectedPerms.has(perm.permission_id);
                      return (
                        <label key={perm.permission_id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, background: "#fafafa", fontSize: 13, cursor: "pointer" }}>
                          <input type="checkbox" checked={checked} onChange={() => { setSelectedPerms(prev => { const next = new Set(prev); if (next.has(perm.permission_id)) next.delete(perm.permission_id); else next.add(perm.permission_id); return next; }); }} />
                          <span>{perm.permission_name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                    <button onClick={() => setShowPermModal(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                    <button onClick={saveRolePerms} disabled={permSaving} style={{ ...bp, opacity: permSaving ? 0.6 : 1 }}>{permSaving ? "儲存中..." : "確認"}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====== 使用者管理 ====== */}
        {activeTab === "users" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <input style={{ ...si, width: 280 }} placeholder="搜尋員工編號/姓名/Email..." value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }} />
              <button onClick={() => setShowAddUser(true)} style={bp}>+ 新增使用者</button>
            </div>
            {usersLoading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : users.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無使用者</div> : (
              <div style={cb}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><th style={th}>員工編號</th><th style={th}>姓名</th><th style={th}>顯示名稱</th><th style={th}>角色</th><th style={th}>職務</th><th style={th}>區域</th><th style={th}>電話</th><th style={th}>手機</th><th style={th}>Email</th><th style={th}>設備數</th><th style={th}>最後登入</th><th style={th}>狀態</th><th style={th}>操作</th></tr></thead>
                  <tbody>
                    {users.map((u: any, i: number) => (
                      <tr key={u.employee_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ ...td, fontWeight: 500 }}>{u.employee_no}</td>
                        <td style={td}>{u.full_name}</td>
                        <td style={td}>{u.display_name || "-"}</td>
                        <td style={td}><span style={ts("#e6f7ff", "#1890ff")}>{u.role_code}</span></td>
                        <td style={td}>{u.job_title || "-"}</td>
                        <td style={td}>{u.region_code || "-"}</td>
                        <td style={td}>{u.phone || "-"}</td>
                        <td style={td}>{u.mobile || "-"}</td>
                        <td style={{ ...td, fontSize: 12 }}>{u.email || "-"}</td>
                        <td style={td}>{u.device_count || 0}</td>
                        <td style={{ ...td, fontSize: 12, color: "#888" }}>{u.last_login_at ? u.last_login_at.slice(0, 16).replace("T", " ") : "從未登入"}</td>
                        <td style={td}>{u.is_active ? <span style={ts("#f6ffed", "#52c41a")}>啟用</span> : <span style={ts("#fff1f0", "#ff4d4f")}>停用</span>}</td>
                         <td style={td}><button onClick={() => editUser(u)} style={{height:26,padding:"0 10px",borderRadius:3,border:"1px solid #d9d9d9",background:"#fff",color:"#666",fontSize:11,cursor:"pointer",marginRight:4}}>修改</button><button onClick={() => deleteUser(u.employee_id, u.full_name)} style={{height:26,padding:"0 10px",borderRadius:3,border:"1px solid #ffccc7",background:"#fff",color:"#ff4d4f",fontSize:11,cursor:"pointer",marginRight:4}}>刪除</button><button onClick={() => toggleUserActive(u.employee_id, u.is_active)} style={{height:26,padding:"0 10px",borderRadius:3,border:"1px solid #d9d9d9",background:"#fff",color:"#666",fontSize:11,cursor:"pointer"}}>{u.is_active ? "停用" : "啟用"}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#999" }}>共 {userPagination.total} 筆</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button disabled={userPage <= 1} onClick={() => setUserPage(userPage - 1)} style={{ ...actionBtn, opacity: userPage <= 1 ? 0.4 : 1 }}>上一頁</button>
                    <button disabled={userPage >= (userPagination.total_pages || 1)} onClick={() => setUserPage(userPage + 1)} style={{ ...actionBtn, opacity: userPage >= (userPagination.total_pages || 1) ? 0.4 : 1 }}>下一頁</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====== 審計日誌 ====== */}
        {activeTab === "audit" && (
          <div>
            {logsLoading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : logs.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無審計記錄</div> : (
              <div style={cb}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><th style={th}>時間</th><th style={th}>使用者</th><th style={th}>操作</th><th style={th}>對象類型</th><th style={th}>詳情</th></tr></thead>
                  <tbody>
                    {logs.map((l: any, i: number) => (
                      <tr key={l.log_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ ...td, fontSize: 12, whiteSpace: "nowrap" }}>{l.created_at ? l.created_at.slice(0, 19).replace("T", " ") : "-"}</td>
                        <td style={{ ...td, fontSize: 12 }}>{l.full_name || l.employee_no || (l.user_id ? l.user_id.slice(0, 8) : "-")}</td>
                        <td style={td}><span style={ts("#fff7e6", "#fa8c16")}>{ACTION_MAP[l.action] || l.action}</span></td>
                        <td style={{ ...td, fontSize: 12 }}>{l.entity_type || "-"}</td>
                        <td style={{ ...td, fontSize: 11, color: "#555", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formatAuditDetail(l)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#999" }}>共 {logPagination.total} 筆</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button disabled={logPage <= 1} onClick={() => setLogPage(logPage - 1)} style={{ ...actionBtn, opacity: logPage <= 1 ? 0.4 : 1 }}>上一頁</button>
                    <button disabled={logPage >= (logPagination.total_pages || 1)} onClick={() => setLogPage(logPage + 1)} style={{ ...actionBtn, opacity: logPage >= (logPagination.total_pages || 1) ? 0.4 : 1 }}>下一頁</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====== 設備綁定 ====== */}
        {activeTab === "devices" && (
          <div>
            {devicesLoading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : devices.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無設備</div> : (
              <div style={cb}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><th style={th}>員工編號</th><th style={th}>設備名稱</th><th style={th}>設備類型</th><th style={th}>平台</th><th style={th}>綁定時間</th><th style={{ ...th, textAlign: "center" }}>操作</th></tr></thead>
                  <tbody>
                    {devices.map((d: any, i: number) => (
                      <tr key={d.device_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ ...td, fontSize: 12 }}>{d.employee_id ? d.employee_id.slice(0, 8) : "-"}</td>
                        <td style={td}>{d.device_name || "-"}</td>
                        <td style={td}>{d.device_type || "-"}</td>
                        <td style={td}>{d.platform || "-"}</td>
                        <td style={{ ...td, fontSize: 12 }}>{d.created_at ? d.created_at.slice(0, 16).replace("T", " ") : "-"}</td>
                        <td style={{ ...td, textAlign: "center" }}><button onClick={() => unbindDevice(d.device_id)} style={{ ...actionBtn, color: "#ff4d4f", borderColor: "#ffccc7" }}>解綁</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ====== 公司管理 ====== */}
        {activeTab === "company" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#333", margin: 0 }}>公司管理</h3>
              <button onClick={() => { setEditingCompany(null); setCompanyForm({ company_code: "", company_name: "", short_name: "", tax_id: "", address: "", phone: "", email: "", fax: "", website: "", medical_permit_no: "", pharma_permit_no: "", gmp_cert_no: "", bank_name: "", bank_account: "", bank_account_name: "", invoice_title: "", logo_url: "", remark: "" }); setShowCompanyModal(true); }} style={bp}>+ 新增公司</button>
            </div>
            {companyLoading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : companies.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無公司資料</div> : (
              <div style={cb}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><th style={th}>公司代碼</th><th style={th}>公司全稱</th><th style={th}>簡稱</th><th style={th}>統編</th><th style={th}>電話</th><th style={th}>Email</th><th style={th}>操作</th></tr></thead>
                  <tbody>
                    {companies.map((comp: any, i: number) => (
                      <tr key={comp.company_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ ...td, fontWeight: 500, fontFamily: "monospace", cursor: "pointer", color: company?.company_id === comp.company_id ? "#1890ff" : "#333", background: company?.company_id === comp.company_id ? "#e6f7ff" : "transparent" }} onClick={() => { setCompany(comp); setCompanyForm({...comp}); setEditCompany(false); }}>{comp.company_code}</td>
                        <td style={{ ...td, cursor: "pointer", color: company?.company_id === comp.company_id ? "#1890ff" : "#333", background: company?.company_id === comp.company_id ? "#e6f7ff" : "transparent" }} onClick={() => { setCompany(comp); setCompanyForm({...comp}); setEditCompany(false); }}>{comp.company_name}</td>
                        <td style={td}>{comp.short_name || "-"}</td>
                        <td style={{ ...td, fontSize: 12 }}>{comp.tax_id || "-"}</td>
                        <td style={{ ...td, fontSize: 12 }}>{comp.phone || "-"}</td>
                        <td style={{ ...td, fontSize: 12 }}>{comp.email || "-"}</td>
                        <td style={td}>
                          <button onClick={() => { setEditingCompany(comp); setCompanyForm({ ...comp }); setShowCompanyModal(true); }} style={actionBtn}>編輯</button>
                          <button onClick={() => handleDeleteCompany(comp.company_id, comp.company_name)} style={{ ...actionBtn, color: "#ff4d4f", borderColor: "#ffccc7" }}>刪除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {showCompanyModal && (
              <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowCompanyModal(false); }}>
                <div style={modalCard}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>{editingCompany ? "編輯公司" : "新增公司"}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div><div style={sl}>公司代碼 <span style={{ color: "#ff4d4f" }}>*</span></div><input style={si} value={companyForm.company_code || ""} onChange={e => setCompanyForm({ ...companyForm, company_code: e.target.value })} disabled={!!editingCompany} /></div>
                    <div><div style={sl}>公司全稱 <span style={{ color: "#ff4d4f" }}>*</span></div><input style={si} value={companyForm.company_name || ""} onChange={e => setCompanyForm({ ...companyForm, company_name: e.target.value })} /></div>
                    <div><div style={sl}>簡稱</div><input style={si} value={companyForm.short_name || ""} onChange={e => setCompanyForm({ ...companyForm, short_name: e.target.value })} /></div>
                    <div><div style={sl}>統編</div><input style={si} value={companyForm.tax_id || ""} onChange={e => setCompanyForm({ ...companyForm, tax_id: e.target.value })} /></div>
                    <div><div style={sl}>電話</div><input style={si} value={companyForm.phone || ""} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} /></div>
                    <div><div style={sl}>Email</div><input style={si} value={companyForm.email || ""} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} /></div>
                    <div><div style={sl}>傳真</div><input style={si} value={companyForm.fax || ""} onChange={e => setCompanyForm({ ...companyForm, fax: e.target.value })} /></div>
                    <div><div style={sl}>網站</div><input style={si} value={companyForm.website || ""} onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })} /></div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                    <button onClick={() => setShowCompanyModal(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                    <button onClick={saveCompany} disabled={companySaving} style={{ ...bp, opacity: companySaving ? 0.6 : 1 }}>{companySaving ? "儲存中..." : "儲存"}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}{/* ====== 組織架構 ====== */}
{activeTab === "org" && (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 40 }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
    <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 8px" }}>組織架構管理</h3>
    <p style={{ fontSize: 13, color: "#999", margin: "0 0 20px", textAlign: "center" }}>管理部門結構、員工資料與角色權限</p>
    <button onClick={() => router.push("/organization")} style={{ height: 36, padding: "0 24px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>進入組織架構</button>
  </div>
)}

{/* ====== 公司資訊 ====== */}
{activeTab === "company" && (
  <div>
    {companyLoading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : !company ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無公司資料</div> : (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div />
          {editCompany ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setEditingCompany(null); setEditCompany(false); setCompanyForm(company); }} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" }}>取消</button>
              <button onClick={saveCompany} disabled={companySaving} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, cursor: "pointer", opacity: companySaving ? 0.6 : 1 }}>{companySaving ? "儲存中..." : "儲存"}</button>
            </div>
          ) : (
            <button onClick={() => { setEditingCompany(company); setEditCompany(true); }} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 13, cursor: "pointer" }}>編輯</button>
          )}
        </div>

        {/* Basic Info */}
        <div style={{ background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", margin: 0 }}>基本資訊</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 0 }}>
            {[["公司編碼","company_code"],["公司全名","company_name"],["公司簡稱","short_name"],["統一編號","tax_id"],["公司地址","address"],["公司電話","phone"],["公司Email","email"],["傳真","fax"],["網站","website"],["醫療器材許可證號","medical_permit_no"],["藥品許可證號","pharma_permit_no"],["GMP認證號","gmp_cert_no"],["銀行名稱","bank_name"],["銀行帳號","bank_account"],["帳戶名稱","bank_account_name"],["發票抬頭","invoice_title"],["備註","remark"]].map(([label,field]) => (
              <div key={field} style={{ padding: "10px 16px", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>{label}</div>
                {editCompany ? (
                  field === "remark" ? <textarea style={{ width: "100%", height: 60, padding: "6px 10px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} value={companyForm[field] || ""} onChange={e => setCompanyForm({...companyForm, [field]: e.target.value})} /> :
                  <input style={{ width: "100%", height: 32, padding: "0 10px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, boxSizing: "border-box" }} value={companyForm[field] || ""} onChange={e => setCompanyForm({...companyForm, [field]: e.target.value})} />
                ) : <div style={{ fontSize: 14, color: "#333" }}>{company[field] || "-"}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div style={{ background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", margin: 0 }}>聯絡資訊</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 0 }}>
            {[["電話","phone"],["傳真","fax"],["Email","email"],["官網","website"],["地址","address"]].map(([label,field]) => (
              <div key={field} style={{ padding: "10px 16px", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>{label}</div>
                {editCompany ? (
                  <input style={{ width: "100%", height: 32, padding: "0 10px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, boxSizing: "border-box" }} value={companyForm[field] || ""} onChange={e => setCompanyForm({...companyForm, [field]: e.target.value})} />
                ) : <div style={{ fontSize: 14, color: "#333" }}>{company[field] || "-"}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Permits */}
        <div style={{ background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", margin: 0 }}>醫療器材證照</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 0 }}>
            {[["醫療器材許可證","medical_permit_no"],["藥商許可執照","pharma_permit_no"],["GMP/ISO 認證","gmp_cert_no"]].map(([label,field]) => (
              <div key={field} style={{ padding: "10px 16px", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>{label}</div>
                {editCompany ? (
                  <input style={{ width: "100%", height: 32, padding: "0 10px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, boxSizing: "border-box" }} value={companyForm[field] || ""} onChange={e => setCompanyForm({...companyForm, [field]: e.target.value})} />
                ) : <div style={{ fontSize: 14, color: "#333" }}>{company[field] || "-"}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Bank Info */}
        <div style={{ background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", margin: 0 }}>銀行資訊（打印表單用）</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 0 }}>
            {[["銀行名稱","bank_name"],["銀行帳號","bank_account"],["帳戶戶名","bank_account_name"]].map(([label,field]) => (
              <div key={field} style={{ padding: "10px 16px", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>{label}</div>
                {editCompany ? (
                  <input style={{ width: "100%", height: 32, padding: "0 10px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, boxSizing: "border-box" }} value={companyForm[field] || ""} onChange={e => setCompanyForm({...companyForm, [field]: e.target.value})} />
                ) : <div style={{ fontSize: 14, color: "#333" }}>{company[field] || "-"}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
)}

{/* ====== 資料匯入 ====== */}
{activeTab === "imports" && <ImportSection />}





{/* ====== 欄位權限 ====== */}
{activeTab === "fieldPolicy" && (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>欄位級權限配置</div>
      <button onClick={() => { setEditingFp(null); setFpForm({ role_code: "SALES", entity_type: "customer", field_name: "", access_level: "READ" }); setShowFpModal(true); }} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, cursor: "pointer" }}>+ 新增規則</button>
    </div>
    {fpLoading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : fieldPolicies.length === 0 ? (
      <div style={{ textAlign: "center", padding: 60, color: "#999", background: "#fff", borderRadius: 6 }}>尚無欄位權限規則</div>
    ) : (
      <div style={{ background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#fafafa" }}>
            <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>角色</th>
            <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>實體類型</th>
            <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>欄位名稱</th>
            <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>存取等級</th>
            <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0", width: 120 }}>操作</th>
          </tr></thead>
          <tbody>
            {fieldPolicies.map((fp, i) => (
              <tr key={fp.policy_id || i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" }}><span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: "#e6f7ff", color: "#1890ff" }}>{fp.role_code || "-"}</span></td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" }}>{fp.entity_type || "-"}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0", fontFamily: "monospace" }}>{fp.field_name || "-"}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: fp.access_level === "HIDDEN" ? "#fff1f0" : fp.access_level === "WRITE" ? "#fff7e6" : "#f6ffed", color: fp.access_level === "HIDDEN" ? "#ff4d4f" : fp.access_level === "WRITE" ? "#fa8c16" : "#52c41a" }}>{fp.access_level === "HIDDEN" ? "隱藏" : fp.access_level === "WRITE" ? "讀寫" : "唯讀"}</span>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                  <button onClick={() => { setEditingFp(fp); setFpForm({ role_code: fp.role_code, entity_type: fp.entity_type, field_name: fp.field_name, access_level: fp.access_level }); setShowFpModal(true); }} style={{ height: 26, padding: "0 10px", borderRadius: 3, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 11, cursor: "pointer", marginRight: 4 }}>編輯</button>
                  <button onClick={() => deleteFieldPolicy(fp)} style={{ height: 26, padding: "0 10px", borderRadius: 3, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 11, cursor: "pointer" }}>刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

{/* ====== FP Modal ====== */}
{showFpModal && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowFpModal(false)}>
    <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 480, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
      <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>{editingFp ? "編輯欄位權限" : "新增欄位權限"}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>角色</div>
          <select style={{ width: "100%", height: 36, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px", background: "#fff", outline: "none" }} value={fpForm.role_code} onChange={e => setFpForm({...fpForm, role_code: e.target.value})}>
            <option value="SALES">業務員</option><option value="REGION_MANAGER">區域經理</option><option value="SALES_DIRECTOR">業務總監</option>
            <option value="FINANCE">財務</option><option value="FINANCE_CLERK">財務專員</option><option value="FINANCE_DIRECTOR">財務總監</option>
            <option value="QA">品保</option><option value="QA_SUPERVISOR">品保主管</option><option value="QA_DIRECTOR">品保總監</option>
            <option value="PURCHASE">採購</option><option value="WAREHOUSE">倉儲</option><option value="GM">總經理</option>
            <option value="EXECUTIVE_DIRECTOR">執行董事</option><option value="ADMIN">系統管理員</option>
            <option value="CUSTOMER_SERVICE">客服</option><option value="DATA_MIGRATOR">資料遷移專員</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>實體類型</div>
          <select style={{ width: "100%", height: 36, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px", background: "#fff", outline: "none" }} value={fpForm.entity_type} onChange={e => setFpForm({...fpForm, entity_type: e.target.value})}>
            <option value="customer">客戶</option><option value="product">產品</option><option value="supplier">供應商</option>
            <option value="sales_order">銷售訂單</option><option value="purchase_order">採購單</option>
            <option value="inventory">庫存</option><option value="consignment">寄庫</option>
            <option value="recall">召回</option><option value="sample">打板</option>
            <option value="visit">拜訪</option><option value="finance">財務</option>
            <option value="employee">員工</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>欄位名稱 *</div>
          <select style={{ width: "100%", height: 36, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px", background: "#fff", outline: "none" }} value={fpForm.field_name} onChange={e => setFpForm({...fpForm, field_name: e.target.value})}><option value="">請選擇欄位</option>{(FIELD_OPTIONS[fpForm.entity_type] || []).map(f => <option key={f.value} value={f.value}>{f.label} ({f.value})</option>)}</select>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>存取等級</div>
          <select style={{ width: "100%", height: 36, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px", background: "#fff", outline: "none" }} value={fpForm.access_level} onChange={e => setFpForm({...fpForm, access_level: e.target.value})}>
            <option value="READ">唯讀 (READ)</option>
            <option value="WRITE">讀寫 (WRITE)</option>
            <option value="HIDDEN">隱藏 (HIDDEN)</option>
          </select>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <button onClick={() => setShowFpModal(false)} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" }}>取消</button>
        <button onClick={saveFieldPolicy} disabled={fpSaving} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, cursor: "pointer", opacity: fpSaving ? 0.6 : 1 }}>{fpSaving ? "儲存中..." : (editingFp ? "更新" : "建立")}</button>
      </div>
    </div>
  </div>
)}

{/* ===== 審批流程 ====== */}
{activeTab === "workflow" && (<>
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    {workflowLoading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : <>
        <div style={{ padding: "12px 16px", background: "#e6f7ff", borderRadius: 6, border: "1px solid #91d5ff", fontSize: 13, color: "#1890ff", lineHeight: 1.8 }}>
          <strong>📋 使用說明：</strong>下方展示系統中所有狀態轉換規則。每筆記錄表示「從某狀態 → 經過某動作 → 變成新狀態」。<br />
          例如：銷售訂單草稿 → 點選「提交審批」→ 變成待審批狀態。這些規則由系統開發時定義，一般不需修改。
        </div>

        {/* Group by entity */}
        {(() => {
          const ENTITY_NAMES: Record<string, string> = { SalesOrder: "銷售訂單", SALES_ORDER: "銷售訂單 低於最低價", RecallCase: "召回案件", RECALL_CASE: "召回案件", PurchaseOrder: "採購單", PURCHASE_ORDER: "採購單", SampleRequest: "打板申請", SAMPLE_REQUEST: "打板申請", VisitRecord: "業務拜訪", VISIT_RECORD: "業務拜訪", BudgetAdjustment: "預算調整", BUDGET_ADJUSTMENT: "預算調整" };
          const STATE_NAMES: Record<string, string> = {
            DRAFT: "草稿", PENDING_APPROVAL: "待審批", PENDING: "待審批", APPROVED: "已核准", REJECTED: "已駁回", REJECTED_LOCKED: "已駁回(鎖定)",
            SHIPPED: "已出貨", COMPLETED: "已完成", CANCELLED: "已取消", IN_PROGRESS: "執行中", RESOLVED: "已解決", CLOSED: "已結案",
            SUBMITTED: "已提交", FINANCE_APPROVED: "財務已核", GM_APPROVED: "總經理已核", CHECKED_IN: "已簽到", PLANNED: "已排程"
          };
          const ACTION_NAMES: Record<string, string> = {
            submit: "提交審批", approve: "核准", reject: "駁回", revise: "修改", lock: "鎖定", unlock: "解鎖",
            ship: "出貨", complete: "完成", cancel: "取消", start: "開始執行", resolve: "解決", close: "結案", reopen: "重新開啟",
            start_approval: "啟動審批", finance_approve: "財務核准", gm_approve: "總經理核准", ed_approve: "執行董事核准",
            checkin: "簽到", submit: "提交"
          };
          
          const groups: Record<string, any[]> = {};
          stateMachines.forEach(sm => {
            if (!groups[sm.entity_type]) groups[sm.entity_type] = [];
            groups[sm.entity_type].push(sm);
          });
          
          return Object.entries(groups).map(([entity, items]) => (
            <div key={entity} style={{ background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" }}>
              <h3 style={{ padding: "12px 16px", margin: 0, fontSize: 14, fontWeight: 600, color: "#1a1a2e", borderBottom: "1px solid #f0f0f0", background: "#fafbfc" }}>
                🏷 {ENTITY_NAMES[entity] || entity}
                <span style={{ fontSize: 11, fontWeight: 400, color: "#999", marginLeft: 8 }}>（{items.length} 條轉換規則）</span>
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#fafafa" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0", width: 140 }}>當前狀態</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0", width: 80 }}>觸發動作</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0", width: 140 }}>目標狀態</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>流程說明</th>
                </tr></thead>
                <tbody>
                  {items.map((sm, i) => {
                    const fromCN = STATE_NAMES[sm.from_state] || sm.from_state;
                    const toCN = STATE_NAMES[sm.to_state] || sm.to_state;
                    const actionCN = ACTION_NAMES[sm.action] || sm.action;
                    const desc = `「${fromCN}」的單據，執行「${actionCN}」後，狀態變為「${toCN}」`;
                    return (
                      <tr key={sm.id || i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 3, background: "#e6f7ff", color: "#1890ff" }}>{fromCN}</span>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#fa8c16", background: "#fff7e6", padding: "3px 10px", borderRadius: 3 }}>{actionCN}</span>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 3, background: "#f6ffed", color: "#52c41a" }}>{toCN}</span>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#666", borderBottom: "1px solid #f0f0f0" }}>{desc}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ));
        })()}

        {/* Workflow Definitions */}
        <div style={{ background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ padding: "12px 16px", margin: 0, fontSize: 14, fontWeight: 600, color: "#333", borderBottom: "1px solid #f0f0f0", background: "#fafbfc", flex: 1 }}>📐 審批流程定義（進階）</h3>
            <button onClick={() => { setEditingWf(null); setWfForm({ workflow_code: "", workflow_name: "", entity_type: "SalesOrder", steps: [] as any[], is_active: true }); setShowWfModal(true); }} style={{ marginRight: 12, height: 30, padding: "0 14px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 12, cursor: "pointer" }}>+ 新增流程</button>
          </div>
          {workflows.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "#999" }}>
              <div style={{ fontSize: 14, marginBottom: 8 }}>尚無自訂審批流程</div>
              <div style={{ fontSize: 12, color: "#bbb" }}>上方狀態機規則已涵蓋基本審批邏輯。如需自訂多層審批鏈，可由管理員透過資料庫新增。</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#fafafa" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>流程編碼</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>流程名稱</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>適用單據</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>審批層數</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>狀態</th><th style={{ padding: "10px 8px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0", width: 120 }}>操作</th>
              </tr></thead>
              <tbody>
                {workflows.map((wf, i) => (
                  <tr key={wf.workflow_id || i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0", fontFamily: "monospace" }}>{wf.workflow_code || "-"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" }}>{wf.workflow_name || "-"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" }}>{(() => { const WFE: Record<string,string> = { SalesOrder: "銷售訂單", SALES_ORDER: "銷售訂單", RecallCase: "召回案件", RECALL_CASE: "召回案件", PurchaseOrder: "採購單", PURCHASE_ORDER: "採購單", SampleRequest: "打板申請", SAMPLE_REQUEST: "打板申請", BudgetAdjustment: "預算調整", BUDGET_ADJUSTMENT: "預算調整" }; return WFE[wf.entity_type] || wf.entity_type || "-"; })()}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>{(() => { const ss = typeof wf.steps === "string" ? JSON.parse(wf.steps) : (wf.steps || []); const arr = Array.isArray(ss) ? ss : []; return <><span style={{ fontWeight: 600 }}>{arr.length} 層</span>{arr.length > 0 && <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{arr.map((s: any) => {
  if (typeof s === "string") return s;
  const ACTION_CN: Record<string,string> = {
    submit: "提交審批", approve: "核准", reject: "駁回", revise: "退回修改",
    lock: "鎖定", unlock: "解鎖", ship: "出貨", complete: "完成", cancel: "取消",
    start: "開始執行", resolve: "解決", close: "結案", reopen: "重新開啟",
    start_approval: "啟動審批", finance_approve: "財務核准", gm_approve: "總經理核准",
    ed_approve: "執行董事核准", checkin: "簽到", submit_low_price: "低價提交審批",
    director_approve: "總監審批", allocate: "配貨"
  };
  return s.name || ACTION_CN[s.action] || s.action || "-";
}).join(" → ")}</div>}</>; })()}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: wf.is_active ? "#f6ffed" : "#fff1f0", color: wf.is_active ? "#52c41a" : "#ff4d4f" }}>{wf.is_active ? "啟用" : "停用"}</span>
                    </td>
                  <td style={{ padding: "8px 8px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}><button onClick={() => { setEditingWf(wf); let parsed = typeof wf.steps === "string" ? JSON.parse(wf.steps) : (wf.steps || []); parsed = Array.isArray(parsed) ? parsed.map((s: any) => typeof s === "string" ? { name: s, action: s, approver_role: "" } : s) : []; setWfForm({ workflow_code: wf.workflow_code, workflow_name: wf.workflow_name, entity_type: wf.entity_type, steps: parsed, is_active: wf.is_active }); setShowWfModal(true); }} style={{ height: 24, padding: "0 8px", borderRadius: 3, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 11, cursor: "pointer", marginRight: 6 }}>編輯</button><button onClick={() => deleteWorkflow(wf.workflow_id)} style={{ height: 24, padding: "0 8px", borderRadius: 3, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 11, cursor: "pointer" }}>刪除</button></td>                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
    </>}
  </div>
      {showWfModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowWfModal(false); }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 520, maxHeight: "80vh", overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>{editingWf ? "編輯審批流程" : "新增審批流程"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>流程編碼 <span style={{ color: "#ff4d4f" }}>*</span></div><input style={{ width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", boxSizing: "border-box" }} value={wfForm.workflow_code} onChange={e => setWfForm({...wfForm, workflow_code: e.target.value})} placeholder="例如: SALES_ORDER_APPROVAL" /></div>
              <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>流程名稱 <span style={{ color: "#ff4d4f" }}>*</span></div><input style={{ width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", boxSizing: "border-box" }} value={wfForm.workflow_name} onChange={e => setWfForm({...wfForm, workflow_name: e.target.value})} placeholder="例如: 銷售訂單審批流程" /></div>
              <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>適用單據</div><select style={{ width: "100%", height: 36, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px", background: "#fff", outline: "none" }} value={wfForm.entity_type} onChange={e => setWfForm({...wfForm, entity_type: e.target.value})}><option value="SalesOrder">銷售訂單</option><option value="RecallCase">召回案件</option><option value="PurchaseOrder">採購單</option><option value="SampleRequest">打板申請</option><option value="BudgetAdjustment">預算調整</option></select></div>
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>審批步驟（按順序執行，設定每層由誰審批）</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {wfForm.steps.map((step: any, si: number) => {
                    const s = typeof step === "string" ? { name: step, action: step, approver_role: "" } : (step || { name: "", action: "", approver_role: "" });
                    return (
                    <div key={si} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#1890ff", fontWeight: 600, width: 18, textAlign: "center" }}>{si + 1}</span>
                      <input 
                        style={{ flex: 2, minWidth: 100, height: 32, padding: "0 8px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                        value={s.name}
                        onChange={e => { const ns = [...wfForm.steps]; ns[si] = {...s, name: e.target.value}; setWfForm({...wfForm, steps: ns}); }}
                        placeholder="步驟名稱，例如: 業務主管審批"
                      />
                      <select
                        style={{ flex: 1, minWidth: 90, height: 32, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 12, padding: "0 4px", background: "#fff", outline: "none" }}
                        value={s.action}
                        onChange={e => { const ns = [...wfForm.steps]; ns[si] = {...s, action: e.target.value, name: s.name || e.target.value}; setWfForm({...wfForm, steps: ns}); }}
                      >
                        <option value="">選擇動作</option>
                        <option value="submit">提交審批</option>
                        <option value="approve">核准</option>
                        <option value="reject">駁回</option>
                        <option value="revise">退回修改</option>
                        <option value="lock">鎖定</option>
                        <option value="unlock">解鎖</option>
                        <option value="ship">出貨</option>
                        <option value="complete">完成</option>
                        <option value="cancel">取消</option>
                        <option value="start">開始執行</option>
                        <option value="resolve">解決</option>
                        <option value="close">結案</option>
                        <option value="reopen">重新開啟</option>
                        <option value="start_approval">啟動審批</option>
                        <option value="finance_approve">財務核准</option>
                        <option value="gm_approve">總經理核准</option>
                        <option value="ed_approve">執行董事核准</option>
                        <option value="checkin">簽到</option>
                        <option value="submit_low_price">低價提交審批</option>
                        <option value="director_approve">總監審批</option>
                        <option value="allocate">配貨</option>
                      </select>
                      <select
                        style={{ flex: 1, minWidth: 90, height: 32, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 12, padding: "0 4px", background: "#fff", outline: "none" }}
                        value={s.approver_role || ""}
                        onChange={e => { const ns = [...wfForm.steps]; ns[si] = {...s, approver_role: e.target.value}; setWfForm({...wfForm, steps: ns}); }}
                      >
                        <option value="">選擇角色</option>
                        <option value="SALES_DIRECTOR">業務總監</option>
                        <option value="REGION_MANAGER">區域經理</option>
                        <option value="FINANCE">財務</option>
                        <option value="FINANCE_DIRECTOR">財務總監</option>
                        <option value="GM">總經理</option>
                        <option value="EXECUTIVE_DIRECTOR">執行董事</option>
                        <option value="QA_DIRECTOR">品保總監</option>
                        <option value="ADMIN">系統管理員</option>
                      </select>
                      <button onClick={() => {
                        const ns = wfForm.steps.filter((_: any, i: number) => i !== si);
                        setWfForm({...wfForm, steps: ns});
                      }} style={{ height: 28, width: 28, borderRadius: 4, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }} title="移除">✕</button>
                    </div>
                  )})}
                  <button onClick={() => setWfForm({...wfForm, steps: [...wfForm.steps, { name: "", action: "", approver_role: "" }]})} style={{ height: 28, padding: "0 12px", borderRadius: 4, border: "1px dashed #1890ff", background: "#f0f7ff", color: "#1890ff", fontSize: 12, cursor: "pointer", alignSelf: "flex-start" }}>+ 新增步驟</button>
                </div>
              </div>
              <div><label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={wfForm.is_active} onChange={e => setWfForm({...wfForm, is_active: e.target.checked})} /> 啟用此流程</label></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowWfModal(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
              <button onClick={saveWorkflow} disabled={wfSaving} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, cursor: "pointer", opacity: wfSaving ? 0.6 : 1 }}>{wfSaving ? "儲存中..." : "儲存"}</button>
            </div>
          </div>
        </div>
      )}
</>)}
{/* ===== 列印模板 ====== */}
{activeTab === "print" && (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>列印模板列表</div>
      <button onClick={() => { setPrintForm({ template_code: "", template_name: "", entity_type: "SALES_ORDER", html_content: "", paper_size: "A4", is_active: true, remark: "" }); setShowPrintModal(true); }} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, cursor: "pointer" }}>+ 新增模板</button>
    </div>
    {printLoading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : printTemplates.length === 0 ? (
      <div style={{ textAlign: "center", padding: 60, color: "#999", background: "#fff", borderRadius: 6 }}>尚無列印模板</div>
    ) : (
      <div style={{ background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#fafafa" }}>
            <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>模板編碼</th>
            <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>模板名稱</th>
            <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>單據類型</th>
            <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>紙張</th>
            <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>狀態</th>
            <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid #f0f0f0" }}>操作</th>
          </tr></thead>
          <tbody>
            {printTemplates.map((tpl, i) => (
              <tr key={tpl.template_id || i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0", fontFamily: "monospace" }}>{tpl.template_code || "-"}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" }}>{tpl.template_name || "-"}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" }}>{tpl.entity_type || "-"}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" }}>{tpl.paper_size || "A4"}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: tpl.is_active ? "#f6ffed" : "#fff1f0", color: tpl.is_active ? "#52c41a" : "#ff4d4f" }}>{tpl.is_active ? "啟用" : "停用"}</span>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                  <button onClick={() => togglePrintActive(tpl)} style={{ height: 26, padding: "0 10px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 11, cursor: "pointer" }}>{tpl.is_active ? "停用" : "啟用"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

{/* ====== Print Modal ====== */}
{showPrintModal && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowPrintModal(false)}>
    <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 600, maxHeight: "80vh", overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
      <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>新增列印模板</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>模板編碼</div><input style={{ width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", boxSizing: "border-box" }} value={printForm.template_code} onChange={e => setPrintForm({...printForm, template_code: e.target.value})} placeholder="SALES_ORDER_A4" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>模板名稱 *</div><input style={{ width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", boxSizing: "border-box" }} value={printForm.template_name} onChange={e => setPrintForm({...printForm, template_name: e.target.value})} placeholder="銷售訂單標準模板" /></div>
          <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>紙張大小</div><select style={{ width: "100%", height: 36, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px", background: "#fff", outline: "none" }} value={printForm.paper_size} onChange={e => setPrintForm({...printForm, paper_size: e.target.value})}><option value="A4">A4</option><option value="A5">A5</option><option value="LETTER">Letter</option><option value="THERMAL_80">熱感 80mm</option></select></div>
        </div>
        <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>單據類型</div><select style={{ width: "100%", height: 36, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px", background: "#fff", outline: "none" }} value={printForm.entity_type} onChange={e => setPrintForm({...printForm, entity_type: e.target.value})}><option value="SALES_ORDER">銷售訂單</option><option value="PURCHASE_ORDER">採購單</option><option value="CONSIGNMENT_RELEASE">寄庫出庫單</option><option value="RECALL_NOTICE">召回通知</option><option value="SAMPLE_REQUEST">打板申請</option></select></div>
        <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>HTML 模板內容</div><textarea style={{ width: "100%", height: 120, padding: "8px 10px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 12, resize: "vertical", boxSizing: "border-box", fontFamily: "monospace", outline: "none" }} value={printForm.html_content} onChange={e => setPrintForm({...printForm, html_content: e.target.value})} placeholder="<html>...</html>" /></div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <button onClick={() => setShowPrintModal(false)} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" }}>取消</button>
        <button onClick={savePrintTemplate} disabled={printSaving} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, cursor: "pointer", opacity: printSaving ? 0.6 : 1 }}>{printSaving ? "儲存中..." : "建立"}</button>
      </div>
    </div>
  </div>
)}

{/* ====== 帳號申請審批 ====== */}
{activeTab === "applications" && (
  <div>
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {["PENDING", "APPROVED", "REJECTED"].map(s => (
        <button key={s} onClick={() => { setAppsFilter(s); setAppsPage(1); }}
          style={{ height: 32, padding: "0 16px", borderRadius: 4, border: appsFilter === s ? "2px solid #1890ff" : "1px solid #d9d9d9",
            background: appsFilter === s ? "#e6f7ff" : "#fff", color: appsFilter === s ? "#1890ff" : "#666", fontSize: 13, cursor: "pointer" }}>
          {s === "PENDING" ? "待審批" : s === "APPROVED" ? "已開通" : "已拒絕"}
        </button>
      ))}
    </div>
    {appsLoading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : applications.length === 0 ? (
      <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無申請記錄</div>
    ) : (
      <div style={cb}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={th}>申請人</th><th style={th}>Email</th><th style={th}>電話</th><th style={th}>公司/機構</th><th style={th}>部門</th>
            <th style={th}>申請原因</th><th style={th}>狀態</th><th style={th}>申請時間</th><th style={th}>操作</th>
          </tr></thead>
          <tbody>
            {applications.map((a: any, i: number) => (
              <tr key={a.application_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={td}>{a.applicant_name}</td>
                <td style={td}>{a.applicant_email}</td>
                <td style={td}>{a.applicant_phone || "-"}</td>
                <td style={td}>{a.company_name || "-"}</td>
                <td style={td}>{a.department || "-"}</td>
                <td style={{ ...td, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.reason || "-"}</td>
                <td style={td}>
                  {a.status === "PENDING" ? <span style={ts("#fff7e6", "#fa8c16")}>待審批</span> :
                   a.status === "APPROVED" ? <span style={ts("#f6ffed", "#52c41a")}>已開通</span> :
                   <span style={ts("#fff1f0", "#ff4d4f")}>已拒絕</span>}
                </td>
                <td style={{ ...td, fontSize: 12, color: "#888" }}>{a.created_at ? a.created_at.slice(0, 16).replace("T", " ") : "-"}</td>
                <td style={td}>
                  {a.status === "PENDING" ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => reviewApplication(a.application_id, "APPROVED")} style={{ ...actionBtn, color: "#52c41a", borderColor: "#52c41a" }}>開通</button>
                      <button onClick={() => reviewApplication(a.application_id, "REJECTED")} style={{ ...actionBtn, color: "#ff4d4f", borderColor: "#ff4d4f" }}>拒絕</button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: "#999" }}>
                      {a.review_comment ? `原因: ${a.review_comment}` : "-"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appsPagination.total > 20 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#999" }}>共 {appsPagination.total} 筆</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button disabled={appsPage <= 1} onClick={() => setAppsPage(appsPage - 1)} style={{ ...actionBtn, opacity: appsPage <= 1 ? 0.4 : 1 }}>上一頁</button>
              <button disabled={appsPage >= (appsPagination.total_pages || 1)} onClick={() => setAppsPage(appsPage + 1)} style={{ ...actionBtn, opacity: appsPage >= (appsPagination.total_pages || 1) ? 0.4 : 1 }}>下一頁</button>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
)}

{/* ====== 設備綁定 ====== */}
        {activeTab === "devices" && (
          <div>
            {devicesLoading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : devices.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無設備綁定記錄</div> : (
              <div style={cb}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><th style={th}>員工</th><th style={th}>設備ID</th><th style={th}>設備型號</th><th style={th}>OS</th><th style={th}>綁定IP</th><th style={th}>綁定時間</th><th style={th}>操作</th></tr></thead>
                  <tbody>
                    {devices.map((d: any, i: number) => (
                      <tr key={d.device_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={td}>{d.employee_no} {d.full_name}</td>
                        <td style={{ ...td, fontFamily: "monospace", fontSize: 11 }}>{d.device_id ? d.device_id.slice(0, 12) + "..." : "-"}</td>
                        <td style={td}>{d.device_model || "-"}</td>
                        <td style={td}>{d.os_version || "-"}</td>
                        <td style={td}>{d.bind_ip || "-"}</td>
                        <td style={{ ...td, fontSize: 12 }}>{d.created_at ? d.created_at.slice(0, 16).replace("T", " ") : "-"}</td>
                        <td style={td}><button onClick={() => unbindDevice(d.device_id)} style={{ ...actionBtn, color: "#ff4d4f", borderColor: "#ff4d4f" }}>強制解綁</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}



        {/* ====== Add User Modal ====== */}
        {showAddUser && (
          <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowAddUser(false); }}>
            <div style={modalCard}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>新增使用者</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={sl}>員工編號 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={si} value={userForm.employee_no} onChange={e => setUserForm({ ...userForm, employee_no: e.target.value })} placeholder="例如: SALES001" />
                </div>
                <div>
                  <div style={sl}>姓名 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={si} value={userForm.full_name} onChange={e => setUserForm({ ...userForm, full_name: e.target.value })} />
                </div>
                <div>
                  <div style={sl}>角色</div>
                  <select style={si} value={userForm.role_code} onChange={e => setUserForm({ ...userForm, role_code: e.target.value })}>
                    {roles.map((r: any) => <option key={r.role_id} value={r.role_code}>{r.role_name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={sl}>區域</div>
                  <select style={si} value={userForm.region_code} onChange={e => setUserForm({ ...userForm, region_code: e.target.value })}>
                    <option value="">不限</option>
                    <option value="NORTH">北區</option><option value="CENTRAL">中區</option>
                    <option value="SOUTH">南區</option><option value="EAST">東區</option>
                  </select>
                </div>
                <div>
                  <div style={sl}>Email</div>
                  <input style={si} value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                </div>
                <div>
                  <div style={sl}>電話</div>
                  <input style={si} value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} />
                </div>
                <div>
                  <div style={sl}>手機</div>
                  <input style={si} value={userForm.mobile || ""} onChange={e => setUserForm({ ...userForm, mobile: e.target.value })} />
                </div>
                <div>
                  <div style={sl}>出生日期</div>
                  <input style={si} type="date" value={userForm.birth_date || ""} onChange={e => setUserForm({ ...userForm, birth_date: e.target.value })} />
                </div>
                <div>
                  <div style={sl}>顯示名稱</div>
                  <input style={si} value={userForm.display_name || ""} onChange={e => setUserForm({ ...userForm, display_name: e.target.value })} placeholder="英文名或暱稱" />
                </div>
                <div>
                  <div style={sl}>職務</div>
                  <input style={si} value={userForm.job_title || ""} onChange={e => setUserForm({ ...userForm, job_title: e.target.value })} placeholder="例如: 業務經理" />
                </div>
                <div>
                  <div style={sl}>密碼</div>
                  <input style={si} type="text" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowAddUser(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={addUser} disabled={userSaving} style={{ ...bp, opacity: userSaving ? 0.6 : 1 }}>{userSaving ? "處理中..." : "新增"}</button>
              </div>
            </div>
          </div>
        )}
      {showEditUser && (
          <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowEditUser(false); }}>
            <div style={modalCard}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>修改使用者</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={sl}>員工編號</div>
                  <input style={si} value={editUserForm.employee_no} disabled />
                </div>
                <div>
                  <div style={sl}>姓名 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={si} value={editUserForm.full_name} onChange={e => setEditUserForm({ ...editUserForm, full_name: e.target.value })} />
                </div>
                <div>
                  <div style={sl}>角色</div>
                  <select style={si} value={editUserForm.role_code} onChange={e => setEditUserForm({ ...editUserForm, role_code: e.target.value })}>
                    {roles.map((r: any) => <option key={r.role_id} value={r.role_code}>{r.role_name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={sl}>區域</div>
                  <select style={si} value={editUserForm.region_code} onChange={e => setEditUserForm({ ...editUserForm, region_code: e.target.value })}>
                    <option value="">不限</option>
                    <option value="NORTH">北區</option><option value="CENTRAL">中區</option>
                    <option value="SOUTH">南區</option><option value="EAST">東區</option>
                  </select>
                </div>
                <div>
                  <div style={sl}>Email</div>
                  <input style={si} value={editUserForm.email} onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })} />
                </div>
                <div>
                  <div style={sl}>電話</div>
                  <input style={si} value={editUserForm.phone} onChange={e => setEditUserForm({ ...editUserForm, phone: e.target.value })} />
                </div>
                <div>
                  <div style={sl}>手機</div>
                  <input style={si} value={editUserForm.mobile || ""} onChange={e => setEditUserForm({ ...editUserForm, mobile: e.target.value })} />
                </div>
                <div>
                  <div style={sl}>出生日期</div>
                  <input style={si} type="date" value={editUserForm.birth_date || ""} onChange={e => setEditUserForm({ ...editUserForm, birth_date: e.target.value })} />
                </div>
                <div>
                  <div style={sl}>顯示名稱</div>
                  <input style={si} value={editUserForm.display_name || ""} onChange={e => setEditUserForm({ ...editUserForm, display_name: e.target.value })} placeholder="英文名或暱稱" />
                </div>
                <div>
                  <div style={sl}>職務</div>
                  <input style={si} value={editUserForm.job_title || ""} onChange={e => setEditUserForm({ ...editUserForm, job_title: e.target.value })} placeholder="例如: 業務經理" />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowEditUser(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={saveEditUser} disabled={userSaving} style={{ ...bp, opacity: userSaving ? 0.6 : 1 }}>{userSaving ? "處理中..." : "儲存"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

