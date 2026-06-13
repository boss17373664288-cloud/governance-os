"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "../../lib/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

const styles = {
  page: { padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" } as React.CSSProperties,
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 } as React.CSSProperties,
  title: { fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 } as React.CSSProperties,
  card: { background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 20 } as React.CSSProperties,
  cardHeader: { padding: "14px 20px", borderBottom: "1px solid #f0f0f0", fontSize: 15, fontWeight: 600, color: "#333" } as React.CSSProperties,
  cardBody: { padding: 20 } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" } as React.CSSProperties,
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "2px solid #e8e8e8", fontSize: 13, fontWeight: 600, color: "#666", whiteSpace: "nowrap" } as React.CSSProperties,
  td: { padding: "10px 12px", borderBottom: "1px solid #f0f0f0", fontSize: 13, color: "#333" } as React.CSSProperties,
  btn: { height: 36, padding: "0 20px", borderRadius: 4, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 } as React.CSSProperties,
  btnSm: { height: 28, padding: "0 12px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer" } as React.CSSProperties,
  input: { height: 36, padding: "0 10px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" } as React.CSSProperties,
  select: { height: 36, padding: "0 10px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", background: "#fff", width: "100%", boxSizing: "border-box" } as React.CSSProperties,
  label: { fontSize: 13, fontWeight: 500, color: "#555", marginBottom: 4, display: "block" } as React.CSSProperties,
  modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 } as React.CSSProperties,
  modalCard: { background: "#fff", borderRadius: 8, width: 800, maxHeight: "85vh", overflow: "auto", padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" } as React.CSSProperties,
  tagGreen: { display: "inline-block", padding: "2px 8px", borderRadius: 3, fontSize: 11, fontWeight: 500, background: "#f6ffed", color: "#52c41a", border: "1px solid #b7eb8f" } as React.CSSProperties,
  tagBlue: { display: "inline-block", padding: "2px 8px", borderRadius: 3, fontSize: 11, fontWeight: 500, background: "#e6f7ff", color: "#1890ff", border: "1px solid #91d5ff" } as React.CSSProperties,
};

