"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const ts = (bg: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color, whiteSpace: "nowrap" });
const bp: React.CSSProperties = { height: 36, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const bo: React.CSSProperties = { ...bp, background: "#fa8c16" };
const bg: React.CSSProperties = { ...bp, background: "#52c41a" };
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" };
const sl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const modalBg: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalCard: React.CSSProperties = { background: "#fff", borderRadius: 8, padding: 24, width: 560, maxHeight: "80vh", overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" };

export default function ConsignmentPage() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [staleAlert, setStaleAlert] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ledger" | "stale">("ledger");

  // Release modal
  const [showRelease, setShowRelease] = useState(false);
  const [relForm, setRelForm] = useState({ customer_id: "", product_id: "", quantity: 1 });
  const [relCustomers, setRelCustomers] = useState<any[]>([]);
  const [relProducts, setRelProducts] = useState<any[]>([]);
  const [relSaving, setRelSaving] = useState(false);

  // Exchange modal
  const [showExchange, setShowExchange] = useState(false);
  const [excForm, setExcForm] = useState({ customer_id: "", source_product_id: "", target_product_id: "", quantity: 1, reason: "" });
  const [excCustomers, setExcCustomers] = useState<any[]>([]);
  const [relCustSearch, setRelCustSearch] = useState("");
  const [excCustSearch, setExcCustSearch] = useState("");
  const [excSrcProducts, setExcSrcProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [excSaving, setExcSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([api.get("/consignment/ledger"), api.get("/consignment/stale-alert")])
      .then(([l, s]: any[]) => { setLedger(l.data || []); setStaleAlert(s.data || []); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load customers for modals
  const loadCustomers = async () => {
    const c = await api.get("/customers", { params: { page_size: 200 } });
    return c.data.items || [];
  };

  // ====== Release Modal ======
  const openRelease = async () => {
    const customers = await loadCustomers();
    setRelCustomers(customers);
    setRelForm({ customer_id: "", product_id: "", quantity: 1 });
    setRelProducts([]);
    setShowRelease(true);
  };

  useEffect(() => {
    if (relForm.customer_id) {
      api.get("/consignment/ledger", { params: { customer_id: relForm.customer_id } }).then((r: any) => {
        setRelProducts(r.data || []);
      });
    } else { setRelProducts([]); setRelForm(prev => ({ ...prev, product_id: "" })); }
  }, [relForm.customer_id]);

  const doRelease = async () => {
    if (!relForm.customer_id || !relForm.product_id || relForm.quantity < 1) { alert("請填寫完整資料"); return; }
    setRelSaving(true);
    try {
      await api.post("/consignment/release", relForm);
      alert("寄庫出庫成功"); setShowRelease(false); fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "出庫失敗"); }
    finally { setRelSaving(false); }
  };

  // ====== Exchange Modal ======
  const openExchange = async () => {
    const customers = await loadCustomers();
    setExcCustomers(customers);
    const p = await api.get("/products", { params: { page_size: 500 } });
    setAllProducts(p.data.items || []);
    setExcForm({ customer_id: "", source_product_id: "", target_product_id: "", quantity: 1, reason: "" });
    setExcSrcProducts([]);
    setShowExchange(true);
  };

  useEffect(() => {
    if (excForm.customer_id) {
      api.get("/consignment/ledger", { params: { customer_id: excForm.customer_id } }).then((r: any) => {
        setExcSrcProducts(r.data || []);
      });
    } else { setExcSrcProducts([]); setExcForm(prev => ({ ...prev, source_product_id: "" })); }
  }, [excForm.customer_id]);

  const doExchange = async () => {
    if (!excForm.customer_id || !excForm.source_product_id || !excForm.target_product_id || excForm.quantity < 1 || !excForm.reason) {
      alert("請填寫完整資料"); return;
    }
    if (excForm.source_product_id === excForm.target_product_id) { alert("來源產品與目標產品不可相同"); return; }
    setExcSaving(true);
    try {
      await api.post("/consignment/exchange", excForm);
      alert("寄庫換貨成功"); setShowExchange(false); fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "換貨失敗"); }
    finally { setExcSaving(false); }
  };

  const filtered = (activeTab === "ledger" ? ledger : staleAlert).filter((r: any) => {
    const s = search.toLowerCase();
    return !s || (r.customer_code || "").toLowerCase().includes(s) || (r.customer_name || "").toLowerCase().includes(s) || (r.product_code || "").toLowerCase().includes(s) || (r.product_name || "").toLowerCase().includes(s);
  });

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a2e" }}>寄庫管理</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#999" }}>管理客戶寄庫台帳、出庫與換貨作業</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={openRelease} style={bg}>寄庫出庫</button>
            <button onClick={openExchange} style={bo}>寄庫換貨出庫</button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          {[
            { label: "活躍寄庫筆數", value: ledger.filter((l: any) => l.status === "ACTIVE").length, color: "#1890ff" },
            { label: "呆滯預警筆數", value: staleAlert.length, color: "#fa8c16" },
            { label: "已耗盡筆數", value: ledger.filter((l: any) => l.status === "DEPLETED").length, color: "#999" },
            { label: "總剩餘數量", value: ledger.filter((l: any) => l.status === "ACTIVE").reduce((s: number, l: any) => s + (Number(l.remaining_qty) || 0), 0), color: "#52c41a" },
          ].map((s, i) => (
            <div key={i} style={{ ...cb, padding: "16px 20px", borderLeft: "3px solid " + s.color }}>
              <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
          {[
            { key: "ledger", label: "寄庫台帳" },
            { key: "stale", label: "呆滯預警" },
          ].map((t: any) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                height: 38, padding: "0 20px", fontSize: 13, fontWeight: activeTab === t.key ? 600 : 400,
                border: "none", cursor: "pointer", borderRadius: "4px 4px 0 0",
                background: activeTab === t.key ? "#fff" : "transparent",
                color: activeTab === t.key ? "#1890ff" : "#666",
                borderBottom: activeTab === t.key ? "2px solid #1890ff" : "2px solid transparent",
              }}
            >{t.label}{activeTab === "stale" && staleAlert.length > 0 ? ` (${staleAlert.length})` : ""}</button>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input style={{ ...si, width: 280 }} placeholder="搜尋客戶名稱/編碼/產品..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無資料</div>
        ) : (
          <div style={cb}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>客戶編碼</th>
                    <th style={th}>客戶名稱</th>
                    <th style={th}>產品編碼</th>
                    <th style={th}>產品名稱</th>
                    <th style={th}>剩餘數量</th>
                    <th style={th}>最後出庫日</th>
                    <th style={th}>狀態</th>
                    {activeTab === "stale" && <th style={th}>呆滯天數</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r: any, i: number) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={td}>{r.customer_code || "-"}</td>
                      <td style={td}>{r.customer_name || "-"}</td>
                      <td style={td}>{r.product_code || "-"}</td>
                      <td style={td}>{r.product_name || "-"}</td>
                      <td style={{ ...td, fontWeight: 600, color: Number(r.remaining_qty) <= 5 ? "#ff4d4f" : "#333" }}>{r.remaining_qty ?? "-"}</td>
                      <td style={td}>{r.last_release_date || "尚未出庫"}</td>
                      <td style={td}>
                        <span style={r.status === "ACTIVE" ? ts("#e6f7ff", "#1890ff") : ts("#f0f0f0", "#999")}>{r.status === "ACTIVE" ? "活躍" : "已耗盡"}</span>
                      </td>
                      {activeTab === "stale" && <td style={{ ...td, color: "#fa8c16", fontWeight: 500 }}>{r.stale_days ? r.stale_days + " 天" : "-"}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "10px 16px", fontSize: 12, color: "#999", borderTop: "1px solid #f0f0f0" }}>共 {filtered.length} 筆</div>
          </div>
        )}

        {/* ====== Release Modal ====== */}
        {showRelease && (
          <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowRelease(false); }}>
            <div style={modalCard}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>寄庫出庫</h3>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={sl}>客戶 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <div style={{ position: "relative" }}>
                    <input style={si} placeholder="搜索客戶名稱/編碼..." 
                      value={relForm.customer_id ? (relCustomers.find(c => c.customer_id === relForm.customer_id)?.customer_name || "") : relCustSearch}
                      onChange={e => { setRelCustSearch(e.target.value); setRelForm({ ...relForm, customer_id: "" }); }}
                      onFocus={() => setRelCustSearch(relCustSearch || "")} />
                    {(relCustSearch || !relForm.customer_id) && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: 200, overflow: "auto", background: "#fff", border: "1px solid #d9d9d9", borderRadius: 4, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                        {relCustomers.filter(c => !relCustSearch || c.customer_name?.toLowerCase().includes(relCustSearch.toLowerCase()) || c.customer_code?.toLowerCase().includes(relCustSearch.toLowerCase())).slice(0, 50).map(c => (
                          <div key={c.customer_id} style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f5f5f5" }}
                            onMouseDown={() => { setRelForm({ ...relForm, customer_id: c.customer_id }); setRelCustSearch(""); }}>
                            <span style={{ fontWeight: 500 }}>{c.customer_name}</span>
                            <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>{c.customer_code}</span>
                          </div>
                        ))}
                        {relCustomers.filter(c => !relCustSearch || c.customer_name?.toLowerCase().includes(relCustSearch.toLowerCase()) || c.customer_code?.toLowerCase().includes(relCustSearch.toLowerCase())).length === 0 && (
                          <div style={{ padding: 12, textAlign: "center", color: "#999", fontSize: 13 }}>無匹配客戶</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div style={sl}>產品 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <select style={si} value={relForm.product_id} onChange={e => setRelForm({ ...relForm, product_id: e.target.value })}>
                    <option value="">請選擇產品</option>
                    {relProducts.map((p: any) => <option key={p.product_id} value={p.product_id}>{p.product_code} - {p.product_name}（剩餘 {p.remaining_qty}）</option>)}
                  </select>
                </div>
                <div>
                  <div style={sl}>數量 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={si} type="number" min={1} value={relForm.quantity} onChange={e => setRelForm({ ...relForm, quantity: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowRelease(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={doRelease} disabled={relSaving} style={{ ...bg, opacity: relSaving ? 0.6 : 1 }}>{relSaving ? "處理中..." : "確認出庫"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ====== Exchange Modal ====== */}
        {showExchange && (
          <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowExchange(false); }}>
            <div style={modalCard}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>寄庫換貨出庫</h3>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={sl}>客戶 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <div style={{ position: "relative" }}>
                    <input style={si} placeholder="搜索客戶名稱/編碼..." 
                      value={excForm.customer_id ? (excCustomers.find(c => c.customer_id === excForm.customer_id)?.customer_name || "") : excCustSearch}
                      onChange={e => { setExcCustSearch(e.target.value); setExcForm({ ...excForm, customer_id: "" }); }}
                      onFocus={() => setExcCustSearch(excCustSearch || "")} />
                    {(excCustSearch || !excForm.customer_id) && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: 200, overflow: "auto", background: "#fff", border: "1px solid #d9d9d9", borderRadius: 4, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                        {excCustomers.filter(c => !excCustSearch || c.customer_name?.toLowerCase().includes(excCustSearch.toLowerCase()) || c.customer_code?.toLowerCase().includes(excCustSearch.toLowerCase())).slice(0, 50).map(c => (
                          <div key={c.customer_id} style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f5f5f5" }}
                            onMouseDown={() => { setExcForm({ ...excForm, customer_id: c.customer_id }); setExcCustSearch(""); }}>
                            <span style={{ fontWeight: 500 }}>{c.customer_name}</span>
                            <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>{c.customer_code}</span>
                          </div>
                        ))}
                        {excCustomers.filter(c => !excCustSearch || c.customer_name?.toLowerCase().includes(excCustSearch.toLowerCase()) || c.customer_code?.toLowerCase().includes(excCustSearch.toLowerCase())).length === 0 && (
                          <div style={{ padding: 12, textAlign: "center", color: "#999", fontSize: 13 }}>無匹配客戶</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div style={sl}>原寄庫產品 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <select style={si} value={excForm.source_product_id} onChange={e => setExcForm({ ...excForm, source_product_id: e.target.value })}>
                    <option value="">請選擇來源產品</option>
                    {excSrcProducts.map((p: any) => <option key={p.product_id} value={p.product_id}>{p.product_code} - {p.product_name}（剩餘 {p.remaining_qty}）</option>)}
                  </select>
                </div>
                <div>
                  <div style={sl}>改出產品 <span style={{ color: "#ff4d4f" }}>*</span>（限同品牌同系列）</div>
                  <select style={si} value={excForm.target_product_id} onChange={e => setExcForm({ ...excForm, target_product_id: e.target.value })}>
                    <option value="">請選擇目標產品</option>
                    {allProducts.map((p: any) => <option key={p.product_id} value={p.product_id}>{p.product_code} - {p.product_name}</option>)}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={sl}>換貨數量 <span style={{ color: "#ff4d4f" }}>*</span></div>
                    <input style={si} type="number" min={1} value={excForm.quantity} onChange={e => setExcForm({ ...excForm, quantity: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <div style={sl}>換貨原因 <span style={{ color: "#ff4d4f" }}>*</span></div>
                    <select style={si} value={excForm.reason} onChange={e => setExcForm({ ...excForm, reason: e.target.value })}>
                      <option value="">請選擇</option>
                      <option value="產品規格不符">產品規格不符</option>
                      <option value="客戶需求變更">客戶需求變更</option>
                      <option value="效期考量">效期考量</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowExchange(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={doExchange} disabled={excSaving} style={{ ...bo, opacity: excSaving ? 0.6 : 1 }}>{excSaving ? "處理中..." : "確認換貨"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}