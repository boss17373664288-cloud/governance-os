"use client";

import { useRouter } from "next/navigation";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";
import { downloadCsv } from "../../lib/download";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const ts = (bg: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color, whiteSpace: "nowrap" });
const si: React.CSSProperties = { width: 260, height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", background: "#fff" };
const actionBtn: React.CSSProperties = { height: 28, padding: "0 10px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer", marginRight: 4 };
const bp: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const bd: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" };
const sfi: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" };
const sfs: React.CSSProperties = { ...sfi, cursor: "pointer" };
const sfl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const modalBg: React.CSSProperties = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };

const TYPE_MAP: Record<string, string> = { HOSPITAL: "醫院", CLINIC: "診所", DISTRIBUTOR: "經銷商", PERSONAL: "個人", CHAIN: "連鎖", GOV: "政府機構" };
const REGION_MAP: Record<string, string> = { NORTH: "北區", CENTRAL: "中區", SOUTH: "南區", EAST: "東區" };

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const fetchData = useCallback(() => {
    setLoading(true);
    const params: any = { page, page_size: 20 };
    if (search) params.search = search;
    api.get("/customers", { params })
      .then((r: any) => { setCustomers(r.data?.items || []); setPagination(r.data?.pagination || {}); })
      .catch(() => { setCustomers([]); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditing(null);
    setForm({ customer_name: "", customer_short_name: "", customer_type: "HOSPITAL", phone: "", company_zip_code: "", company_address: "", contact_person: "", contact_email: "", region_code: "", payment_terms: "" });
    setShowForm(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ ...c });
    setShowForm(true);
  };

  const saveCustomer = async () => {
    if (!form.customer_name?.trim()) { alert("請輸入客戶名稱"); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put("/customers/" + editing.customer_id, form);
      } else {
        await api.post("/customers", form);
      }
      alert(editing ? "客戶已更新" : "客戶已建立");
      setShowForm(false);
      fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
    finally { setSaving(false); }
  };

  const deleteCustomer = async (c: any) => {
    if (!confirm("確定要刪除客戶「" + c.customer_name + "」嗎？")) return;
    try {
      await api.delete("/customers/" + c.customer_id);
      alert("已刪除");
      fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "刪除失敗"); }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a2e" }}>客戶管理</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#999" }}>管理所有客戶資料、聯絡人與交易狀態</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => downloadCsv("/api/v1/system/export/customers", "客戶列表.csv")} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "1px solid #52c41a", background: "#fff", color: "#52c41a", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>📥 導出 CSV</button>
            <button onClick={openAdd} style={bp}>+ 新增客戶</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <input style={si} placeholder="搜尋客戶名稱/編號..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>

        {loading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : customers.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無客戶資料</div> : (
          <div style={cb}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={th}>客戶編碼</th><th style={th}>客戶名稱</th><th style={th}>類型</th><th style={th}>聯絡人</th><th style={th}>電話</th><th style={th}>區域</th><th style={th}>狀態</th><th style={th}>操作</th>
                </tr></thead>
                <tbody>
                  {customers.map((c: any, i: number) => (
                    <tr key={c.customer_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ ...td, fontFamily: "monospace", fontSize: 12, color: "#1890ff" }}>{c.customer_code}</td>
                      <td style={{ ...td, fontWeight: 500 }}><span onClick={() => router.push(`/customers/${c.customer_id}`)} style={{ color: "#1890ff", cursor: "pointer", textDecoration: "none" }} onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>{c.customer_name}</span></td>
                      <td style={td}>{TYPE_MAP[c.customer_type] || c.customer_type || "-"}</td>
                      <td style={td}>{c.contact_person || "-"}</td>
                      <td style={td}>{c.phone || "-"}</td>
                      <td style={td}>{REGION_MAP[c.region_code] || c.region_code || "-"}</td>
                      <td style={td}><span style={ts(c.is_active !== false ? "#f6ffed" : "#f5f5f5", c.is_active !== false ? "#52c41a" : "#999")}>{c.is_active !== false ? "活躍" : "停用"}</span></td>
                      <td style={td}>
                        <button onClick={() => openEdit(c)} style={actionBtn}>編輯</button>
                        <button onClick={() => deleteCustomer(c)} style={{ ...actionBtn, color: "#ff4d4f", borderColor: "#ffccc7" }}>刪除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 12, color: "#999" }}>共 {pagination.total} 筆</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ ...actionBtn, opacity: page <= 1 ? 0.4 : 1 }}>上一頁</button>
                <button disabled={page >= (pagination.total_pages || 1)} onClick={() => setPage(page + 1)} style={{ ...actionBtn, opacity: page >= (pagination.total_pages || 1) ? 0.4 : 1 }}>下一頁</button>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 640, maxHeight: "85vh", overflow: "auto" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>{editing ? "編輯客戶" : "新增客戶"}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={sfl}>客戶名稱 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={sfi} value={form.customer_name || ""} onChange={e => setForm({ ...form, customer_name: e.target.value })} placeholder="公司全名" />
                </div>
                <div>
                  <div style={sfl}>簡稱 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={sfi} value={form.customer_short_name || ""} onChange={e => setForm({ ...form, customer_short_name: e.target.value })} placeholder="簡稱" />
                </div>
                <div>
                  <div style={sfl}>客戶類型</div>
                  <select style={sfs} value={form.customer_type || "HOSPITAL"} onChange={e => setForm({ ...form, customer_type: e.target.value })}>
                    <option value="HOSPITAL">醫院</option><option value="CLINIC">診所</option>
                    <option value="DISTRIBUTOR">經銷商</option><option value="PERSONAL">個人</option>
                  </select>
                </div>
                <div>
                  <div style={sfl}>電話 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={sfi} value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <div style={sfl}>聯絡人</div>
                  <input style={sfi} value={form.contact_person || ""} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
                </div>
                <div>
                  <div style={sfl}>聯絡人 Email</div>
                  <input style={sfi} value={form.contact_email || ""} onChange={e => setForm({ ...form, contact_email: e.target.value })} />
                </div>
                <div>
                  <div style={sfl}>郵遞區號</div>
                  <input style={sfi} value={form.company_zip_code || ""} onChange={e => setForm({ ...form, company_zip_code: e.target.value })} />
                </div>
                <div>
                  <div style={sfl}>區域</div>
                  <select style={sfs} value={form.region_code || ""} onChange={e => setForm({ ...form, region_code: e.target.value })}>
                    <option value="">不限</option>
                    <option value="NORTH">北區</option><option value="CENTRAL">中區</option>
                    <option value="SOUTH">南區</option><option value="EAST">東區</option>
                  </select>
                </div>
                <div>
                  <div style={sfl}>付款條件</div>
                  <select style={sfs} value={form.payment_terms || ""} onChange={e => setForm({ ...form, payment_terms: e.target.value })}>
                    <option value="">未設定</option>
                    <option value="CASH">現金</option><option value="NET_30">月結30天</option>
                    <option value="NET_60">月結60天</option><option value="NET_90">月結90天</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={sfl}>公司地址</div>
                  <input style={sfi} value={form.company_address || ""} onChange={e => setForm({ ...form, company_address: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowForm(false)} style={bd}>取消</button>
                <button onClick={saveCustomer} disabled={saving} style={{ ...bp, opacity: saving ? 0.6 : 1 }}>{saving ? "儲存中..." : "儲存"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