export default function ExpensePage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState<string | null>(null);
  const [showBudget, setShowBudget] = useState(false);
  const [budgetInfo, setBudgetInfo] = useState<any>(null);
  const [budgetForm, setBudgetForm] = useState({ employee_id: "", monthly_amount: 0 });
  const [showAcctModal, setShowAcctModal] = useState(false);
  const [editingAcct, setEditingAcct] = useState<any>(null);
  
  const [hiddenAccounts, setHiddenAccounts] = useState<string[]>([]);
  const [acctForm, setAcctForm] = useState({ account_code: "", account_name: "" });
  const [form, setForm] = useState({
    employee_id: "",
    expense_month: new Date().toISOString().slice(0, 7).replace("-", ""),
    notes: "",
    items: [{ account_id: "", account_code: "", account_name: "", description: "", amount: 0 }] as any[],
  });

  const fetchList = useCallback(() => {
    setLoading(true);
    api.get("/expense").then((r: any) => setList(r.data?.items || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fetchAccounts = useCallback(() => {
    api.get("/expense/accounts").then((r: any) => setAccounts(r.data || [])).catch(() => {});
  }, []);

  const fetchEmployees = useCallback(() => {
    api.get("/expense/employees").then((r: any) => setEmployees(r.data || [])).catch(() => {});
  }, []);

  const fetchHiddenAccounts = useCallback(() => {
    api.get("/expense/hidden-accounts").then((r: any) => setHiddenAccounts(r.data || r || [])).catch(() => {});
  }, []);

  useEffect(() => { fetchList(); fetchAccounts(); fetchHiddenAccounts(); fetchEmployees(); }, [fetchList, fetchAccounts, fetchHiddenAccounts, fetchEmployees]);

  const totalAmount = form.items.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { account_id: "", account_code: "", account_name: "", description: "", amount: 0 }] });
  };

  const removeItem = (idx: number) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const items = [...form.items];
    if (field === "account_code") {
      const acct = accounts.find((a: any) => a.account_code === value);
      items[idx] = { ...items[idx], account_code: value, account_id: acct?.account_id || "", account_name: acct?.account_name || "" };
    } else {
      items[idx] = { ...items[idx], [field]: value };
    }
    setForm({ ...form, items });
  };

  const openNew = () => {
    setForm({
      employee_id: "",
      expense_month: new Date().toISOString().slice(0, 7).replace("-", ""),
      notes: "",
      items: [{ account_id: "", account_code: "", account_name: "", description: "", amount: 0 }],
    });
    setBudgetInfo(null);
    fetchAccounts();
    fetchEmployees();
    setShowForm(true);
  };

  const openEdit = async (id: string) => {
    try {
      const r: any = await api.get("/expense/" + id);
      const data = r.data;
      setForm({
        employee_id: data.employee_id,
        expense_month: data.expense_month,
        notes: data.notes || "",
        items: (data.items || []).map((i: any) => ({
          account_id: i.account_id || "",
          account_code: i.account_code || "",
          account_name: i.account_name || "",
          description: i.description || "",
          amount: Number(i.amount) || 0,
        })),
      });
      setBudgetInfo(null);
      fetchAccounts();
      fetchEmployees();
      setShowForm(true);
    } catch { alert("載入失敗"); }
  };

  useEffect(() => {
    if (!form.employee_id || !form.expense_month || form.expense_month.length < 6) { setBudgetInfo(null); return; }
    api.get("/expense/check-budget", { params: { employee_id: form.employee_id, expense_month: form.expense_month } })
      .then((r: any) => setBudgetInfo(r.data))
      .catch(() => setBudgetInfo(null));
  }, [form.employee_id, form.expense_month]);

  const save = async () => {
    if (!form.employee_id) { alert("請選擇員工"); return; }
    if (!form.expense_month) { alert("請選擇報銷月份"); return; }
    if (form.items.length === 0) { alert("請至少填寫一筆明細"); return; }
    for (const item of form.items) {
      if (!item.account_code && !item.account_id) { alert("每行需選擇會計科目"); return; }
      if (!item.amount || Number(item.amount) <= 0) { alert("每行金額需大於 0"); return; }
    }
    setSaving(true);
    try {
      const payload = {
        employee_id: form.employee_id,
        expense_month: form.expense_month,
        notes: form.notes,
        items: form.items.map((i: any) => ({
          account_code: i.account_code,
          account_id: i.account_id,
          account_name: i.account_name,
          description: i.description,
          amount: Number(i.amount),
        })),
      };
      await api.post("/expense", payload);
      alert("報銷單已建立");
      setShowForm(false);
      fetchList();
    } catch (e: any) { alert(e?.response?.data?.message || "儲存失敗"); }
    finally { setSaving(false); }
  };

  const doPost = async (id: string) => {
    if (!confirm("確定將此報銷單記入日記帳？記入後不可修改或刪除")) return;
    setPosting(id);
    try {
      await api.post("/expense/" + id + "/post");
      alert("已記入日記帳");
      fetchList();
    } catch (e: any) { alert(e?.response?.data?.message || "記帳失敗"); }
    finally { setPosting(null); }
  };

  const doDelete = async (id: string, posted: boolean) => {
    if (posted) { alert("已記帳不可刪除"); return; }
    if (!confirm("確定刪除此報銷單？")) return;
    try {
      await api.delete("/expense/" + id);
      fetchList();
    } catch (e: any) { alert(e?.response?.data?.message || "刪除失敗"); }
  };

  const saveAccount = async () => {
    if (!acctForm.account_code || !acctForm.account_name) { alert("請填寫代碼與名稱"); return; }
    try {
      if (editingAcct) {
        await api.put("/accounting/accounts/" + editingAcct.account_id, { ...acctForm, account_type: "EXPENSE" });
      } else {
        await api.post("/accounting/accounts", { ...acctForm, account_type: "EXPENSE" });
      }
      alert(editingAcct ? "已更新" : "已新增");
      setShowAcctModal(false);
      fetchAccounts();
    } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
  };

  const toggleHideAccount = async (acct: any) => {
    const isHidden = hiddenAccounts.includes(acct.account_id);
    const action = isHidden ? "啟用" : "隱藏";
    if (!confirm("確定" + action + "此科目？(僅影響報銷下拉選單)")) return;
    try {
      const newList = isHidden 
        ? hiddenAccounts.filter(id => id !== acct.account_id)
        : [...hiddenAccounts, acct.account_id];
      await api.put("/expense/hidden-accounts", { account_ids: newList });
      setHiddenAccounts(newList);
      fetchAccounts();
    } catch (e: any) { alert("操作失敗"); }
  };

  const saveBudget = async () => {
    if (!budgetForm.employee_id) { alert("請選擇員工"); return; }
    if (!budgetForm.monthly_amount || budgetForm.monthly_amount <= 0) { alert("請輸入每月額度"); return; }
    try {
      await api.post("/expense/employees/" + budgetForm.employee_id + "/budget", { monthly_amount: budgetForm.monthly_amount });
      alert("每月固定額度已設定");
      fetchEmployees();
      setShowBudget(false);
    } catch (e: any) { alert(e?.response?.data?.message || "設定失敗"); }
  };

  const fmt = (n: number) => "$" + n.toLocaleString();

  return (
    <DashboardLayout>
      <div style={styles.page}>
        <div style={styles.header}>
          <h2 style={styles.title}>報銷管理</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setShowBudget(true); fetchEmployees(); }} style={{ ...styles.btn, background: "#fff", color: "#666", border: "1px solid #d9d9d9" }}>💰 員工每月額度</button>
            <button onClick={() => { setEditingAcct(null); setAcctForm({ account_code: "", account_name: "" }); setShowAcctModal(true); }} style={{ ...styles.btn, background: "#fff", color: "#666", border: "1px solid #d9d9d9" }}>📋 會計科目</button>
            <button onClick={openNew} style={{ ...styles.btn, background: "#1890ff", color: "#fff" }}>+ 新增報銷</button>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>報銷單列表</div>
          <div style={{ padding: 0, overflow: "auto" }}>
            {loading ? <div style={{ padding: 60, textAlign: "center", color: "#999" }}>載入中..."</div> : list.length === 0 ? <div style={{ padding: 60, textAlign: "center", color: "#999" }}>尚無報銷單</div> : (
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>報銷單號</th>
                  <th style={styles.th}>員工</th>
                  <th style={styles.th}>月份</th>
                  <th style={styles.th}>總金額</th>
                  <th style={styles.th}>狀態</th>
                  <th style={styles.th}>備註</th>
                  <th style={styles.th}>建立時間</th>
                  <th style={styles.th}>操作</th>
                </tr></thead>
                <tbody>
                  {list.map((e: any) => (
                    <tr key={e.expense_id}>
                      <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12, color: "#1890ff" }}>{e.expense_no}</td>
                      <td style={styles.td}>{e.employee_name || "-"} <span style={{ fontSize: 11, color: "#999" }}>({e.employee_no})</span></td>
                      <td style={styles.td}>{e.expense_month ? e.expense_month.slice(0,4) + "/" + e.expense_month.slice(4) : "-"}</td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{fmt(Number(e.total_amount))}</td>
                      <td style={styles.td}>{e.posted_to_journal ? <span style={styles.tagGreen}>已記帳</span> : <span style={styles.tagBlue}>草稿</span>}</td>
                      <td style={{ ...styles.td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.notes || "-"}</td>
                      <td style={{ ...styles.td, fontSize: 12, color: "#888" }}>{e.created_at?.slice(0, 16).replace("T", " ") || "-"}</td>
                      <td style={styles.td}>
                        {!e.posted_to_journal && (
                          <>
                            <button onClick={() => openEdit(e.expense_id)} style={{ ...styles.btnSm, marginRight: 4 }}>編輯</button>
                            <button onClick={() => doPost(e.expense_id)} disabled={posting === e.expense_id} style={{ ...styles.btnSm, marginRight: 4, color: "#1890ff", borderColor: "#91d5ff" }}>
                              {posting === e.expense_id ? "處理中..." : "記入日記帳"}
                            </button>
                            <button onClick={() => doDelete(e.expense_id, false)} style={{ ...styles.btnSm, color: "#ff4d4f", borderColor: "#ffccc7" }}>刪除</button>
                          </>
                        )}
                        {e.posted_to_journal && <span style={{ fontSize: 12, color: "#999" }}>已鎖定</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showForm && (
          <div style={styles.modalBg} onClick={() => setShowForm(false)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>報銷申請單</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }}>
                <div>
                  <label style={styles.label}>員工 <span style={{ color: "#ff4d4f" }}>*</span></label>
                  <select style={styles.select} value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                    <option value="">請選擇員工</option>
                    {employees.map((emp: any) => <option key={emp.employee_id} value={emp.employee_id}>{emp.employee_no} - {emp.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>報銷月份 <span style={{ color: "#ff4d4f" }}>*</span></label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select style={{ ...styles.select, width: "40%" }} value={form.expense_month.slice(0, 4)} onChange={e => setForm({ ...form, expense_month: e.target.value + (form.expense_month.slice(4) || "01") })}>
                      {(() => { const y = new Date().getFullYear(); const opts = []; for (let i = y - 2; i <= y + 1; i++) opts.push(<option key={i} value={String(i)}>{i}月</option>); return opts; })()}
                    </select>
                    <select style={{ ...styles.select, width: "60%" }} value={form.expense_month.slice(4) || "01"} onChange={e => setForm({ ...form, expense_month: (form.expense_month.slice(0, 4) || String(new Date().getFullYear())) + e.target.value })}>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(m => (
                        <option key={m} value={m}>{parseInt(m)}月</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {budgetInfo && (
                <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 6, background: budgetInfo.remaining < 0 ? "#fff2f0" : "#f6ffed", border: "1px solid " + (budgetInfo.remaining < 0 ? "#ffccc7" : "#b7eb8f") }}>
                  <div style={{ display: "flex", gap: 24, fontSize: 13, flexWrap: "wrap" }}>
                    <span>每月額度: <b>{fmt(Number(budgetInfo.monthly_budget))}</b></span>
                    <span>已記帳" <b style={{ color: "#ff4d4f" }}>{fmt(Number(budgetInfo.spent))}</b></span>
                    <span>待審核" <b style={{ color: "#faad14" }}>{fmt(Number(budgetInfo.pending))}</b></span>
                    <span>剩餘: <b style={{ color: budgetInfo.remaining < 0 ? "#ff4d4f" : "#52c41a" }}>{fmt(Number(budgetInfo.remaining))}</b></span>
                  </div>
                  {budgetInfo.remaining < 0 && <div style={{ marginTop: 6, fontSize: 12, color: "#ff4d4f" }}>⚠️ 已超出每月預算額度！</div>}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={styles.label}>備註</label>
                <input style={styles.input} placeholder="報銷事由摘要..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ ...styles.label, margin: 0 }}>報銷明細 <span style={{ color: "#ff4d4f" }}>*</span></label>
                  <button onClick={addItem} style={{ ...styles.btnSm, color: "#1890ff", borderColor: "#91d5ff" }}>+ 新增明細</button>
                </div>
                <table style={styles.table}>
                  <thead><tr>
                    <th style={{ ...styles.th, width: "25%" }}>會計科目</th>
                    <th style={{ ...styles.th, width: "30%" }}>說明</th>
                    <th style={{ ...styles.th, width: "20%" }}>金額</th>
                    <th style={{ ...styles.th, width: "10%", textAlign: "center" }}>操作</th>
                  </tr></thead>
                  <tbody>
                    {form.items.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td style={styles.td}>
                          <select style={styles.select} value={item.account_code} onChange={e => updateItem(idx, "account_code", e.target.value)}>
                            <option value="">請選擇科目</option>
                            {accounts.map((a: any) => <option key={a.account_code} value={a.account_code}>{a.account_code} {a.account_name}</option>)}
                          </select>
                        </td>
                        <td style={styles.td}>
                          <input style={styles.input} placeholder="費用說明..." value={item.description} onChange={e => updateItem(idx, "description", e.target.value)} />
                        </td>
                        <td style={styles.td}>
                          <input style={styles.input} type="number" min={0} step={0.01} value={item.amount || ""} onChange={e => updateItem(idx, "amount", e.target.value)} />
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <button onClick={() => removeItem(idx)} disabled={form.items.length <= 1} style={{ ...styles.btnSm, color: "#ff4d4f", borderColor: "#ffccc7", opacity: form.items.length <= 1 ? 0.4 : 1 }}>刪除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} style={{ ...styles.td, textAlign: "right", fontWeight: 600, fontSize: 14 }}>合計：</td>
                      <td style={{ ...styles.td, fontWeight: 700, fontSize: 16, color: "#1890ff" }}>{fmt(totalAmount)}</td>
                      <td style={styles.td}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button onClick={() => setShowForm(false)} style={{ ...styles.btn, background: "#fff", color: "#666", border: "1px solid #d9d9d9" }}>取消</button>
                <button onClick={save} disabled={saving} style={{ ...styles.btn, background: "#1890ff", color: "#fff", opacity: saving ? 0.6 : 1 }}>
                  {saving ? "儲存中..." : "儲存報銷單"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showBudget && (
          <div style={styles.modalBg} onClick={() => setShowBudget(false)}>
            <div style={{ ...styles.modalCard, width: 550 }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>員工每月固定報銷額度</h3>
              <div style={{ marginBottom: 8, fontSize: 12, color: "#888" }}>每位員工設定一個每月固定額度，適用於所有月份。</div>
              
              <div style={{ marginBottom: 20, maxHeight: 300, overflow: "auto" }}>
                <table style={styles.table}>
                  <thead><tr>
                    <th style={styles.th}>員工</th>
                    <th style={styles.th}>每月固定額度</th>
                  </tr></thead>
                  <tbody>
                    {employees.map((emp: any) => (
                      <tr key={emp.employee_id}>
                        <td style={styles.td}>{emp.full_name} ({emp.employee_no})</td>
                        <td style={{ ...styles.td, fontWeight: 600, color: Number(emp.budget_amount) > 0 ? "#1890ff" : "#999" }}>
                          {Number(emp.budget_amount) > 0 ? fmt(Number(emp.budget_amount)) : "未設定"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "16px 0" }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={styles.label}>員工</label>
                  <select style={styles.select} value={budgetForm.employee_id} onChange={e => setBudgetForm({ ...budgetForm, employee_id: e.target.value })}>
                    <option value="">請選擇</option>
                    {employees.map((emp: any) => <option key={emp.employee_id} value={emp.employee_id}>{emp.employee_no} {emp.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>每月固定額度</label>
                  <input style={styles.input} type="number" min={0} step={100} placeholder="例: 5000" value={budgetForm.monthly_amount || ""} onChange={e => setBudgetForm({ ...budgetForm, monthly_amount: Number(e.target.value) })} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowBudget(false)} style={{ ...styles.btn, background: "#fff", color: "#666", border: "1px solid #d9d9d9" }}>關閉</button>
                <button onClick={saveBudget} style={{ ...styles.btn, background: "#1890ff", color: "#fff" }}>設定額度</button>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Account Management Modal */}
        {showAcctModal && (
          <div style={styles.modalBg} onClick={() => setShowAcctModal(false)}>
            <div style={{ ...styles.modalCard, width: 650 }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>費用科目管理</h3>
              
              <div style={{ marginBottom: 16, maxHeight: 300, overflow: "auto" }}>
                <table style={styles.table}>
                  <thead><tr>
                    <th style={styles.th}>代碼</th>
                    <th style={styles.th}>名稱</th>
                    <th style={{ ...styles.th, textAlign: "center", width: 120 }}>操作</th>
                  </tr></thead>
                  <tbody>
                    {accounts.map((a: any) => (
                      <tr key={a.account_id}>
                        <td style={{ ...styles.td, fontFamily: "monospace" }}>{a.account_code}</td>
                        <td style={styles.td}>{a.account_name}</td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <button onClick={() => { setEditingAcct(a); setAcctForm({ account_code: a.account_code, account_name: a.account_name }); }} style={{ ...styles.btnSm, marginRight: 4 }}>編輯</button>
                          <button onClick={() => toggleHideAccount(a)} style={{ ...styles.btnSm, color: hiddenAccounts.includes(a.account_id) ? "#52c41a" : "#ff4d4f", borderColor: hiddenAccounts.includes(a.account_id) ? "#b7eb8f" : "#ffccc7" }}>{hiddenAccounts.includes(a.account_id) ? "啟用" : "隱藏"}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "16px 0" }} />

              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{editingAcct ? "編輯科目" : "新增科目"}</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                <div>
                  <label style={styles.label}>科目代碼</label>
                  <input style={styles.input} placeholder="例: 5511" value={acctForm.account_code} onChange={e => setAcctForm({ ...acctForm, account_code: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>科目名稱</label>
                  <input style={styles.input} placeholder="例: 燃油費" value={acctForm.account_name} onChange={e => setAcctForm({ ...acctForm, account_name: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowAcctModal(false)} style={{ ...styles.btn, background: "#fff", color: "#666", border: "1px solid #d9d9d9" }}>關閉</button>
                <button onClick={saveAccount} style={{ ...styles.btn, background: "#1890ff", color: "#fff" }}>{editingAcct ? "更新" : "新增"}</button>
              </div>
            </div>
          </div>
        )}

    </DashboardLayout>
  );
}