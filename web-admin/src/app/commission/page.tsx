"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const bp: React.CSSProperties = { height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, cursor: "pointer" };
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", boxSizing: "border-box" };

export default function CommissionPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showConfig, setShowConfig] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [configForm, setConfigForm] = useState({ employee_id: "", new_customer_rate: "0", existing_customer_rate: "0", tier1_amount: "200000", tier1_rate: "0", tier2_amount: "600000", tier2_rate: "0", tier3_amount: "1000000", tier3_rate: "0", per_product_bonus: [] as any[], ar_collection_rate: "0" });

  const [showCalc, setShowCalc] = useState(false);
  const [calcEmployee, setCalcEmployee] = useState("");
  const [calcMonth, setCalcMonth] = useState(new Date().toISOString().slice(0,7).replace("-",""));
  const [calcResult, setCalcResult] = useState<any>(null);

  const [showGenerate, setShowGenerate] = useState(false);
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0,7).replace("-",""));
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState<string | null>(null);

  const fetchConfigs = useCallback(() => { api.get("/commission/configs").then((r: any) => setConfigs(r.data || r || [])).catch(() => {}); }, []);
  const fetchEmployees = useCallback(() => { api.get("/employees", { params: { page_size: 200 } }).then((r: any) => setEmployees(r.data?.items || r.items || [])).catch(() => {}); }, []);
  const fetchProducts = useCallback(() => { api.get("/commission/products").then((r: any) => setProducts(r.data || r || [])).catch(() => {}); }, []);
  const fetchRecords = useCallback(() => { setLoading(true); api.get("/commission", { params: { page_size: 50 } }).then((r: any) => setRecords(r.data?.items || r.items || [])).finally(() => setLoading(false)); }, []);

  useEffect(() => { fetchConfigs(); fetchEmployees(); fetchProducts(); fetchRecords(); }, [fetchConfigs, fetchEmployees, fetchProducts, fetchRecords]);

  const openNewConfig = () => {
    setEditingConfig(null);
    setConfigForm({ employee_id: "", new_customer_rate: "0", existing_customer_rate: "0", tier1_amount: "200000", tier1_rate: "0", tier2_amount: "600000", tier2_rate: "0", tier3_amount: "1000000", tier3_rate: "0", per_product_bonus: [], ar_collection_rate: "0" });
    setShowConfig(true);
  };

  const openEditConfig = (c: any) => {
    setEditingConfig(c);
    const ppb = typeof c.per_product_bonus === 'string' ? JSON.parse(c.per_product_bonus || '[]') : (c.per_product_bonus || []);
    setConfigForm({
      employee_id: c.employee_id,
      new_customer_rate: String(c.new_customer_rate || 0),
      existing_customer_rate: String(c.existing_customer_rate || 0),
      tier1_amount: String(c.tier1_amount || 200000), tier1_rate: String(c.tier1_rate || 0),
      tier2_amount: String(c.tier2_amount || 600000), tier2_rate: String(c.tier2_rate || 0),
      tier3_amount: String(c.tier3_amount || 1000000), tier3_rate: String(c.tier3_rate || 0),
      per_product_bonus: ppb,
      ar_collection_rate: String(c.ar_collection_rate || 0)
    });
    setShowConfig(true);
  };

  const addProductBonus = () => {
    setConfigForm({ ...configForm, per_product_bonus: [...configForm.per_product_bonus, { product_id: "", product_name: "", bonus_per_unit: "0" }] });
  };

  const updateProductBonus = (idx: number, field: string, value: string) => {
    const list = [...configForm.per_product_bonus];
    list[idx] = { ...list[idx], [field]: value };
    if (field === "product_id") {
      const p = products.find((x: any) => x.product_id === value);
      if (p) list[idx].product_name = p.product_name;
    }
    setConfigForm({ ...configForm, per_product_bonus: list });
  };

  const removeProductBonus = (idx: number) => {
    setConfigForm({ ...configForm, per_product_bonus: configForm.per_product_bonus.filter((_: any, i: number) => i !== idx) });
  };

  const saveConfig = async () => {
    if (!configForm.employee_id) return alert("請選擇員工");
    try {
      await api.post("/commission/configs", {
        employee_id: configForm.employee_id,
        new_customer_rate: Number(configForm.new_customer_rate),
        existing_customer_rate: Number(configForm.existing_customer_rate),
        tier1_amount: Number(configForm.tier1_amount), tier1_rate: Number(configForm.tier1_rate),
        tier2_amount: Number(configForm.tier2_amount), tier2_rate: Number(configForm.tier2_rate),
        tier3_amount: Number(configForm.tier3_amount), tier3_rate: Number(configForm.tier3_rate),
        per_product_bonus: configForm.per_product_bonus.map((b: any) => ({ ...b, bonus_per_unit: Number(b.bonus_per_unit) })),
        ar_collection_rate: Number(configForm.ar_collection_rate)
      });
      setShowConfig(false); fetchConfigs();
    } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
  };

  const doCalculate = async () => {
    if (!calcEmployee) return alert("請選擇員工");
    try { const r = await api.get("/commission/calculate", { params: { employee_id: calcEmployee, month: calcMonth } }); setCalcResult(r.data || r); } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
  };

  const doGenerate = async () => {
    if (!confirm("確定為所有已設定員工產生 " + genMonth.slice(0,4) + "/" + genMonth.slice(4) + " 獎金？")) return;
    setGenerating(true);
    try { const r = await api.post("/commission/generate", { period_month: genMonth }); alert("已生成 " + (r.data?.generated || 0) + " 筆"); setShowGenerate(false); fetchRecords(); } catch (e: any) { alert(e?.response?.data?.message || "失敗"); } finally { setGenerating(false); }
  };

  const doPost = async (id: string) => {
    if (!confirm("確定記入日記帳？")) return;
    setPosting(id);
    try { await api.post("/commission/" + id + "/post"); fetchRecords(); } catch (e: any) { alert(e?.response?.data?.message || "失敗"); } finally { setPosting(null); }
  };

  const doDelete = async (id: string) => {
    if (!confirm("確定刪除？")) return;
    try { await api.delete("/commission/" + id); fetchRecords(); } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString();

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 }}>銷售獎金管理</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={openNewConfig} style={{ ...bp, background: "#fff", color: "#1890ff", border: "1px solid #1890ff" }}>+ 獎金設定</button>
            <button onClick={() => { setShowCalc(true); setCalcResult(null); }} style={{ ...bp, background: "#fff", color: "#722ed1", border: "1px solid #d3adf7" }}>試算</button>
            <button onClick={() => setShowGenerate(true)} style={bp}>產生月獎金</button>
          </div>
        </div>

        <div style={{ marginBottom: 16, padding: "12px 16px", background: "#f9f0ff", borderRadius: 6, border: "1px solid #d3adf7", fontSize: 12, color: "#531dab", lineHeight: 1.8 }}>
          <strong>計算規則：</strong>僅計算已完全回款訂單 | 新客/舊客分開% | 累計達標階梯% | 指定產品數量獎金
        </div>

        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>員工獎金設定</h3>
          <div style={{ background: "#fff", borderRadius: 6, overflow: "auto", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead><tr style={{ background: "#fafafa" }}>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>員工</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>新客%</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>舊客%</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>階梯1</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>階梯2</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>階梯3</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>全公司回款%</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0", width: 60 }}>操作</th>
              </tr></thead>
              <tbody>
                {configs.length === 0 ? <tr><td colSpan={8} style={{ textAlign: "center", padding: 30, color: "#999" }}>尚無設定</td></tr> : configs.map((c: any) => (
                  <tr key={c.config_id}>
                    <td style={{ padding: "6px 10px", fontSize: 13, borderBottom: "1px solid #f0f0f0" }}>{c.full_name} ({c.employee_no})</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "center", color: "#52c41a", fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>{Number(c.new_customer_rate)}%</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "center", color: "#1890ff", fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>{Number(c.existing_customer_rate)}%</td>
                    <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>{Number(c.tier1_amount)>0 ? fmt(c.tier1_amount) + " > " + Number(c.tier1_rate) + "%" : "-"}</td>
                    <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>{Number(c.tier2_amount)>0 ? fmt(c.tier2_amount) + " > " + Number(c.tier2_rate) + "%" : "-"}</td>
                    <td style={{ padding: "6px 10px", fontSize: 11, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>{Number(c.tier3_amount)>0 ? fmt(c.tier3_amount) + " > " + Number(c.tier3_rate) + "%" : "-"}</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "center", color: "#fa8c16", fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>{Number(c.ar_collection_rate)>0 ? Number(c.ar_collection_rate) + "%" : "-"}</td>
                    <td style={{ padding: "4px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                      <button onClick={() => openEditConfig(c)} style={{ height: 24, padding: "0 8px", borderRadius: 3, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 11, cursor: "pointer" }}>編輯</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>獎金記錄</h3>
          {loading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : records.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無記錄</div> : (
            <div style={{ background: "#fff", borderRadius: 6, overflow: "auto", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead><tr style={{ background: "#fafafa" }}>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>月份</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>員工</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>總銷售</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>新客獎金</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>舊客獎金</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>階梯獎金</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>全公司回款獎金</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>產品獎金</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>總獎金</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>操作</th>
                </tr></thead>
                <tbody>
                  {records.map((r: any) => (
                    <tr key={r.record_id}>
                      <td style={{ padding: "6px 10px", fontSize: 12, borderBottom: "1px solid #f0f0f0" }}>{r.period_month?.slice(0,4)}/{r.period_month?.slice(4)}</td>
                      <td style={{ padding: "6px 10px", fontSize: 13, borderBottom: "1px solid #f0f0f0" }}>{r.full_name}</td>
                      <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{fmt(r.total_sales)}</td>
                      <td style={{ padding: "6px 10px", fontSize: 12, textAlign: "right", color: "#52c41a", borderBottom: "1px solid #f0f0f0" }}>{fmt(r.new_customer_commission)}</td>
                      <td style={{ padding: "6px 10px", fontSize: 12, textAlign: "right", color: "#1890ff", borderBottom: "1px solid #f0f0f0" }}>{fmt(r.existing_customer_commission)}</td>
                      <td style={{ padding: "6px 10px", fontSize: 12, textAlign: "right", color: "#722ed1", borderBottom: "1px solid #f0f0f0" }}>{fmt(r.tiered_commission)}</td>
                      <td style={{ padding: "6px 10px", fontSize: 12, textAlign: "right", color: "#eb2f96", borderBottom: "1px solid #f0f0f0" }}>{fmt(r.ar_collection_commission)}</td>
                      <td style={{ padding: "6px 10px", fontSize: 12, textAlign: "right", color: "#fa8c16", borderBottom: "1px solid #f0f0f0" }}>{fmt(r.product_commission)}</td>
                      <td style={{ padding: "6px 10px", fontSize: 14, textAlign: "right", fontWeight: 700, color: r.posted_to_journal ? "#52c41a" : "#ff4d4f", borderBottom: "1px solid #f0f0f0" }}>{fmt(r.total_commission)}</td>
                      <td style={{ padding: "4px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                        {r.posted_to_journal ? <span style={{ fontSize: 11, color: "#52c41a" }}>已記帳</span> : (
                          <>
                            <button onClick={() => doPost(r.record_id)} disabled={posting === r.record_id} style={{ height: 24, padding: "0 8px", marginRight: 4, borderRadius: 3, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 11, cursor: "pointer" }}>記帳</button>
                            <button onClick={() => doDelete(r.record_id)} style={{ height: 24, padding: "0 8px", borderRadius: 3, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 11, cursor: "pointer" }}>刪除</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Config Modal */}
        {showConfig && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowConfig(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 600, maxHeight: "85vh", overflow: "auto" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>{editingConfig ? "編輯獎金設定" : "新增獎金設定"}</h3>
              {!editingConfig && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>員工</div>
                  <select value={configForm.employee_id} onChange={e => setConfigForm({ ...configForm, employee_id: e.target.value })} style={si}>
                    <option value="">請選擇</option>
                    {employees.filter((e: any) => !configs.find((c: any) => c.employee_id === e.employee_id)).map((e: any) => <option key={e.employee_id} value={e.employee_id}>{e.full_name} ({e.employee_no})</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>新客戶獎金 %</div>
                  <input type="number" step="0.1" value={configForm.new_customer_rate} onChange={e => setConfigForm({ ...configForm, new_customer_rate: e.target.value })} style={si} min="0" />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>舊客戶獎金 %</div>
                  <input type="number" step="0.1" value={configForm.existing_customer_rate} onChange={e => setConfigForm({ ...configForm, existing_customer_rate: e.target.value })} style={si} min="0" />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>全公司回款 %</div>
                  <input type="number" step="0.1" value={configForm.ar_collection_rate} onChange={e => setConfigForm({ ...configForm, ar_collection_rate: e.target.value })} style={si} min="0" />
                  <div style={{ fontSize: 10, color: "#ff4d4f", marginTop: 2 }}>業務主管用：全公司當月已回款總額 x 此%</div>
                </div>
              </div>
              <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "12px 0" }} />
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>階梯式累計獎金（每月總銷售達標）</div>
              {["tier1","tier2","tier3"].map((key: string) => (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>達標金額</div>
                    <input type="number" value={(configForm as any)[key+"_amount"]} onChange={e => setConfigForm({ ...configForm, [key+"_amount"]: e.target.value } as any)} style={si} min="0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>獎金 %</div>
                    <input type="number" step="0.1" value={(configForm as any)[key+"_rate"]} onChange={e => setConfigForm({ ...configForm, [key+"_rate"]: e.target.value } as any)} style={si} min="0" />
                  </div>
                </div>
              ))}
              <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>指定產品數量獎金</span>
                <button onClick={addProductBonus} style={{ height: 28, padding: "0 12px", borderRadius: 4, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 12, cursor: "pointer" }}>+ 新增產品</button>
              </div>
              {configForm.per_product_bonus.map((b: any, idx: number) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 40px", gap: 8, marginBottom: 6, alignItems: "end" }}>
                  <div>
                    <select value={b.product_id} onChange={e => updateProductBonus(idx, "product_id", e.target.value)} style={si}>
                      <option value="">選擇產品</option>
                      {products.map((p: any) => <option key={p.product_id} value={p.product_id}>{p.product_code} {p.product_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <input type="number" placeholder="元/單位" value={b.bonus_per_unit} onChange={e => updateProductBonus(idx, "bonus_per_unit", e.target.value)} style={si} min="0" />
                  </div>
                  <button onClick={() => removeProductBonus(idx)} style={{ height: 36, padding: "0", borderRadius: 4, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 18, cursor: "pointer", lineHeight: "34px", textAlign: "center" }}>X</button>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowConfig(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={saveConfig} style={bp}>{editingConfig ? "更新" : "儲存"}</button>
              </div>
            </div>
          </div>
        )}

        {showCalc && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) { setShowCalc(false); setCalcResult(null); } }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 520, maxHeight: "80vh", overflow: "auto" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>試算獎金</h3>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 2 }}>
                  <select value={calcEmployee} onChange={e => setCalcEmployee(e.target.value)} style={si}>
                    <option value="">請選擇員工</option>
                    {employees.map((e: any) => <option key={e.employee_id} value={e.employee_id}>{e.full_name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <input type="month" value={calcMonth.slice(0,4)+"-"+calcMonth.slice(4)} onChange={e => setCalcMonth(e.target.value.replace("-",""))} style={si} />
                </div>
              </div>
              <button onClick={doCalculate} style={{ ...bp, width: "100%", background: "#722ed1" }}>試算</button>
              {calcResult && (
                <div style={{ marginTop: 16, padding: 16, background: "#fafafa", borderRadius: 6 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr><td style={{ padding: "4px 0", fontSize: 13, color: "#888" }}>已回款訂單數</td><td style={{ textAlign: "right", fontSize: 13 }}>{calcResult.paid_order_count}</td></tr>
                      <tr><td style={{ padding: "4px 0", fontSize: 13, color: "#888" }}>總銷售額</td><td style={{ textAlign: "right", fontSize: 13, fontWeight: 600 }}>{fmt(calcResult.total_sales)}</td></tr>
                      <tr><td style={{ padding: "4px 0", fontSize: 13, color: "#888" }}>新客銷售</td><td style={{ textAlign: "right", fontSize: 13 }}>{fmt(calcResult.new_customer_sales)}</td></tr>
                      <tr><td style={{ padding: "4px 0", fontSize: 13, color: "#888" }}>舊客銷售</td><td style={{ textAlign: "right", fontSize: 13 }}>{fmt(calcResult.existing_customer_sales)}</td></tr>
                      <tr style={{ borderTop: "1px solid #f0f0f0" }}><td style={{ padding: "4px 0", fontSize: 13, color: "#52c41a" }}>新客獎金</td><td style={{ textAlign: "right", fontSize: 13, color: "#52c41a" }}>{fmt(calcResult.new_customer_commission)}</td></tr>
                      <tr><td style={{ padding: "4px 0", fontSize: 13, color: "#1890ff" }}>舊客獎金</td><td style={{ textAlign: "right", fontSize: 13, color: "#1890ff" }}>{fmt(calcResult.existing_customer_commission)}</td></tr>
                      <tr><td style={{ padding: "4px 0", fontSize: 13, color: "#722ed1" }}>階梯獎金</td><td style={{ textAlign: "right", fontSize: 13, color: "#722ed1" }}>{fmt(calcResult.tiered_commission)}</td></tr>
                      <tr><td style={{ padding: "4px 0", fontSize: 13, color: "#eb2f96" }}>全公司回款獎金</td><td style={{ textAlign: "right", fontSize: 13, color: "#eb2f96" }}>{fmt(calcResult.ar_collection_commission)}</td></tr>
                      <tr><td style={{ padding: "4px 0", fontSize: 13, color: "#fa8c16" }}>產品獎金</td><td style={{ textAlign: "right", fontSize: 13, color: "#fa8c16" }}>{fmt(calcResult.product_commission)}</td></tr>
                      {calcResult.product_breakdown?.length > 0 && calcResult.product_breakdown.map((pb: any, i: number) => (
                        <tr key={i}><td colSpan={2} style={{ fontSize: 11, color: "#888", padding: "2px 0" }}>{pb.product_name} x {pb.qty} x {fmt(pb.per_unit)} = {fmt(pb.total)}</td></tr>
                      ))}
                      <tr style={{ borderTop: "2px solid #722ed1" }}><td style={{ padding: "8px 0", fontSize: 16, fontWeight: 700 }}>總獎金</td><td style={{ textAlign: "right", fontSize: 16, fontWeight: 700, color: "#ff4d4f" }}>{fmt(calcResult.total_commission)}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ textAlign: "right", marginTop: 12 }}>
                <button onClick={() => { setShowCalc(false); setCalcResult(null); }} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", cursor: "pointer" }}>關閉</button>
              </div>
            </div>
          </div>
        )}

        {showGenerate && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowGenerate(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 400 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>產生月獎金</h3>
              <div style={{ marginBottom: 12 }}>
                <input type="month" value={genMonth.slice(0,4)+"-"+genMonth.slice(4)} onChange={e => setGenMonth(e.target.value.replace("-",""))} style={si} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                <button onClick={() => setShowGenerate(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", cursor: "pointer" }}>取消</button>
                <button onClick={doGenerate} disabled={generating} style={{ ...bp, background: generating ? "#ccc" : "#52c41a" }}>{generating ? "處理中" : "批次產生"}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}