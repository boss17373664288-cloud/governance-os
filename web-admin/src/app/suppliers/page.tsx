"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";
import { downloadCsv } from "../../lib/download";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const si: React.CSSProperties = { width: 260, height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", background: "#fff" };
const actionBtn: React.CSSProperties = { height: 28, padding: "0 10px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer", marginRight: 4 };
const bp: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const bd: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" };
const sfi: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" };
const sfs: React.CSSProperties = { ...sfi, cursor: "pointer" };
const sfl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const modalBg: React.CSSProperties = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const fetchData = useCallback(() => {
    setLoading(true);
    const params: any = { page_size: 200 };
    if (search) params.search = search;
    api.get("/suppliers", { params })
      .then((r: any) => setSuppliers(r.data?.items || []))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditing(null);
    setForm({ supplier_code: "", supplier_name: "", supplier_short_name: "", contact_person: "", contact_phone: "", tax_id: "", payment_terms: "NET_30", address: "" });
    setShowForm(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ ...s });
    setShowForm(true);
  };

  const saveSupplier = async () => {
    if (!form.supplier_name?.trim()) { alert("請輸入供應商名稱"); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put("/suppliers/" + editing.supplier_id, form);
      } else {
        if (!form.supplier_code?.trim()) { form.supplier_code = "SUPP-" + Date.now(); }
        await api.post("/suppliers", form);
      }
      alert(editing ? "供應商已更新" : "供應商已建立");
      setShowForm(false);
      fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
    finally { setSaving(false); }
  };

  const deleteSupplier = async (s: any) => {
    if (!confirm("確定要刪除供應商「" + s.supplier_name + "」嗎？")) return;
    try {
      await api.delete("/suppliers/" + s.supplier_id);
      alert("已刪除");
      fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "刪除失敗"); }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a2e" }}>供應商管理</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#999" }}>管理供應商主資料與付款條件</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => downloadCsv("/api/v1/system/export/suppliers", "供應商列表.csv")} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "1px solid #52c41a", background: "#fff", color: "#52c41a", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>📥 導出 CSV</button>
            <button onClick={openAdd} style={bp}>+ 新增供應商</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <input style={si} placeholder="搜尋供應商名稱/編碼..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : suppliers.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無供應商資料</div> : (
          <div style={cb}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={th}>供應商編碼</th><th style={th}>名稱</th><th style={th}>聯絡人</th><th style={th}>電話</th><th style={th}>付款條件</th><th style={th}>操作</th>
                </tr></thead>
                <tbody>
                  {suppliers.map((s: any, i: number) => (
                    <tr key={s.supplier_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ ...td, fontFamily: "monospace", fontSize: 12, color: "#1890ff" }}>{s.supplier_code}</td>
                      <td style={{ ...td, fontWeight: 500 }}>{s.supplier_name}</td>
                      <td style={td}>{s.contact_person || "-"}</td>
                      <td style={td}>{s.contact_phone || "-"}</td>
                      <td style={td}>{s.payment_terms || "-"}</td>
                      <td style={td}>
                        <button onClick={() => openEdit(s)} style={actionBtn}>編輯</button>
                        <button onClick={() => deleteSupplier(s)} style={{ ...actionBtn, color: "#ff4d4f", borderColor: "#ffccc7" }}>刪除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 520, maxHeight: "85vh", overflow: "auto" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>{editing ? "編輯供應商" : "新增供應商"}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={sfl}>供應商編碼</div>
                  <input style={sfi} value={form.supplier_code || ""} onChange={e => setForm({ ...form, supplier_code: e.target.value })} placeholder={editing ? "" : "留空自動生成"} disabled={!!editing} />
                </div>
                <div>
                  <div style={sfl}>供應商名稱 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={sfi} value={form.supplier_name || ""} onChange={e => setForm({ ...form, supplier_name: e.target.value })} />
                </div>
                <div>
                  <div style={sfl}>簡稱</div>
                  <input style={sfi} value={form.supplier_short_name || ""} onChange={e => setForm({ ...form, supplier_short_name: e.target.value })} />
                </div>
                <div>
                  <div style={sfl}>統一編號</div>
                  <input style={sfi} value={form.tax_id || ""} onChange={e => setForm({ ...form, tax_id: e.target.value })} />
                </div>
                <div>
                  <div style={sfl}>聯絡人</div>
                  <input style={sfi} value={form.contact_person || ""} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
                </div>
                <div>
                  <div style={sfl}>聯絡電話</div>
                  <input style={sfi} value={form.contact_phone || ""} onChange={e => setForm({ ...form, contact_phone: e.target.value })} />
                </div>
                <div>
                  <div style={sfl}>付款條件</div>
                  <select style={sfs} value={form.payment_terms || "NET_30"} onChange={e => setForm({ ...form, payment_terms: e.target.value })}>
                    <option value="CASH">現金</option><option value="NET_30">月結30天</option>
                    <option value="NET_60">月結60天</option><option value="NET_90">月結90天</option>
                  </select>
                </div>
                <div>
                  <div style={sfl}>Email</div>
                  <input style={sfi} value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={sfl}>地址</div>
                  <input style={sfi} value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowForm(false)} style={bd}>取消</button>
                <button onClick={saveSupplier} disabled={saving} style={{ ...bp, opacity: saving ? 0.6 : 1 }}>{saving ? "儲存中..." : "儲存"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}