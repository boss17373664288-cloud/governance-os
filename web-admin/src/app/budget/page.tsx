"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden", padding: 20, marginBottom: 16 };
const cardBox: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 20, marginBottom: 16 };
const bp: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" };
const ss: React.CSSProperties = { ...si, cursor: "pointer" };
const s_l: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#555", borderBottom: "2px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f5f5f5" };

const DEPARTMENTS = ["業務部", "採購部", "品保部", "行政部", "財務部"];

type ExpenseType = { code: string; label: string };

export default function BudgetPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "plans">("dashboard");

  // Dashboard state
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkForm, setCheckForm] = useState({ department: "業務部", expenseType: "TRAVEL", amount: 0 });
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  // Plans state
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planSearch, setPlanSearch] = useState("");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({ budget_year: new Date().getFullYear(), budget_month: 0, department: "業務部", expense_type: "TRAVEL", planned_amount: 0, overrun_policy: "BLOCK" });
  const [planSaving, setPlanSaving] = useState(false);

  // Expense types state (dynamic)
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm, setExpForm] = useState({ code: "", label: "" });
  const [expSaving, setExpSaving] = useState(false);

  const fetchDashboard = useCallback(() => {
    setLoading(true);
    api.get("/budget/dashboard").then((r: any) => setDashboard(r.data || r)).finally(() => setLoading(false));
  }, []);

  const fetchPlans = useCallback(() => {
    setPlansLoading(true);
    api.get("/budget/plans").then((r: any) => setPlans(r.data || r || [])).finally(() => setPlansLoading(false));
  }, []);

  const fetchExpenseTypes = useCallback(() => {
    api.get("/budget/expense-types").then((r: any) => {
      const items = r.data || r || [];
      if (Array.isArray(items) && items.length > 0) setExpenseTypes(items);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchDashboard(); fetchPlans(); fetchExpenseTypes(); }, [fetchDashboard, fetchPlans, fetchExpenseTypes]);

  const doCheck = async () => {
    if (checkForm.amount <= 0) { alert("請輸入金額"); return; }
    setChecking(true);
    try {
      const r: any = await api.post("/budget/check", checkForm);
      setCheckResult(r.data || r);
    } catch (e: any) { alert(e?.response?.data?.message || "檢查失敗"); }
    finally { setChecking(false); }
  };

  const doCommit = async () => {
    if (checkForm.amount <= 0) { alert("請輸入金額"); return; }
    try {
      await api.post("/budget/commit", { ...checkForm, referenceId: "BUD-" + Date.now() });
      alert("預算已提交");
      fetchDashboard();
      fetchPlans();
    } catch (e: any) { alert(e?.response?.data?.message || "提交失敗"); }
  };

  // Plan CRUD
  const openNewPlan = () => {
    setEditingPlan(null);
    setPlanForm({ budget_year: new Date().getFullYear(), budget_month: 0, department: "業務部", expense_type: expenseTypes[0]?.code || "TRAVEL", planned_amount: 0, overrun_policy: "BLOCK" });
    setShowPlanModal(true);
  };

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      budget_year: plan.budget_year,
      budget_month: plan.budget_month || 0,
      department: plan.department,
      expense_type: plan.expense_type,
      planned_amount: Number(plan.planned_amount),
      overrun_policy: plan.overrun_policy || "BLOCK",
    });
    setShowPlanModal(true);
  };

  const savePlan = async () => {
    if (!planForm.department || !planForm.expense_type || planForm.planned_amount <= 0) {
      alert("請完整填寫部門、費用類型與金額"); return;
    }
    setPlanSaving(true);
    try {
      const payload = { ...planForm, budget_month: planForm.budget_month || null };
      if (editingPlan) {
        await api.put(`/budget/plans/${editingPlan.budget_id}`, payload);
        alert("預算計畫已更新");
      } else {
        await api.post("/budget/plans", payload);
        alert("預算計畫已建立");
      }
      setShowPlanModal(false);
      fetchPlans();
      fetchDashboard();
    } catch (e: any) {
      alert(e?.response?.data?.message || "儲存失敗");
    } finally { setPlanSaving(false); }
  };

  const deletePlan = async (plan: any) => {
    const label = expenseTypes.find(t => t.code === plan.expense_type)?.label || plan.expense_type;
    if (!confirm(`確定刪除「${plan.department} - ${label} (${plan.budget_year})」？`)) return;
    try {
      await api.delete(`/budget/plans/${plan.budget_id}`);
      alert("已刪除");
      fetchPlans();
      fetchDashboard();
    } catch (e: any) { alert(e?.response?.data?.message || "刪除失敗"); }
  };

  // Expense type management
  const addExpenseType = async () => {
    if (!expForm.code.trim() || !expForm.label.trim()) { alert("請填寫代碼和名稱"); return; }
    setExpSaving(true);
    try {
      await api.post(`/budget/expense-types`, { code: expForm.code, label: expForm.label });
      setShowExpModal(false);
      setExpForm({ code: "", label: "" });
      fetchExpenseTypes();
    } catch (e: any) { alert(e?.response?.data?.message || "新增失敗"); }
    finally { setExpSaving(false); }
  };

  const deleteExpenseType = async (code: string) => {
    if (!confirm(`確定刪除費用類型「${code}」？`)) return;
    try {
      await api.delete(`/budget/expense-types/${code}`);
      fetchExpenseTypes();
    } catch (e: any) { alert(e?.response?.data?.message || "刪除失敗"); }
  };

  const expenseLabel = (code: string) => expenseTypes.find(t => t.code === code)?.label || code;

  const filteredPlans = plans.filter((p: any) => {
    const s = planSearch.toLowerCase();
    return !s || (p.department || "").toLowerCase().includes(s) || (p.expense_type || "").toLowerCase().includes(s) || String(p.budget_year).includes(s);
  });

  if (loading) return <DashboardLayout><div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div></DashboardLayout>;

  const d = dashboard || {};
  const remaining = (d.total_planned || 0) - (d.total_spent || 0);
  const usagePct = d.total_planned ? Math.round((d.total_spent / d.total_planned) * 100) : 0;

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a2e" }}>預算控制</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#999" }}>部門預算規劃、支出管控與超支預警</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #f0f0f0" }}>
          {[
            { key: "dashboard", label: "預算儀錶板" },
            { key: "plans", label: "預算計畫" },
          ].map((t: any) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                height: 40, padding: "0 24px", border: "none", background: "transparent",
                fontSize: 14, fontWeight: activeTab === t.key ? 600 : 400,
                color: activeTab === t.key ? "#1890ff" : "#666",
                borderBottom: activeTab === t.key ? "2px solid #1890ff" : "2px solid transparent",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* ====== Dashboard Tab ====== */}
        {activeTab === "dashboard" && (
          <>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
              {[
                { label: "總預算", value: "NT$ " + (d.total_planned || 0).toLocaleString(), bg: "#e6f7ff", color: "#1890ff" },
                { label: "已支出", value: "NT$ " + (d.total_spent || 0).toLocaleString(), bg: "#fff7e6", color: "#fa8c16" },
                { label: "剩餘預算", value: "NT$ " + remaining.toLocaleString(), bg: "#f6ffed", color: "#52c41a" },
                { label: "使用率", value: usagePct + "%", bg: "#f0f0ff", color: "#722ed1" },
              ].map((k, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: "16px 20px", borderLeft: "3px solid " + k.color }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Department Breakdown */}
              <div style={cardBox}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>部門預算使用</h3>
                {(d.departments || []).length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#999" }}>尚無預算計畫，請至「預算計畫」頁籤建立</div>
                ) : (
                  (d.departments || []).map((dept: any, i: number) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{dept.name}</span>
                        <span style={{ fontSize: 12, color: "#888" }}>NT$ {dept.spent.toLocaleString()} / {dept.planned.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: Math.min(dept.pct, 100) + "%", background: dept.pct > 80 ? "#ff4d4f" : dept.pct > 60 ? "#fa8c16" : "#52c41a", borderRadius: 4, transition: "width 0.3s" }} />
                      </div>
                      <div style={{ fontSize: 11, color: dept.pct > 80 ? "#ff4d4f" : "#888", marginTop: 4 }}>{dept.pct}% 已使用</div>
                    </div>
                  ))
                )}
              </div>

              {/* Budget Check & Commit */}
              <div style={cardBox}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>預算檢查與提交</h3>
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <div style={s_l}>部門</div>
                    <select style={ss} value={checkForm.department} onChange={e => setCheckForm({ ...checkForm, department: e.target.value })}>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={s_l}>費用類型</div>
                    <select style={ss} value={checkForm.expenseType} onChange={e => setCheckForm({ ...checkForm, expenseType: e.target.value })}>
                      {expenseTypes.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={s_l}>金額 (NT$)</div>
                    <input style={si} type="number" min={0} step={1000} value={checkForm.amount || ""} onChange={e => setCheckForm({ ...checkForm, amount: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={doCheck} disabled={checking} style={bp}>{checking ? "檢查中..." : "檢查預算"}</button>
                    <button onClick={doCommit} style={{ ...bp, background: "#52c41a" }}>提交預算</button>
                  </div>
                  {checkResult && (
                    <div style={{ padding: 12, borderRadius: 4, background: checkResult.allowed ? "#f6ffed" : "#fff1f0", border: "1px solid " + (checkResult.allowed ? "#b7eb8f" : "#ffa39e"), marginTop: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: checkResult.allowed ? "#52c41a" : "#ff4d4f" }}>
                        {checkResult.allowed ? "✓ 預算充足，可以支出" : "✗ " + (checkResult.reason || "預算不足")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Overrun Alerts */}
            {(d.overrun_alerts || []).length > 0 && (
              <div style={{ ...cardBox, border: "1px solid #ffa39e", background: "#fff1f0" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#ff4d4f", margin: "0 0 12px" }}>⚠ 超支預警</h3>
                {(d.overrun_alerts || []).map((alert: string, i: number) => (
                  <div key={i} style={{ fontSize: 13, color: "#ff4d4f", padding: "4px 0" }}>{alert}</div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ====== Plans Tab ====== */}
        {activeTab === "plans" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...si, width: 280 }} placeholder="搜尋部門、費用類型或年度..." value={planSearch} onChange={e => setPlanSearch(e.target.value)} />
                <button onClick={() => { setExpForm({ code: "", label: "" }); setShowExpModal(true); }}
                  style={{ height: 36, padding: "0 14px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                  ⚙ 管理費用類型
                </button>
              </div>
              <button onClick={openNewPlan} style={bp}>+ 新增預算計畫</button>
            </div>

            {/* Expense type tags */}
            <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#999", lineHeight: "26px" }}>費用類型：</span>
              {expenseTypes.map(t => (
                <span key={t.code} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 8px", borderRadius: 2, fontSize: 11,
                  background: "#e6f7ff", color: "#1890ff", border: "1px solid #91d5ff",
                }}>
                  {t.label}
                  <span onClick={() => deleteExpenseType(t.code)} style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 2, fontWeight: 700 }}>×</span>
                </span>
              ))}
            </div>

            {plansLoading ? (
              <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div>
            ) : filteredPlans.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無預算計畫，點擊上方按鈕新增</div>
            ) : (
              <div style={cb}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>年度</th>
                      <th style={th}>月份</th>
                      <th style={th}>部門</th>
                      <th style={th}>費用類型</th>
                      <th style={{ ...th, textAlign: "right" }}>計畫金額</th>
                      <th style={{ ...th, textAlign: "right" }}>已支出</th>
                      <th style={{ ...th, textAlign: "right" }}>剩餘</th>
                      <th style={th}>超支政策</th>
                      <th style={th}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlans.map((p: any, i: number) => {
                      const planned = Number(p.planned_amount) || 0;
                      const spent = Number(p.spent_amount) || 0;
                      const rem = planned - spent;
                      return (
                        <tr key={p.budget_id || i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={td}>{p.budget_year}</td>
                          <td style={td}>{p.budget_month || "全年"}</td>
                          <td style={{ ...td, fontWeight: 500 }}>{p.department}</td>
                          <td style={td}>{expenseLabel(p.expense_type)}</td>
                          <td style={{ ...td, textAlign: "right", fontFamily: "monospace" }}>NT$ {planned.toLocaleString()}</td>
                          <td style={{ ...td, textAlign: "right", fontFamily: "monospace", color: spent > 0 ? "#fa8c16" : "#999" }}>NT$ {spent.toLocaleString()}</td>
                          <td style={{ ...td, textAlign: "right", fontFamily: "monospace", color: rem < 0 ? "#ff4d4f" : "#52c41a" }}>NT$ {rem.toLocaleString()}</td>
                          <td style={td}>{p.overrun_policy === "BLOCK" ? "禁止超支" : p.overrun_policy === "WARN" ? "僅預警" : p.overrun_policy || "-"}</td>
                          <td style={td}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => openEditPlan(p)} style={{ height: 28, padding: "0 10px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#1890ff", fontSize: 12, cursor: "pointer" }}>編輯</button>
                              <button onClick={() => deletePlan(p)} style={{ height: 28, padding: "0 10px", borderRadius: 3, border: "1px solid #ffa39e", background: "#fff", color: "#ff4d4f", fontSize: 12, cursor: "pointer" }}>刪除</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ====== Plan Modal ====== */}
      {showPlanModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 8, width: 480, maxHeight: "80vh", overflow: "auto", padding: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.16)" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600 }}>{editingPlan ? "編輯預算計畫" : "新增預算計畫"}</h3>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div style={s_l}>年度 *</div>
                <input style={si} type="number" min={2020} max={2100} value={planForm.budget_year} onChange={e => setPlanForm({ ...planForm, budget_year: parseInt(e.target.value) || new Date().getFullYear() })} />
              </div>
              <div>
                <div style={s_l}>月份（0=全年）</div>
                <select style={ss} value={planForm.budget_month} onChange={e => setPlanForm({ ...planForm, budget_month: parseInt(e.target.value) })}>
                  <option value={0}>全年</option>
                  {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} 月</option>)}
                </select>
              </div>
              <div>
                <div style={s_l}>部門 *</div>
                <select style={ss} value={planForm.department} onChange={e => setPlanForm({ ...planForm, department: e.target.value })}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <div style={s_l}>費用類型 *</div>
                <select style={ss} value={planForm.expense_type} onChange={e => setPlanForm({ ...planForm, expense_type: e.target.value })}>
                  {expenseTypes.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <div style={s_l}>計畫金額 (NT$) *</div>
                <input style={si} type="number" min={1} step={1000} value={planForm.planned_amount || ""} onChange={e => setPlanForm({ ...planForm, planned_amount: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <div style={s_l}>超支政策</div>
                <select style={ss} value={planForm.overrun_policy} onChange={e => setPlanForm({ ...planForm, overrun_policy: e.target.value })}>
                  <option value="BLOCK">禁止超支</option>
                  <option value="WARN">僅預警</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowPlanModal(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
              <button onClick={savePlan} disabled={planSaving} style={{ ...bp, opacity: planSaving ? 0.6 : 1 }}>{planSaving ? "儲存中..." : "儲存"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Expense Type Modal ====== */}
      {showExpModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }}>
          <div style={{ background: "#fff", borderRadius: 8, width: 400, padding: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.16)" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600 }}>新增費用類型</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={s_l}>代碼（英文）*</div>
                <input style={si} value={expForm.code} onChange={e => setExpForm({ ...expForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") })} placeholder="例如: BONUS" />
              </div>
              <div>
                <div style={s_l}>名稱（中文）*</div>
                <input style={si} value={expForm.label} onChange={e => setExpForm({ ...expForm, label: e.target.value })} placeholder="例如: 獎金" />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowExpModal(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
              <button onClick={addExpenseType} disabled={expSaving} style={{ ...bp, opacity: expSaving ? 0.6 : 1 }}>{expSaving ? "新增中..." : "新增"}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}