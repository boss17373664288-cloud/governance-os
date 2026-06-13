"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const bp: React.CSSProperties = { height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, cursor: "pointer" };
const bpRed: React.CSSProperties = { height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: "#ff4d4f", color: "#fff", fontSize: 13, cursor: "pointer" };
const bpGreen: React.CSSProperties = { height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: "#52c41a", color: "#fff", fontSize: 13, cursor: "pointer" };
const bpGray: React.CSSProperties = { height: 32, padding: "0 14px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" };
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", boxSizing: "border-box" };
const sel: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" };

export default function ReferralPage() {
  const [referrers, setReferrers] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Referrer form
  const [showRefForm, setShowRefForm] = useState(false);
  const [editingRef, setEditingRef] = useState<any>(null);
  const [refForm, setRefForm] = useState({ referrer_name: "", referrer_type: "EXTERNAL", phone: "", notes: "", cash_rate: "0", product_reward: [] as any[] });
  const [showProdReward, setShowProdReward] = useState(false);

  // Link form
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkForm, setLinkForm] = useState({ customer_id: "", referrer_id: "" });
  const [unlinkedCustomers, setUnlinkedCustomers] = useState<any[]>([]);
  const [custSearch, setCustSearch] = useState("");

  // Calculate
  const [showCalc, setShowCalc] = useState(false);
  const [calcReferrer, setCalcReferrer] = useState("");
  const [calcMonth, setCalcMonth] = useState(new Date().toISOString().slice(0,7).replace("-",""));
  const [calcResult, setCalcResult] = useState<any>(null);

  // Generate
  const [showGenerate, setShowGenerate] = useState(false);
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0,7).replace("-",""));
  const [genResult, setGenResult] = useState<any>(null);

  // Detail
  const [showDetail, setShowDetail] = useState<any>(null);

  const fetchReferrers = useCallback(() => { api.get("/referral/referrers").then((r: any) => setReferrers(r.data || r || [])).catch(() => {}); }, []);
  const fetchLinks = useCallback(() => { api.get("/referral/links").then((r: any) => setLinks(r.data || r || [])).catch(() => {}); }, []);
  const fetchRecords = useCallback(() => { setLoading(true); api.get("/referral", { params: { page_size: 50 } }).then((r: any) => setRecords(r.data?.items || r.items || [])).finally(() => setLoading(false)); }, []);
  const fetchCustomers = useCallback(() => { api.get("/customers", { params: { page_size: 300 } }).then((r: any) => setCustomers(r.data?.items || r.items || [])).catch(() => {}); }, []);
  const fetchProducts = useCallback(() => { api.get("/products", { params: { page_size: 500 } }).then((r: any) => setProducts(r.data?.items || r.items || [])).catch(() => {}); }, []);
  const fetchUnlinked = useCallback((s?: string) => { api.get("/referral/customers", { params: { search: s || "" } }).then((r: any) => setUnlinkedCustomers(r.data || r || [])).catch(() => {}); }, []);

  useEffect(() => { fetchReferrers(); fetchLinks(); fetchRecords(); fetchCustomers(); fetchProducts(); }, [fetchReferrers, fetchLinks, fetchRecords, fetchCustomers, fetchProducts]);

  const fmt = (n: number) => new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD" }).format(n || 0);

  // --- Referrer CRUD ---
  const openNewRef = () => {
    setEditingRef(null);
    setRefForm({ referrer_name: "", referrer_type: "EXTERNAL", phone: "", notes: "", cash_rate: "0", product_reward: [] });
    setShowRefForm(true);
  };
  const openEditRef = (r: any) => {
    setEditingRef(r);
    const pr = typeof r.product_reward === 'string' ? JSON.parse(r.product_reward || '[]') : (r.product_reward || []);
    setRefForm({ referrer_name: r.referrer_name, referrer_type: r.referrer_type || "EXTERNAL", phone: r.phone || "", notes: r.notes || "", cash_rate: String(r.cash_rate || 0), product_reward: pr });
    setShowRefForm(true);
  };
  const saveRef = async () => {
    if (!refForm.referrer_name) return alert("請填寫介紹人名稱");
    try {
      await api.post("/referral/referrers", {
        referrer_id: editingRef?.referrer_id || undefined,
        referrer_name: refForm.referrer_name,
        referrer_type: refForm.referrer_type,
        phone: refForm.phone,
        notes: refForm.notes,
        cash_rate: Number(refForm.cash_rate),
        product_reward: refForm.product_reward
      });
      setShowRefForm(false);
      fetchReferrers();
    } catch { alert("儲存失敗"); }
  };
  const deleteRef = async (id: string) => {
    if (!confirm("確定停用此介紹人？")) return;
    try { await api.delete("/referral/referrers/" + id); fetchReferrers(); } catch { alert("操作失敗"); }
  };

  // Product reward helpers
  const addProdReward = () => {
    setRefForm({ ...refForm, product_reward: [...refForm.product_reward, { product_id: "", product_name: "", quantity_per_sale: "1" }] });
  };
  const updateProdReward = (idx: number, field: string, value: string) => {
    const list = [...refForm.product_reward];
    list[idx] = { ...list[idx], [field]: value };
    if (field === "product_id") {
      const p = products.find((x: any) => x.product_id === value);
      if (p) list[idx].product_name = p.product_name;
    }
    setRefForm({ ...refForm, product_reward: list });
  };
  const removeProdReward = (idx: number) => {
    setRefForm({ ...refForm, product_reward: refForm.product_reward.filter((_: any, i: number) => i !== idx) });
  };

  // --- Link CRUD ---
  const openLinkForm = () => { setShowLinkForm(true); fetchUnlinked(""); };
  const saveLink = async () => {
    if (!linkForm.customer_id || !linkForm.referrer_id) return alert("請選擇客戶和介紹人");
    try { await api.post("/referral/links", linkForm); setShowLinkForm(false); fetchLinks(); fetchReferrers(); } catch { alert("儲存失敗"); }
  };
  const deleteLink = async (cid: string) => {
    if (!confirm("確定移除關聯？")) return;
    try { await api.delete("/referral/links/" + cid); fetchLinks(); } catch { alert("操作失敗"); }
  };

  // --- Calculate ---
  const doCalculate = async () => {
    if (!calcReferrer || !calcMonth) return alert("請選擇介紹人和月份");
    try {
      const r = await api.get("/referral/calculate", { params: { referrer_id: calcReferrer, month: calcMonth } });
      setCalcResult(r.data || r);
    } catch { alert("試算失敗"); }
  };

  // --- Generate ---
  const doGenerate = async () => {
    if (!genMonth) return alert("請選擇月份");
    try {
      const r = await api.post("/referral/generate", { period_month: genMonth });
      setGenResult(r.data || r);
      fetchRecords();
    } catch { alert("產生失敗"); }
  };

  // --- View Detail ---
  const viewDetail = async (id: string) => {
    try { const r = await api.get("/referral/" + id); setShowDetail(r.data || r); } catch {}
  };

  // --- Post to Journal ---
  const postToJournal = async (id: string) => {
    if (!confirm("確定過帳到日記帳？")) return;
    try { await api.post("/referral/" + id + "/post"); fetchRecords(); } catch { alert("過帳失敗"); }
  };

  // --- Delete record ---
  const deleteRecord = async (id: string) => {
    if (!confirm("確定刪除此酬謝記錄？(已過帳的無法刪除)")) return;
    try { await api.delete("/referral/" + id); fetchRecords(); } catch { alert("刪除失敗"); }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 }}>介紹人酬謝制度</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={openNewRef} style={bp}>➕ 新增介紹人</button>
            <button onClick={openLinkForm} style={{ ...bp, background: "#722ed1" }}>🔗 客戶關聯</button>
            <button onClick={() => { setShowCalc(true); setCalcResult(null); }} style={{ ...bp, background: "#fa8c16" }}>🧮 酬謝試算</button>
            <button onClick={() => { setShowGenerate(true); setGenResult(null); }} style={bpGreen}>📦 產生酬謝</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
          {["介紹人", "客戶關聯", "酬謝記錄"].map((t, i) => (
            <button key={t} onClick={() => { const tabs = document.querySelectorAll("[data-tab]") as any; const panels = document.querySelectorAll("[data-panel]") as any; tabs.forEach((x: any) => x.style.background = "#fff"); tabs.forEach((x: any) => x.style.color = "#666"); panels.forEach((x: any) => x.style.display = "none"); tabs[i].style.background = "#1890ff"; tabs[i].style.color = "#fff"; panels[i].style.display = "block"; }}
              data-tab style={{ height: 36, padding: "0 20px", borderRadius: "4px 4px 0 0", border: "1px solid #e5e6eb", borderBottom: "none", background: i === 0 ? "#1890ff" : "#fff", color: i === 0 ? "#fff" : "#666", fontSize: 13, cursor: "pointer" }}>{t}</button>
          ))}
        </div>

        {/* Panel 1: 介紹人 */}
        <div data-panel style={{ display: "block" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <thead><tr style={{ background: "#fafafa", borderBottom: "2px solid #f0f0f0" }}>
              <th style={th}>名稱</th><th style={th}>類型</th><th style={th}>電話</th><th style={th}>現金回饋%</th><th style={th}>產品回饋</th><th style={th}>備註</th><th style={th}></th>
            </tr></thead>
            <tbody>
              {referrers.map((r: any) => {
                const pr = typeof r.product_reward === 'string' ? JSON.parse(r.product_reward || '[]') : (r.product_reward || []);
                return (
                  <tr key={r.referrer_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={td}>{r.referrer_name}</td>
                    <td style={td}><span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 3, background: r.referrer_type === "INTERNAL" ? "#e6f7ff" : "#f6ffed", color: r.referrer_type === "INTERNAL" ? "#1890ff" : "#52c41a" }}>{r.referrer_type === "INTERNAL" ? "內部員工" : "外部人士"}</span></td>
                    <td style={td}>{r.phone || "-"}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 600, color: "#ff4d4f" }}>{Number(r.cash_rate).toFixed(2)}%</td>
                    <td style={td}>{pr.length > 0 ? pr.map((p: any) => p.product_name || "產品").join(", ") : "-"}</td>
                    <td style={{ ...td, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.notes || "-"}</td>
                    <td style={td}>
                      <button onClick={() => openEditRef(r)} style={{ height: 26, padding: "0 10px", borderRadius: 3, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 12, cursor: "pointer" }}>編輯</button>
                      <button onClick={() => deleteRef(r.referrer_id)} style={{ height: 26, padding: "0 10px", borderRadius: 3, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 12, cursor: "pointer", marginLeft: 4 }}>停用</button>
                    </td>
                  </tr>
                );
              })}
              {referrers.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#999" }}>尚無介紹人資料，請點擊「新增介紹人」建立</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Panel 2: 客戶關聯 */}
        <div data-panel style={{ display: "none" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <thead><tr style={{ background: "#fafafa", borderBottom: "2px solid #f0f0f0" }}>
              <th style={th}>客戶名稱</th><th style={th}>介紹人</th><th style={th}>建立時間</th><th style={th}></th>
            </tr></thead>
            <tbody>
              {links.map((l: any) => (
                <tr key={l.customer_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={td}>{l.customer_name} <span style={{ fontSize: 11, color: "#888" }}>({l.customer_code})</span></td>
                  <td style={td}>{l.referrer_name}</td>
                  <td style={td}>{l.created_at ? new Date(l.created_at).toLocaleDateString("zh-TW") : "-"}</td>
                  <td style={td}><button onClick={() => deleteLink(l.customer_id)} style={{ height: 26, padding: "0 10px", borderRadius: 3, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 12, cursor: "pointer" }}>移除</button></td>
                </tr>
              ))}
              {links.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 32, color: "#999" }}>尚無客戶關聯，請點擊「客戶關聯」建立</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Panel 3: 酬謝記錄 */}
        <div data-panel style={{ display: "none" }}>
          {loading && <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div>}
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <thead><tr style={{ background: "#fafafa", borderBottom: "2px solid #f0f0f0" }}>
              <th style={th}>月份</th><th style={th}>介紹人</th><th style={th}>銷售總額</th><th style={th}>現金酬謝</th><th style={th}>產品酬謝</th><th style={th}>狀態</th><th style={th}></th>
            </tr></thead>
            <tbody>
              {records.map((r: any) => {
                const pd = typeof r.product_reward_detail === 'string' ? JSON.parse(r.product_reward_detail || '[]') : (r.product_reward_detail || []);
                return (
                  <tr key={r.record_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={td}>{r.period_month}</td>
                    <td style={td}>{r.referrer_name}</td>
                    <td style={{ ...td, textAlign: "right" }}>{fmt(Number(r.total_sales))}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 600, color: "#ff4d4f" }}>{fmt(Number(r.cash_reward))}</td>
                    <td style={td}>{pd.length > 0 ? pd.map((p: any) => `${p.product_name || "產品"} x${p.quantity || 1}`).join(", ") : "-"}</td>
                    <td style={td}>
                      <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 3, background: r.posted_to_journal ? "#f6ffed" : "#fff7e6", color: r.posted_to_journal ? "#52c41a" : "#fa8c16" }}>
                        {r.posted_to_journal ? "已過帳" : "未過帳"}
                      </span>
                    </td>
                    <td style={td}>
                      <button onClick={() => viewDetail(r.record_id)} style={{ height: 26, padding: "0 10px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", fontSize: 12, cursor: "pointer" }}>明細</button>
                      {!r.posted_to_journal && (
                        <>
                          <button onClick={() => postToJournal(r.record_id)} style={{ height: 26, padding: "0 10px", borderRadius: 3, border: "1px solid #52c41a", background: "#fff", color: "#52c41a", fontSize: 12, cursor: "pointer", marginLeft: 4 }}>過帳</button>
                          <button onClick={() => deleteRecord(r.record_id)} style={{ height: 26, padding: "0 10px", borderRadius: 3, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 12, cursor: "pointer", marginLeft: 4 }}>刪除</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && records.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#999" }}>尚無酬謝記錄，請點擊「產生酬謝」</td></tr>}
            </tbody>
          </table>
        </div>

        {/* --- Modals --- */}

        {/* Referrer Form Modal */}
        {showRefForm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowRefForm(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 520, maxHeight: "80vh", overflow: "auto" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>{editingRef ? "編輯介紹人" : "新增介紹人"}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>名稱 *</label>
                  <input value={refForm.referrer_name} onChange={e => setRefForm({ ...refForm, referrer_name: e.target.value })} style={si} placeholder="介紹人名稱" />
                </div>
                <div>
                  <label style={lbl}>類型</label>
                  <select value={refForm.referrer_type} onChange={e => setRefForm({ ...refForm, referrer_type: e.target.value })} style={sel}>
                    <option value="EXTERNAL">外部人士</option>
                    <option value="INTERNAL">內部員工</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>電話</label>
                  <input value={refForm.phone} onChange={e => setRefForm({ ...refForm, phone: e.target.value })} style={si} placeholder="電話" />
                </div>
                <div>
                  <label style={lbl}>現金回饋%</label>
                  <input type="number" step="0.01" value={refForm.cash_rate} onChange={e => setRefForm({ ...refForm, cash_rate: e.target.value })} style={si} placeholder="例如 5%" />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={lbl}>備註</label>
                <input value={refForm.notes} onChange={e => setRefForm({ ...refForm, notes: e.target.value })} style={si} placeholder="備註" />
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={lbl}>產品回饋 (每筆成交贈送)</label>
                  <button onClick={addProdReward} style={{ height: 26, padding: "0 10px", borderRadius: 3, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 11, cursor: "pointer" }}>+ 增加產品</button>
                </div>
                {refForm.product_reward.map((pr: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                    <select value={pr.product_id} onChange={e => updateProdReward(i, "product_id", e.target.value)} style={{ ...sel, flex: 2 }}>
                      <option value="">選擇產品</option>
                      {products.map((p: any) => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
                    </select>
                    <input value={pr.quantity_per_sale} onChange={e => updateProdReward(i, "quantity_per_sale", e.target.value)} style={{ ...si, width: 80 }} placeholder="數量" />
                    <button onClick={() => removeProdReward(i)} style={{ height: 30, width: 30, borderRadius: 4, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 14, cursor: "pointer", flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "right", marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button onClick={() => setShowRefForm(false)} style={bpGray}>取消</button>
                <button onClick={saveRef} style={bp}>儲存</button>
              </div>
            </div>
          </div>
        )}

        {/* Link Form Modal */}
        {showLinkForm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowLinkForm(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 450 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>新增客戶-介紹人關聯</h3>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>客戶 *</label>
                <div style={{ position: "relative" }}>
                  <input value={custSearch} onChange={e => { setCustSearch(e.target.value); if (e.target.value) fetchUnlinked(e.target.value); }} style={si} placeholder="搜尋客戶..." />
                </div>
                <div style={{ maxHeight: 180, overflow: "auto", border: "1px solid #e5e6eb", borderRadius: 4, marginTop: 2 }}>
                  {(custSearch ? unlinkedCustomers : customers.filter((c: any) => !links.find((l: any) => l.customer_id === c.customer_id)).slice(0, 50)).map((c: any) => (
                    <div key={c.customer_id} onClick={() => { setLinkForm({ ...linkForm, customer_id: c.customer_id }); setCustSearch(c.customer_name); }}
                      style={{ padding: "6px 12px", cursor: "pointer", fontSize: 13, background: linkForm.customer_id === c.customer_id ? "#e6f7ff" : "#fff", borderBottom: "1px solid #f5f5f5" }}>
                      {c.customer_name} <span style={{ fontSize: 11, color: "#888" }}>({c.customer_code})</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>介紹人 *</label>
                <select value={linkForm.referrer_id} onChange={e => setLinkForm({ ...linkForm, referrer_id: e.target.value })} style={sel}>
                  <option value="">選擇介紹人</option>
                  {referrers.map((r: any) => <option key={r.referrer_id} value={r.referrer_id}>{r.referrer_name}</option>)}
                </select>
              </div>
              <div style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button onClick={() => setShowLinkForm(false)} style={bpGray}>取消</button>
                <button onClick={saveLink} style={bp}>儲存關聯</button>
              </div>
            </div>
          </div>
        )}

        {/* Calculate Modal */}
        {showCalc && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) { setShowCalc(false); setCalcResult(null); } }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 450 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>🧮 酬謝試算</h3>
              <div style={{ marginBottom: 12 }}>
                <select value={calcReferrer} onChange={e => setCalcReferrer(e.target.value)} style={sel}>
                  <option value="">選擇介紹人</option>
                  {referrers.map((r: any) => <option key={r.referrer_id} value={r.referrer_id}>{r.referrer_name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <input type="month" value={calcMonth.slice(0,4)+"-"+calcMonth.slice(4)} onChange={e => setCalcMonth(e.target.value.replace("-",""))} style={si} />
              </div>
              <button onClick={doCalculate} style={{ ...bp, width: "100%", background: "#fa8c16" }}>試算</button>
              {calcResult && (
                <div style={{ marginTop: 16, padding: 16, background: "#fafafa", borderRadius: 6 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr><td style={{ padding: "4px 0", fontSize: 13, color: "#888" }}>介紹人</td><td style={{ textAlign: "right", fontSize: 13, fontWeight: 600 }}>{calcResult.referrer_name}</td></tr>
                      <tr><td style={{ padding: "4px 0", fontSize: 13, color: "#888" }}>已回款訂單數</td><td style={{ textAlign: "right", fontSize: 13 }}>{calcResult.order_count}</td></tr>
                      <tr><td style={{ padding: "4px 0", fontSize: 13, color: "#888" }}>銷售總額</td><td style={{ textAlign: "right", fontSize: 13 }}>{fmt(calcResult.total_sales)}</td></tr>
                      <tr style={{ borderTop: "2px solid #ff4d4f" }}>
                        <td style={{ padding: "8px 0", fontSize: 14, fontWeight: 600, color: "#ff4d4f" }}>現金酬謝 ({calcResult.cash_rate}%)</td>
                        <td style={{ textAlign: "right", fontSize: 16, fontWeight: 700, color: "#ff4d4f" }}>{fmt(calcResult.cash_reward)}</td>
                      </tr>
                      {calcResult.product_rewards?.length > 0 && (
                        <tr><td colSpan={2} style={{ paddingTop: 8, fontSize: 13, color: "#722ed1" }}>產品酬謝：{calcResult.product_rewards.map((p: any) => `${p.product_name || "產品"} x${p.quantity}`).join(", ")}</td></tr>
                      )}
                      {calcResult.order_details?.length > 0 && (
                        <tr><td colSpan={2} style={{ paddingTop: 8 }}>
                          <div style={{ fontSize: 12, color: "#888" }}>訂單明細：</div>
                          {calcResult.order_details.map((o: any, i: number) => (
                            <div key={i} style={{ fontSize: 12, color: "#666" }}>{o.customer}: {fmt(o.amount)}</div>
                          ))}
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ textAlign: "right", marginTop: 12 }}>
                <button onClick={() => { setShowCalc(false); setCalcResult(null); }} style={bpGray}>關閉</button>
              </div>
            </div>
          </div>
        )}

        {/* Generate Modal */}
        {showGenerate && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) { setShowGenerate(false); setGenResult(null); } }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 450 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>📦 產生月度酬謝</h3>
              <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>將根據所有介紹人的設置，針對該月份已完全回款的訂單計算酬謝金額，產生酬謝記錄。</p>
              <div style={{ marginBottom: 12 }}>
                <input type="month" value={genMonth.slice(0,4)+"-"+genMonth.slice(4)} onChange={e => setGenMonth(e.target.value.replace("-",""))} style={si} />
              </div>
              <button onClick={doGenerate} style={{ ...bpGreen, width: "100%" }}>批次產生</button>
              {genResult && (
                <div style={{ marginTop: 16, padding: 16, background: "#f6ffed", borderRadius: 6, border: "1px solid #b7eb8f" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>已產生：{genResult.generated} 筆</div>
                  <div style={{ fontSize: 13, color: "#888" }}>跳過：{genResult.skipped} 筆</div>
                  {genResult.details?.map((d: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, marginTop: 4 }}>{d.name}: {d.status}{d.cash_reward ? ` (${fmt(d.cash_reward)})` : ""}</div>
                  ))}
                </div>
              )}
              <div style={{ textAlign: "right", marginTop: 12 }}>
                <button onClick={() => { setShowGenerate(false); setGenResult(null); }} style={bpGray}>關閉</button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetail && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowDetail(null); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 500, maxHeight: "80vh", overflow: "auto" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>酬謝明細</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr><td style={{ padding: "6px 0", fontSize: 13, color: "#888" }}>介紹人</td><td style={{ fontSize: 13 }}>{showDetail.referrer_name}</td></tr>
                  <tr><td style={{ padding: "6px 0", fontSize: 13, color: "#888" }}>月份</td><td style={{ fontSize: 13 }}>{showDetail.period_month}</td></tr>
                  <tr><td style={{ padding: "6px 0", fontSize: 13, color: "#888" }}>銷售總額</td><td style={{ fontSize: 13 }}>{fmt(Number(showDetail.total_sales))}</td></tr>
                  <tr><td style={{ padding: "6px 0", fontSize: 13, color: "#888" }}>現金酬謝</td><td style={{ fontSize: 16, fontWeight: 700, color: "#ff4d4f" }}>{fmt(Number(showDetail.cash_reward))}</td></tr>
                  <tr><td style={{ padding: "6px 0", fontSize: 13, color: "#888" }}>產品酬謝</td><td style={{ fontSize: 13 }}>{
                    (() => { const pd = typeof showDetail.product_reward_detail === 'string' ? JSON.parse(showDetail.product_reward_detail || '[]') : (showDetail.product_reward_detail || []); return pd.length > 0 ? pd.map((p: any) => `${p.product_name || "產品"} x${p.quantity || 1}`).join(", ") : "-"; })()
                  }</td></tr>
                  <tr><td style={{ padding: "6px 0", fontSize: 13, color: "#888" }}>狀態</td><td style={{ fontSize: 13 }}>{showDetail.posted_to_journal ? "✅ 已過帳" : "⏳ 未過帳"}</td></tr>
                  {showDetail.breakdown && (
                    <tr><td colSpan={2} style={{ paddingTop: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>計算明細</div>
                      <pre style={{ fontSize: 11, background: "#fafafa", padding: 12, borderRadius: 4, overflow: "auto", maxHeight: 200 }}>{JSON.stringify(typeof showDetail.breakdown === 'string' ? JSON.parse(showDetail.breakdown) : showDetail.breakdown, null, 2)}</pre>
                    </td></tr>
                  )}
                </tbody>
              </table>
              <div style={{ textAlign: "right", marginTop: 16 }}>
                <button onClick={() => setShowDetail(null)} style={bpGray}>關閉</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#666", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "8px 14px", fontSize: 13, color: "#333" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 500, color: "#666", marginBottom: 4 };
