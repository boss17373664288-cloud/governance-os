"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const bp: React.CSSProperties = { height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, cursor: "pointer" };
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", boxSizing: "border-box" };

const LABOR_GRADES = [28590,28800,30300,31800,33300,34800,36300,38200,40100,42000,43900,45800,48200,50600,53000,55400,57800,60800,63800,66800,69800,72800,76500,80200,83900,87600,91300,95000,98700,102400,106100,109800,113500,117200,120900,124600,128300,132000,135700,139400,143100,146800,150500];

export default function PayrollPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showConfig, setShowConfig] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [configForm, setConfigForm] = useState({ employee_id: "", base_salary: "0", allowances: "0", management_bonus: "0", housing_allowance: "0", festival_bonus: "0", birthday_bonus: "0", year_end_bonus: "0", insured_salary: 30300, dependents: 0, voluntary_pension: 0 });

  const [showCalc, setShowCalc] = useState(false);
  const [calcEmployee, setCalcEmployee] = useState("");
  const [calcResult, setCalcResult] = useState<any>(null);

  const [showGenerate, setShowGenerate] = useState(false);
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0,7).replace("-",""));
  const [generating, setGenerating] = useState(false);

  const [posting, setPosting] = useState<string | null>(null);

  const fetchConfigs = useCallback(() => { api.get("/payroll/configs").then((r: any) => setConfigs(r.data || r || [])).catch(() => {}); }, []);
  const fetchEmployees = useCallback(() => { api.get("/employees", { params: { page_size: 200 } }).then((r: any) => setEmployees(r.data?.items || r.items || [])).catch(() => {}); }, []);
  const fetchItems = useCallback(() => { setLoading(true); api.get("/payroll", { params: { page_size: 50 } }).then((r: any) => setItems(r.data?.items || r.items || [])).finally(() => setLoading(false)); }, []);

  useEffect(() => { fetchConfigs(); fetchEmployees(); fetchItems(); }, [fetchConfigs, fetchEmployees, fetchItems]);

  const grossFromForm = () => Number(configForm.base_salary||0) + Number(configForm.allowances||0) + Number(configForm.management_bonus||0) + Number(configForm.housing_allowance||0) + Number(configForm.festival_bonus||0) + Number(configForm.birthday_bonus||0) + Number(configForm.year_end_bonus||0);

  const openNewConfig = () => {
    setEditingConfig(null);
    setConfigForm({ employee_id: "", base_salary: "0", allowances: "0", management_bonus: "0", housing_allowance: "0", festival_bonus: "0", birthday_bonus: "0", year_end_bonus: "0", insured_salary: 30300, dependents: 0, voluntary_pension: 0 });
    setShowConfig(true);
  };

  const openEditConfig = (c: any) => {
    setEditingConfig(c);
    setConfigForm({
      employee_id: c.employee_id,
      base_salary: String(c.base_salary || 0),
      allowances: String(c.allowances || 0),
      management_bonus: String(c.management_bonus || 0),
      housing_allowance: String(c.housing_allowance || 0),
      festival_bonus: String(c.festival_bonus || 0),
      birthday_bonus: String(c.birthday_bonus || 0),
      year_end_bonus: String(c.year_end_bonus || 0),
      insured_salary: c.insured_salary || 30300,
      dependents: c.dependents || 0,
      voluntary_pension: c.voluntary_pension || 0
    });
    setShowConfig(true);
  };

  const saveConfig = async () => {
    if (!configForm.employee_id) return alert("請選擇員工");
    try {
      await api.post("/payroll/configs", {
        employee_id: configForm.employee_id,
        base_salary: Number(configForm.base_salary) || 0,
        allowances: Number(configForm.allowances) || 0,
        management_bonus: Number(configForm.management_bonus) || 0,
        housing_allowance: Number(configForm.housing_allowance) || 0,
        festival_bonus: Number(configForm.festival_bonus) || 0,
        birthday_bonus: Number(configForm.birthday_bonus) || 0,
        year_end_bonus: Number(configForm.year_end_bonus) || 0,
        insured_salary: configForm.insured_salary,
        dependents: configForm.dependents,
        voluntary_pension: configForm.voluntary_pension
      });
      setShowConfig(false); fetchConfigs();
    } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
  };

  const doCalculate = async () => {
    if (!calcEmployee) return alert("請選擇員工");
    try {
      const r = await api.get("/payroll/calculate", { params: { employee_id: calcEmployee, month: genMonth } });
      setCalcResult(r.data || r);
    } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
  };

  const doGenerate = async () => {
    if (!genMonth) return alert("請選擇月份");
    if (!confirm("確定為所有已設定的員工產生 " + genMonth.slice(0,4) + "/" + genMonth.slice(4) + " 薪資？")) return;
    setGenerating(true);
    try {
      const r = await api.post("/payroll/generate", { payroll_month: genMonth });
      alert("已生成 " + (r.data?.generated || 0) + " 筆，跳過 " + (r.data?.skipped || 0) + " 筆（已存在）");
      setShowGenerate(false); fetchItems();
    } catch (e: any) { alert(e?.response?.data?.message || "失敗"); } finally { setGenerating(false); }
  };

  const doPost = async (id: string) => {
    if (!confirm("確定記入日記帳？")) return;
    setPosting(id);
    try { await api.post("/payroll/" + id + "/post"); fetchItems(); } catch (e: any) { alert(e?.response?.data?.message || "失敗"); } finally { setPosting(null); }
  };

  const doDelete = async (id: string) => {
    if (!confirm("確定刪除？")) return;
    try { await api.delete("/payroll/" + id); fetchItems(); } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString();

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 }}>薪酬管理</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={openNewConfig} style={{ ...bp, background: "#fff", color: "#1890ff", border: "1px solid #1890ff" }}>+ 員工薪資設定</button>
            <button onClick={() => setShowGenerate(true)} style={bp}>📅 產生月薪資</button>
          </div>
        </div>

        <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fff7e6", borderRadius: 6, border: "1px solid #ffd591", fontSize: 12, color: "#ad6800", lineHeight: 1.8 }}>
          <strong>2025 費率：</strong>勞保12% (員20%/司70%) ｜ 健保5.17% (員30%/司60%) ｜ 勞退公司6% + 自願0-6%
          <br />設定一次後，每月按同樣標準產生薪資。薪資調整請編輯員工設定即可。
        </div>

        {/* Config List */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>員工薪資設定</h3>
          <div style={{ background: "#fff", borderRadius: 6, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#fafafa" }}>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>員工</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>本薪</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>津貼</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>主管加給</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>房租補貼</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>三節禮金</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>生日禮金</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>年終</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>合計</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>投保級距</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>眷口</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>自提%</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0", width: 80 }}>操作</th>
              </tr></thead>
              <tbody>
                {configs.length === 0 ? <tr><td colSpan={13} style={{ textAlign: "center", padding: 30, color: "#999" }}>尚無設定，請點「+ 員工薪資設定」</td></tr> : configs.map((c: any) => {
                  const total = Number(c.base_salary||0) + Number(c.allowances||0) + Number(c.management_bonus||0) + Number(c.housing_allowance||0) + Number(c.festival_bonus||0) + Number(c.birthday_bonus||0) + Number(c.year_end_bonus||0);
                  return (
                  <tr key={c.config_id}>
                    <td style={{ padding: "6px 10px", fontSize: 13, borderBottom: "1px solid #f0f0f0" }}>{c.full_name} ({c.employee_no})</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{fmt(c.base_salary)}</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{fmt(c.allowances)}</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{fmt(c.management_bonus)}</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{fmt(c.housing_allowance)}</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{fmt(c.festival_bonus)}</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{fmt(c.birthday_bonus)}</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{fmt(c.year_end_bonus)}</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>{fmt(total)}</td>
                    <td style={{ padding: "6px 10px", fontSize: 12, textAlign: "center", fontFamily: "monospace", borderBottom: "1px solid #f0f0f0" }}>{fmt(c.insured_salary)}</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>{c.dependents}</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>{c.voluntary_pension}%</td>
                    <td style={{ padding: "4px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                      <button onClick={() => openEditConfig(c)} style={{ height: 24, padding: "0 8px", borderRadius: 3, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 11, cursor: "pointer" }}>編輯</button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payroll Items */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>薪資記錄</h3>
          {loading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : items.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無記錄，請點「📅 產生月薪資」</div> : (
            <div style={{ background: "#fff", borderRadius: 6, overflow: "auto", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
                <thead><tr style={{ background: "#fafafa" }}>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>月份</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>員工</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>本薪</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>勞保自付</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>健保自付</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>勞退自提</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>實發金額</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>狀態</th>
                  <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>操作</th>
                </tr></thead>
                <tbody>
                  {items.map((p: any) => (
                    <tr key={p.payroll_id}>
                      <td style={{ padding: "6px 10px", fontSize: 12, borderBottom: "1px solid #f0f0f0" }}>{p.payroll_month?.slice(0,4)}/{p.payroll_month?.slice(4)}</td>
                      <td style={{ padding: "6px 10px", fontSize: 13, borderBottom: "1px solid #f0f0f0" }}>{p.full_name} ({p.employee_no})</td>
                      <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{fmt(p.gross_salary)}</td>
                      <td style={{ padding: "6px 10px", fontSize: 12, textAlign: "right", color: "#ff4d4f", borderBottom: "1px solid #f0f0f0" }}>{fmt(p.labor_insurance_ee)}</td>
                      <td style={{ padding: "6px 10px", fontSize: 12, textAlign: "right", color: "#ff4d4f", borderBottom: "1px solid #f0f0f0" }}>{fmt(p.health_insurance_ee)}</td>
                      <td style={{ padding: "6px 10px", fontSize: 12, textAlign: "right", color: "#ff4d4f", borderBottom: "1px solid #f0f0f0" }}>{fmt(p.pension_ee)}</td>
                      <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", fontWeight: 600, color: "#52c41a", borderBottom: "1px solid #f0f0f0" }}>{fmt(p.net_salary)}</td>
                      <td style={{ padding: "6px 10px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                        {p.posted_to_journal ? <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 2, background: "#f6ffed", color: "#52c41a" }}>已記帳</span> : <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 2, background: "#e6f7ff", color: "#1890ff" }}>草稿</span>}
                      </td>
                      <td style={{ padding: "4px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                        {!p.posted_to_journal && (
                          <>
                            <button onClick={() => doPost(p.payroll_id)} disabled={posting === p.payroll_id} style={{ height: 24, padding: "0 8px", marginRight: 4, borderRadius: 3, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 11, cursor: "pointer" }}>
                              {posting === p.payroll_id ? "處理中" : "記入日記帳"}
                            </button>
                            <button onClick={() => doDelete(p.payroll_id)} style={{ height: 24, padding: "0 8px", borderRadius: 3, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 11, cursor: "pointer" }}>刪除</button>
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
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 460 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>{editingConfig ? "編輯薪資設定" : "新增員工薪資設定"}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {!editingConfig && (
                  <div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>員工</div>
                    <select value={configForm.employee_id} onChange={e => setConfigForm({ ...configForm, employee_id: e.target.value })} style={si}>
                      <option value="">請選擇</option>
                      {employees.filter((e: any) => !configs.find((c: any) => c.employee_id === e.employee_id)).map((e: any) => <option key={e.employee_id} value={e.employee_id}>{e.full_name} ({e.employee_no})</option>)}
                    </select>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>本薪</div>
                    <input type="number" value={configForm.base_salary} onChange={e => setConfigForm({ ...configForm, base_salary: e.target.value })} style={si} min="0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>津貼</div>
                    <input type="number" value={configForm.allowances} onChange={e => setConfigForm({ ...configForm, allowances: e.target.value })} style={si} min="0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>主管加給</div>
                    <input type="number" value={configForm.management_bonus} onChange={e => setConfigForm({ ...configForm, management_bonus: e.target.value })} style={si} min="0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>房租補貼</div>
                    <input type="number" value={configForm.housing_allowance} onChange={e => setConfigForm({ ...configForm, housing_allowance: e.target.value })} style={si} min="0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>三節禮金</div>
                    <input type="number" value={configForm.festival_bonus} onChange={e => setConfigForm({ ...configForm, festival_bonus: e.target.value })} style={si} min="0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>生日禮金</div>
                    <input type="number" value={configForm.birthday_bonus} onChange={e => setConfigForm({ ...configForm, birthday_bonus: e.target.value })} style={si} min="0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>年終</div>
                    <input type="number" value={configForm.year_end_bonus} onChange={e => setConfigForm({ ...configForm, year_end_bonus: e.target.value })} style={si} min="0" />
                  </div>
                </div>
                <div style={{ background: "#fafafa", padding: "8px 12px", borderRadius: 4, fontSize: 13 }}>合計月薪：<strong>{fmt(grossFromForm())}</strong></div>
                <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "4px 0" }} />
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>投保薪資級距</div>
                  <select value={configForm.insured_salary} onChange={e => setConfigForm({ ...configForm, insured_salary: Number(e.target.value) })} style={si}>
                    {LABOR_GRADES.map(g => <option key={g} value={g}>{g.toLocaleString()}</option>)}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>健保眷口數</div>
                    <input type="number" min={0} max={3} value={configForm.dependents} onChange={e => setConfigForm({ ...configForm, dependents: Number(e.target.value) })} style={si} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>自願勞退提繳%</div>
                    <select value={configForm.voluntary_pension} onChange={e => setConfigForm({ ...configForm, voluntary_pension: Number(e.target.value) })} style={si}>
                      {[0,1,2,3,4,5,6].map(v => <option key={v} value={v}>{v}%</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowConfig(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={saveConfig} style={bp}>{editingConfig ? "更新" : "儲存"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Generate Modal */}
        {showGenerate && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowGenerate(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 420, maxHeight: "80vh", overflow: "auto" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>產生月薪資</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>薪資月份</div>
                  <input type="month" value={genMonth.slice(0,4) + "-" + genMonth.slice(4)} onChange={e => setGenMonth(e.target.value.replace("-",""))} style={si} />
                </div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.8 }}>
                  將為以下 {configs.length} 位已設定員工產生薪資：
                  <div style={{ maxHeight: 150, overflow: "auto", marginTop: 8 }}>
                    {configs.map((c: any) => {
                      const total = Number(c.base_salary||0) + Number(c.allowances||0) + Number(c.management_bonus||0) + Number(c.housing_allowance||0) + Number(c.festival_bonus||0) + Number(c.birthday_bonus||0) + Number(c.year_end_bonus||0);
                      return <div key={c.employee_id} style={{ padding: "2px 0" }}>{c.full_name} — 合計 {fmt(total)}</div>;
                    })}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowGenerate(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={doGenerate} disabled={generating} style={{ ...bp, background: generating ? "#ccc" : "#52c41a" }}>{generating ? "處理中..." : "批次產生"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
