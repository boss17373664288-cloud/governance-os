"use client";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const tw = { background: "#fff", borderRadius: 4, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" } as React.CSSProperties;
const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#333", background: "#fafafa", borderBottom: "1px solid #f0f0f0" };
const td: React.CSSProperties = { padding: "10px 14px", fontSize: 13, color: "#666", borderBottom: "1px solid #f0f0f0" };
const bad = (bg: string, clr: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color: clr });
const bp: React.CSSProperties = { height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const bd: React.CSSProperties = { height: 32, padding: "0 14px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" };
const bsm: React.CSSProperties = { height: 26, padding: "0 10px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 11, cursor: "pointer", marginRight: 4 };
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" };
const sl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const modalBg: React.CSSProperties = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };

export default function OrganizationPage() {
  const [tab, setTab] = useState("dept");
  const [departments, setDepartments] = useState<any[]>([]);
  const [allDepts, setAllDepts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dept form
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptForm, setDeptForm] = useState({ department_code: "", department_name: "", department_type: "DEPARTMENT", parent_department_id: "", description: "" });

  // Emp form
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empForm, setEmpForm] = useState({ employee_no: "", full_name: "", role_code: "SALES", region_code: "", department_id: "", email: "", phone: "", password: "123456" });

  const fetchData = useCallback(() => {
    if (tab === "dept") { setLoading(true); Promise.all([api.get("/departments/tree"), api.get("/departments")]).then(([tree, flat]: any[]) => { setDepartments(tree.data || []); setAllDepts(flat.data || []); }).finally(() => setLoading(false)); }
    if (tab === "emp") { setLoading(true); api.get("/employees", { params: { page: 1, page_size: 50 } }).then((r: any) => setEmployees(r.data?.items || [])).finally(() => setLoading(false)); }
    if (tab === "role") { setLoading(true); api.get("/roles").then((r: any) => setRoles(r.data || [])).finally(() => setLoading(false)); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ====== Dept CRUD ======
  const openDeptAdd = (parentId?: string) => {
    setEditingDept(null);
    setDeptForm({ department_code: "", department_name: "", department_type: "DEPARTMENT", parent_department_id: parentId || "", description: "" });
    setShowDeptModal(true);
  };

  const openDeptEdit = (dept: any) => {
    setEditingDept(dept);
    setDeptForm({ department_code: dept.department_code || "", department_name: dept.department_name || "", department_type: dept.department_type || "DEPARTMENT", parent_department_id: dept.parent_department_id || "", description: dept.description || "" });
    setShowDeptModal(true);
  };

  const saveDept = async () => {
    if (!deptForm.department_name.trim()) { alert("請輸入部門名稱"); return; }
    setSaving(true);
    try {
      if (editingDept) {
        await api.put("/departments/" + editingDept.department_id, deptForm);
      } else {
        await api.post("/departments", deptForm);
      }
      alert(editingDept ? "部門已更新" : "部門已建立");
      setShowDeptModal(false);
      fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
    finally { setSaving(false); }
  };

  const deleteDept = async (deptId: string, name: string) => {
    if (!confirm("確定要刪除部門「" + name + "」嗎？")) return;
    try {
      await api.delete("/departments/" + deptId);
      alert("已刪除");
      fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "刪除失敗"); }
  };

  // ====== Emp CRUD ======
  const openEmpAdd = () => {
    setEmpForm({ employee_no: "", full_name: "", role_code: "SALES", region_code: "", department_id: "", email: "", phone: "", password: "123456" });
    setShowEmpModal(true);
  };

  const saveEmp = async () => {
    if (!empForm.employee_no.trim() || !empForm.full_name.trim()) { alert("請填寫員工編號與姓名"); return; }
    setSaving(true);
    try {
      await api.post("/employees", empForm);
      alert("員工已建立");
      setShowEmpModal(false);
      fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
    finally { setSaving(false); }
  };

  const toggleEmpStatus = async (emp: any) => {
    const newStatus = emp.is_active ? "INACTIVE" : "ACTIVE";
    if (!confirm("確定要" + (emp.is_active ? "停用" : "啟用") + "員工「" + emp.full_name + "」嗎？")) return;
    try {
      await api.put("/employees/" + emp.employee_id, { status: newStatus });
      fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
  };

  const tabs = [
    { key: "dept", label: "部門架構", icon: "🏢" },
    { key: "emp", label: "員工管理", icon: "👤" },
    { key: "role", label: "角色權限", icon: "🔑" },
  ];

  const renderDept = (dept: any, level: number = 0) => (
    <div key={dept.department_id}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", marginLeft: level * 24, borderBottom: "1px solid #f5f5f5", background: level === 0 ? "#fafafa" : "transparent" }}>
        <span style={{ fontSize: 13, fontWeight: level === 0 ? 600 : 400, color: "#333" }}>{dept.department_name}</span>
        <span style={{ fontSize: 11, color: "#999", fontFamily: "monospace" }}>{dept.department_code}</span>
        <span style={{ fontSize: 11, color: "#bbb" }}>{dept.department_type}</span>
        {dept.employee_count > 0 && <span style={{ fontSize: 12, color: "#1890ff" }}>{dept.employee_count} 人</span>}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          <button onClick={(e) => { e.stopPropagation(); openDeptAdd(dept.department_id); }} style={bsm} title="新增子部門">+</button>
          <button onClick={(e) => { e.stopPropagation(); openDeptEdit(dept); }} style={bsm}>✎</button>
          <button onClick={(e) => { e.stopPropagation(); deleteDept(dept.department_id, dept.department_name); }} style={{ ...bsm, color: "#ff4d4f", borderColor: "#ffccc7" }}>✕</button>
        </div>
      </div>
      {dept.children?.map((c: any) => renderDept(c, level + 1))}
    </div>
  );

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: "#333", marginBottom: 16 }}>組織架構</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "#fff", borderRadius: 4, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, height: 40, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer",
            background: tab === t.key ? "#1890ff" : "#fff", color: tab === t.key ? "#fff" : "#666",
            borderBottom: tab === t.key ? "none" : "1px solid #f0f0f0",
            transition: "all 0.2s",
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={tw}>
        {loading ? (
          <div style={{ padding: 64, textAlign: "center", color: "#999", fontSize: 14 }}>載入中...</div>
        ) : tab === "dept" ? (
          <div>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>部門層級架構</span>
              <button onClick={() => openDeptAdd()} style={bp}>+ 新增部門</button>
            </div>
            {departments.length === 0 ? <div style={{ padding: 48, textAlign: "center", color: "#999" }}>暫無部門資料</div> :
              departments.map(d => renderDept(d))}
          </div>
        ) : tab === "emp" ? (
          <div>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>員工列表</span>
              <button onClick={openEmpAdd} style={bp}>+ 新增員工</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>姓名</th><th style={th}>編號</th><th style={th}>職務</th><th style={th}>部門</th><th style={th}>狀態</th><th style={th}>操作</th></tr></thead>
              <tbody>
                {employees.length === 0 ? <tr><td colSpan={6} style={{ ...td, textAlign: "center", padding: 48, color: "#999" }}>暫無員工資料</td></tr> :
                  employees.map((e: any) => (
                    <tr key={e.employee_id}>
                      <td style={{ ...td, fontWeight: 500, color: "#333" }}>{e.full_name}</td>
                      <td style={{ ...td, fontFamily: "monospace", color: "#666" }}>{e.employee_no}</td>
                      <td style={td}>{e.job_title || "-"}</td>
                      <td style={td}>{e.department_name || "-"}</td>
                      <td style={td}><span style={bad(e.is_active ? "#f6ffed" : "#fafafa", e.is_active ? "#52c41a" : "#8c8c8c")}>{e.is_active ? "🟢 在職" : "⚪ 停用"}</span></td>
                      <td style={td}>
                        <button onClick={() => toggleEmpStatus(e)} style={{ ...bsm, color: e.is_active ? "#ff4d4f" : "#52c41a", borderColor: e.is_active ? "#ffccc7" : "#b7eb8f" }}>{e.is_active ? "停用" : "啟用"}</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", fontSize: 14, fontWeight: 600, color: "#333" }}>角色權限列表</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>角色名稱</th><th style={th}>角色代碼</th><th style={th}>描述</th><th style={th}>人數</th></tr></thead>
              <tbody>
                {roles.length === 0 ? <tr><td colSpan={4} style={{ ...td, textAlign: "center", padding: 48, color: "#999" }}>暫無角色資料</td></tr> :
                  roles.map((r: any) => (
                    <tr key={r.role_id}>
                      <td style={{ ...td, fontWeight: 500, color: "#333" }}>{r.role_name}</td>
                      <td style={{ ...td, fontFamily: "monospace" }}>{r.role_code}</td>
                      <td style={td}>{r.description || "-"}</td>
                      <td style={td}>{r.user_count || 0} 人</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dept Modal */}
      {showDeptModal && (
        <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowDeptModal(false); }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 480, maxHeight: "80vh", overflow: "auto" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>{editingDept ? "編輯部門" : "新增部門"}</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={sl}>部門代碼</div>
                <input style={si} value={deptForm.department_code} onChange={e => setDeptForm({ ...deptForm, department_code: e.target.value })} placeholder="例如: SALES_DEPT" />
              </div>
              <div>
                <div style={sl}>部門名稱 <span style={{ color: "#ff4d4f" }}>*</span></div>
                <input style={si} value={deptForm.department_name} onChange={e => setDeptForm({ ...deptForm, department_name: e.target.value })} placeholder="例如: 業務部" />
              </div>
              <div>
                <div style={sl}>部門類型</div>
                <select style={si} value={deptForm.department_type} onChange={e => setDeptForm({ ...deptForm, department_type: e.target.value })}>
                  <option value="DEPARTMENT">部門</option>
                  <option value="DIVISION">事業部</option>
                  <option value="TEAM">小組</option>
                  <option value="REGION">區域</option>
                </select>
              </div>
              <div>
                <div style={sl}>上級部門</div>
                <select style={si} value={deptForm.parent_department_id} onChange={e => setDeptForm({ ...deptForm, parent_department_id: e.target.value })}>
                  <option value="">無（頂層部門）</option>
                  {allDepts.filter((d: any) => d.department_id !== editingDept?.department_id).map((d: any) => (
                    <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={sl}>描述</div>
                <textarea style={{ ...si, height: 60, resize: "vertical" }} value={deptForm.description} onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowDeptModal(false)} style={bd}>取消</button>
              <button onClick={saveDept} disabled={saving} style={{ ...bp, opacity: saving ? 0.6 : 1 }}>{saving ? "儲存中..." : "儲存"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Emp Modal */}
      {showEmpModal && (
        <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowEmpModal(false); }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 520, maxHeight: "80vh", overflow: "auto" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>新增員工</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={sl}>員工編號 <span style={{ color: "#ff4d4f" }}>*</span></div>
                <input style={si} value={empForm.employee_no} onChange={e => setEmpForm({ ...empForm, employee_no: e.target.value })} placeholder="例如: SALES001" />
              </div>
              <div>
                <div style={sl}>姓名 <span style={{ color: "#ff4d4f" }}>*</span></div>
                <input style={si} value={empForm.full_name} onChange={e => setEmpForm({ ...empForm, full_name: e.target.value })} placeholder="例如: 王小明" />
              </div>
              <div>
                <div style={sl}>角色</div>
                <select style={si} value={empForm.role_code} onChange={e => setEmpForm({ ...empForm, role_code: e.target.value })}>
                  {roles.map((r: any) => <option key={r.role_id} value={r.role_code}>{r.role_name}</option>)}
                </select>
              </div>
              <div>
                <div style={sl}>部門</div>
                <select style={si} value={empForm.department_id} onChange={e => setEmpForm({ ...empForm, department_id: e.target.value })}>
                  <option value="">未分配</option>
                  {allDepts.map((d: any) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                </select>
              </div>
              <div>
                <div style={sl}>Email</div>
                <input style={si} value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div>
                <div style={sl}>電話</div>
                <input style={si} value={empForm.phone} onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} />
              </div>
              <div>
                <div style={sl}>區域</div>
                <select style={si} value={empForm.region_code} onChange={e => setEmpForm({ ...empForm, region_code: e.target.value })}>
                  <option value="">不限</option>
                  <option value="NORTH">北區</option><option value="CENTRAL">中區</option>
                  <option value="SOUTH">南區</option><option value="EAST">東區</option>
                </select>
              </div>
              <div>
                <div style={sl}>初始密碼</div>
                <input style={si} value={empForm.password} onChange={e => setEmpForm({ ...empForm, password: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowEmpModal(false)} style={bd}>取消</button>
              <button onClick={saveEmp} disabled={saving} style={{ ...bp, opacity: saving ? 0.6 : 1 }}>{saving ? "建立中..." : "建立員工"}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}