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
const btnSm: React.CSSProperties = { height: 26, padding: "0 10px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 11, cursor: "pointer" };
const tabBtn = (active: boolean): React.CSSProperties => ({ padding: "8px 20px", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#1890ff" : "#666", background: active ? "#fff" : "transparent", border: "none", borderBottom: active ? "2px solid #1890ff" : "2px solid transparent", cursor: "pointer" });

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  PENDING_QA: { label: "待QA審批", bg: "#fff7e6", color: "#fa8c16" },
  QA_APPROVED: { label: "QA已放行", bg: "#f6ffed", color: "#52c41a" },
  SHIPPED: { label: "已出貨", bg: "#e6f7ff", color: "#1890ff" },
  COMPLETED: { label: "已結案", bg: "#f0f0f0", color: "#888" },
  REJECTED: { label: "已駁回", bg: "#fff1f0", color: "#ff4d4f" },
};

export default function ConsignmentPage() {
  // VERSION: v2-exchange-rules-20260613
  const [ledger, setLedger] = useState<any[]>([]);
  const [staleAlert, setStaleAlert] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ledger" | "stale" | "approval" | "rules">("ledger");

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

  // Approval tab
  const [releases, setReleases] = useState<any[]>([]);
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [approvalLoading, setApprovalLoading] = useState(false);
  // Exchange rules
  const [exchangeRules, setExchangeRules] = useState<any[]>([]);
  const [ruleForm, setRuleForm] = useState({ source: "", target: "" });
  const [ruleSaving, setRuleSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  // Exchange modal mode
  const [excExchangeMode, setExcExchangeMode] = useState("SAME_SERIES");
  const [excAllowedPairs, setExcAllowedPairs] = useState<any[]>([]);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([api.get("/consignment/ledger"), api.get("/consignment/stale-alert")])
      .then(([l, s]: any[]) => { setLedger(l.data || []); setStaleAlert(s.data || []); })
      .finally(() => setLoading(false));
  }, []);

  const fetchApprovals = useCallback(() => {
    setApprovalLoading(true);
    Promise.all([api.get("/consignment/releases"), api.get("/consignment/exchanges")])
      .then(([r, e]: any[]) => { setReleases(r.data || r || []); setExchanges(e.data || e || []); })
      .finally(() => setApprovalLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const fetchExchangeRules = async () => {
    try {
      const r: any = await api.get("/system/params");
      const list = r.data || [];
      const pair = list.find((p: any) => p.param_key === "consignment_exchange_allowed_pairs");
      if (pair) { setExchangeRules((() => { try { return JSON.parse(pair.param_value || "[]"); } catch { return []; } })()); }
    } catch {}
  };
  const fetchProducts = async () => {
    try {
      const r: any = await api.get("/products", { params: { page_size: 200 } });
      setProducts(r.data?.items || r.items || []);
    } catch {}
  };
  const addExchangeRule = () => {
    if (!ruleForm.source || !ruleForm.target) return;
    if (exchangeRules.some((p: any) => p.source === ruleForm.source && p.target === ruleForm.target)) {
      alert("此配對已存在"); return;
    }
    setExchangeRules([...exchangeRules, { source: ruleForm.source, target: ruleForm.target }]);
    setRuleForm({ source: "", target: "" });
  };
  const removeExchangeRule = (i: number) => { setExchangeRules(exchangeRules.filter((_, idx) => idx !== i)); };
  const saveExchangeRules = async () => {
    setRuleSaving(true);
    try {
      await api.put("/system/params/consignment_exchange_allowed_pairs", { value: JSON.stringify(exchangeRules) });
      alert("換貨規則已儲存");
      fetchExchangeRules();
    } catch (e: any) { alert(e?.response?.data?.message || "儲存失敗"); }
    finally { setRuleSaving(false); }
  };
  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (activeTab === "approval") fetchApprovals(); }, [activeTab, fetchApprovals]);

  const loadCustomers = async () => {
    const c = await api.get("/consignment/ledger");
    const ledgerData = c.data || [];
    const seen = new Set();
    return ledgerData.filter((row: any) => {
      if (seen.has(row.customer_id)) return false;
      seen.add(row.customer_id);
      return true;
    }).map((row: any) => ({
      customer_id: row.customer_id,
      customer_name: row.customer_name,
      customer_code: row.customer_code
    }));
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
      const r = await api.post("/consignment/release", relForm);
      alert(r.data?.message || "寄庫出庫申請已建立，等待QA審批");
      setShowRelease(false); fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "申請失敗"); }
    finally { setRelSaving(false); }
  };

  // ====== Exchange Modal ======
  const openExchange = () => {
    
    console.log("BEFORE setShowExchange"); setShowExchange(true); console.log("AFTER setShowExchange");
    setExcForm({ customer_id: "", source_product_id: "", target_product_id: "", quantity: 1, reason: "" });
    setExcSrcProducts([]);
    loadCustomers().then(c => setExcCustomers(c)).catch(() => {});
    api.get("/products").then((r: any) => setAllProducts(r.data?.items || r.data || [])).catch(() => {});

  };

  // Fetch exchange mode + allowed pairs when modal opens
  useEffect(() => {
    if (!showExchange) return;
    api.get("/system/params").then((r: any) => {
      const list = r.data || [];
      const m = list.find((p: any) => p.param_key === "consignment_exchange_mode");
      const pr = list.find((p: any) => p.param_key === "consignment_exchange_allowed_pairs");
      if (m) setExcExchangeMode(typeof m.param_value === "string" ? (() => { try { return JSON.parse(m.param_value); } catch { return m.param_value; } })() : m.param_value);
      if (pr) setExcAllowedPairs(typeof pr.param_value === "string" ? (() => { try { return JSON.parse(pr.param_value); } catch { return pr.param_value; } })() : pr.param_value);
    }).catch(() => {});
  }, [showExchange]);

  useEffect(() => {
    if (excForm.customer_id) {
      api.get("/consignment/ledger", { params: { customer_id: excForm.customer_id } }).then((r: any) => {
        setExcSrcProducts(r.data || []);
      });
    } else { setExcSrcProducts([]); setExcForm(prev => ({ ...prev, source_product_id: "", target_product_id: "" })); }
  }, [excForm.customer_id]);
  useEffect(() => { if (excForm.source_product_id) setExcForm(prev => ({ ...prev, target_product_id: "" })); }, [excForm.source_product_id]);

  const doExchange = async () => {
    if (!excForm.customer_id || !excForm.source_product_id || !excForm.target_product_id || excForm.quantity < 1 || !excForm.reason) { alert("請填寫完整資料"); return; }
    setExcSaving(true);
    try {
      const r = await api.post("/consignment/exchange", excForm);
      alert(r.data?.message || "寄庫換貨申請已建立，等待QA審批");
      setShowExchange(false); fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "換貨失敗"); }
    finally { setExcSaving(false); }
  };

  // ====== Approval Actions ======
  const qaApproveRelease = async (id: string) => {
    try { await api.put("/consignment/release/" + id + "/qa-approve"); alert("QA已放行"); fetchApprovals(); } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
  };
  const rejectRelease = async (id: string) => {
    try { await api.put("/consignment/release/" + id + "/reject"); alert("已駁回"); fetchApprovals(); } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
  };
  const shipRelease = async (id: string) => {
    try { await api.put("/consignment/release/" + id + "/ship"); alert("已出貨完成"); fetchApprovals(); fetchData(); } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
  };
  const qaApproveExchange = async (id: string) => {
    try { await api.put("/consignment/exchange/" + id + "/qa-approve"); alert("QA已放行"); fetchApprovals(); } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
  };
  const rejectExchange = async (id: string) => {
    try { await api.put("/consignment/exchange/" + id + "/reject"); alert("已駁回"); fetchApprovals(); } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
  };
  const shipExchange = async (id: string) => {
    try { await api.put("/consignment/exchange/" + id + "/ship"); alert("已換貨出貨完成"); fetchApprovals(); fetchData(); } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
  };

  const filteredLedger = ledger.filter((row: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (row.customer_name || "").toLowerCase().includes(s) || (row.customer_code || "").toLowerCase().includes(s) || (row.product_name || "").toLowerCase().includes(s) || (row.product_code || "").toLowerCase().includes(s);
  });

  return (
    <DashboardLayout>
      <div style={{ padding: "20px 24px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 }}>寄庫管理</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={openRelease} style={bp}>+ 寄庫出庫</button>
            <button onClick={openExchange} style={bo}>+ 寄庫換貨</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #e5e6eb" }}>
          <button onClick={() => setActiveTab("ledger")} style={tabBtn(activeTab === "ledger")}>寄庫台帳</button>
          <button onClick={() => setActiveTab("stale")} style={tabBtn(activeTab === "stale")}>呆滯預警 {staleAlert.length > 0 ? "(" + staleAlert.length + ")" : ""}</button>
          <button onClick={() => setActiveTab("approval")} style={tabBtn(activeTab === "approval")}>審批管理</button><button onClick={() => { setActiveTab("rules"); fetchExchangeRules(); }} style={tabBtn(activeTab === "rules")}>換貨規則</button>
        </div>

        {/* Ledger Tab */}
        {activeTab === "ledger" && (
          <div style={cb}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
              <input style={{ ...si, width: 280 }} placeholder="搜尋客戶/產品..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {loading ? <div style={{ padding: 60, textAlign: "center", color: "#999" }}>載入中...</div> : filteredLedger.length === 0 ? <div style={{ padding: 60, textAlign: "center", color: "#999" }}>尚無寄庫台帳</div> : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={th}>客戶編碼</th><th style={th}>客戶名稱</th><th style={th}>產品編碼</th><th style={th}>產品名稱</th>
                  <th style={th}>剩餘數量</th><th style={th}>最近領貨日</th><th style={th}>來源訂單</th>
                </tr></thead>
                <tbody>
                  {filteredLedger.map((row: any, i: number) => (
                    <tr key={row.ledger_id || i}>
                      <td style={{ ...td, fontFamily: "monospace", fontSize: 12, color: "#1890ff" }}>{row.customer_code || "-"}</td>
                      <td style={td}>{row.customer_name || "-"}</td>
                      <td style={{ ...td, fontFamily: "monospace", fontSize: 12 }}>{row.product_code || "-"}</td>
                      <td style={td}>{row.product_name || "-"}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{row.remaining_qty}</td>
                      <td style={td}>{row.last_release_date ? row.last_release_date.slice(0, 10) : "-"}</td>
                      <td style={{ ...td, fontSize: 12, color: "#888" }}>{row.source_order_no || row.source_sales_order_id ? (row.source_order_no || row.source_sales_order_id).slice(0, 16) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Stale Alert Tab */}
        {activeTab === "stale" && (
          <div style={cb}>
            {staleAlert.length === 0 ? <div style={{ padding: 60, textAlign: "center", color: "#999" }}>無呆滯預警</div> : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={th}>客戶</th><th style={th}>產品</th><th style={th}>剩餘數量</th>
                  <th style={th}>建立日期</th><th style={th}>最近領貨</th>
                </tr></thead>
                <tbody>
                  {staleAlert.map((row: any, i: number) => (
                    <tr key={i}>
                      <td style={td}>{row.customer_name} <span style={{ fontSize: 11, color: "#999" }}>({row.customer_code})</span></td>
                      <td style={td}>{row.product_name} <span style={{ fontSize: 11, color: "#999" }}>({row.product_code})</span></td>
                      <td style={{ ...td, fontWeight: 600, color: "#ff4d4f" }}>{row.remaining_qty}</td>
                      <td style={td}>{row.created_at ? row.created_at.slice(0, 10) : "-"}</td>
                      <td style={td}>{row.last_release_date ? row.last_release_date.slice(0, 10) : "從未領貨"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Approval Tab */}
        {activeTab === "approval" && (
          <div>
            {approvalLoading ? <div style={{ padding: 60, textAlign: "center", color: "#999" }}>載入中...</div> : (
              <>
                {/* 寄庫出庫審批 */}
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#333" }}>寄庫出庫審批</h3>
                <div style={{ ...cb, marginBottom: 24 }}>
                  {releases.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#999" }}>尚無出庫申請</div> : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr>
                        <th style={th}>單號</th><th style={th}>客戶</th><th style={th}>產品</th>
                        <th style={th}>數量</th><th style={th}>狀態</th><th style={th}>建立時間</th>
                        <th style={th}>操作</th>
                      </tr></thead>
                      <tbody>
                        {releases.map((r: any) => (
                          <tr key={r.release_id}>
                            <td style={{ ...td, fontFamily: "monospace", fontSize: 11 }}>{r.release_no}</td>
                            <td style={td}>{r.customer_name} <span style={{ fontSize: 11, color: "#999" }}>({r.customer_code})</span></td>
                            <td style={td}>{r.product_name} <span style={{ fontSize: 11, color: "#999" }}>({r.product_code})</span></td>
                            <td style={{ ...td, fontWeight: 600 }}>{r.quantity}</td>
                            <td style={td}><span style={ts(STATUS_MAP[r.status]?.bg || "#f0f0f0", STATUS_MAP[r.status]?.color || "#888")}>{STATUS_MAP[r.status]?.label || r.status}</span></td>
                            <td style={{ ...td, fontSize: 12, color: "#888" }}>{r.created_at ? r.created_at.slice(0, 16).replace("T", " ") : "-"}</td>
                            <td style={td}>
                              {r.status === "PENDING_QA" && (
                                <><button onClick={() => qaApproveRelease(r.release_id)} style={{ ...btnSm, marginRight: 4, color: "#52c41a", borderColor: "#b7eb8f" }}>QA放行</button>
                                <button onClick={() => rejectRelease(r.release_id)} style={{ ...btnSm, color: "#ff4d4f", borderColor: "#ffccc7" }}>駁回</button></>
                              )}
                              {r.status === "QA_APPROVED" && (
                                <button onClick={() => shipRelease(r.release_id)} style={{ ...btnSm, color: "#1890ff", borderColor: "#91d5ff" }}>確認出貨</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* 寄庫換貨審批 */}
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#333" }}>寄庫換貨審批</h3>
                <div style={cb}>
                  {exchanges.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#999" }}>尚無換貨申請</div> : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr>
                        <th style={th}>單號</th><th style={th}>客戶</th><th style={th}>原產品</th>
                        <th style={th}>改出產品</th><th style={th}>數量</th><th style={th}>原因</th>
                        <th style={th}>狀態</th><th style={th}>操作</th>
                      </tr></thead>
                      <tbody>
                        {exchanges.map((e: any) => (
                          <tr key={e.exchange_id}>
                            <td style={{ ...td, fontFamily: "monospace", fontSize: 11 }}>{e.exchange_no}</td>
                            <td style={td}>{e.customer_name}</td>
                            <td style={td}>{e.source_product_name} <span style={{ fontSize: 11, color: "#999" }}>({e.source_product_code})</span></td>
                            <td style={td}>{e.target_product_name} <span style={{ fontSize: 11, color: "#999" }}>({e.target_product_code})</span></td>
                            <td style={{ ...td, fontWeight: 600 }}>{e.quantity}</td>
                            <td style={{ ...td, fontSize: 12 }}>{e.reason || "-"}</td>
                            <td style={td}><span style={ts(STATUS_MAP[e.status]?.bg || "#f0f0f0", STATUS_MAP[e.status]?.color || "#888")}>{STATUS_MAP[e.status]?.label || e.status}</span></td>
                            <td style={td}>
                              {e.status === "PENDING_QA" && (
                                <><button onClick={() => qaApproveExchange(e.exchange_id)} style={{ ...btnSm, marginRight: 4, color: "#52c41a", borderColor: "#b7eb8f" }}>QA放行</button>
                                <button onClick={() => rejectExchange(e.exchange_id)} style={{ ...btnSm, color: "#ff4d4f", borderColor: "#ffccc7" }}>駁回</button></>
                              )}
                              {e.status === "QA_APPROVED" && (
                                <button onClick={() => shipExchange(e.exchange_id)} style={{ ...btnSm, color: "#1890ff", borderColor: "#91d5ff" }}>確認出貨</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Exchange Rules Tab */}
        {activeTab === "rules" && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#333" }}>自訂清單</h3>
            <div style={cb}><div style={{ padding: 16 }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>來源產品</div>
                  <select style={{ ...si, width: 200 }} value={ruleForm.source} onChange={e => setRuleForm({ ...ruleForm, source: e.target.value })}>
                    <option value="">選擇產品</option>
                    {products.map((p: any) => <option key={p.product_code} value={p.product_code}>{p.product_code} {p.product_name}</option>)}
                  </select></div>
                <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>目標產品</div>
                  <select style={{ ...si, width: 200 }} value={ruleForm.target} onChange={e => setRuleForm({ ...ruleForm, target: e.target.value })}>
                    <option value="">選擇產品</option>
                    {products.map((p: any) => <option key={p.product_code} value={p.product_code}>{p.product_code} {p.product_name}</option>)}
                  </select></div>
                <button onClick={addExchangeRule} disabled={!ruleForm.source || !ruleForm.target} style={{ ...bp, height: 36, opacity: (!ruleForm.source || !ruleForm.target) ? 0.5 : 1 }}>+ 新增配對</button>
              </div>
              {exchangeRules.length === 0 ? <div style={{ padding: 20, textAlign: "center", color: "#999" }}>尚無換貨配對規則（自訂清單）</div> : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>
                  <th style={th}>來源產品</th><th style={th}>目標產品</th><th style={th}>操作</th>
                </tr></thead><tbody>
                  {exchangeRules.map((pair: any, i: number) => (
                    <tr key={i}><td style={td}>{pair.source}</td><td style={td}>{pair.target}</td>
                      <td style={td}><button onClick={() => removeExchangeRule(i)} style={{ ...btnSm, color: "#ff4d4f", borderColor: "#ffccc7" }}>刪除</button></td></tr>
                  ))}</tbody></table>)}
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={saveExchangeRules} disabled={ruleSaving} style={{ ...bp, opacity: ruleSaving ? 0.6 : 1 }}>{ruleSaving ? "儲存中..." : "儲存規則"}</button>
              </div></div></div></div>)}
        {/* Release Modal */}
        {showRelease && (
          <div style={modalBg} onClick={() => setShowRelease(false)}>
            <div style={modalCard} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>寄庫出庫申請</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                  <div style={sl}>出庫數量 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={si} type="number" min={1} value={relForm.quantity} onChange={e => setRelForm({ ...relForm, quantity: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowRelease(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={doRelease} disabled={relSaving} style={{ ...bp, opacity: relSaving ? 0.6 : 1 }}>{relSaving ? "處理中..." : "送出申請"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Exchange Modal */}
        {showExchange && (
          <div style={modalBg} onClick={() => setShowExchange(false)}>
            <div style={modalCard} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>寄庫換貨申請</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                  <div style={sl}>改出產品 <span style={{ color: "#ff4d4f" }}>*</span>（{excExchangeMode === "CUSTOM" ? "\u81ea\u8a02\u6e05\u55ae" : "\u9650\u540c\u54c1\u724c\u540c\u7cfb\u5217"}）</div>
                  <select style={si} value={excForm.target_product_id} onChange={e => setExcForm({ ...excForm, target_product_id: e.target.value })}>
                    <option value="">請選擇目標產品</option>
                    {allProducts.filter((p: any) => { if (excExchangeMode !== "CUSTOM" || !excForm.source_product_id) return true; const src = allProducts.find((x: any) => x.product_id === excForm.source_product_id); if (!src) return true; const allowed = excAllowedPairs.filter((pair: any) => pair.source === src.product_code).map((pair: any) => pair.target); return allowed.length === 0 || allowed.includes(p.product_code); }).map((p: any) => <option key={p.product_id} value={p.product_id}>{p.product_code} - {p.product_name}</option>)}
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
                <button onClick={doExchange} disabled={excSaving} style={{ ...bo, opacity: excSaving ? 0.6 : 1 }}>{excSaving ? "處理中..." : "送出申請"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

