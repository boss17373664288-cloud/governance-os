"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const bp: React.CSSProperties = { height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, cursor: "pointer" };
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", boxSizing: "border-box" };

const ACCOUNT_TYPE_MAP: Record<string, string> = { ASSET: "資產", LIABILITY: "負債", EQUITY: "權益", REVENUE: "收入", EXPENSE: "費用" };

const tabs = [
  { key: "journal", label: "日記帳" },
  { key: "ledger", label: "總帳" },
  { key: "income", label: "損益表" },
  { key: "balance", label: "資產負債表" },
  { key: "cashbook", label: "現金帳" },
  { key: "bank", label: "銀行對帳" },
  { key: "ap", label: "應付帳款" },
  { key: "accounts", label: "會計科目" },
];

export default function AccountingPage() {
  const [tab, setTab] = useState("journal");

  // Accounts
  const [accounts, setAccounts] = useState<any[]>([]);
  const [acctLoading, setAcctLoading] = useState(false);
  const [showAcctModal, setShowAcctModal] = useState(false);
  const [editingAcct, setEditingAcct] = useState<any>(null);
  const [acctForm, setAcctForm] = useState({ account_code: "", account_name: "", account_type: "ASSET", description: "" });
  const [acctFilterType, setAcctFilterType] = useState<string>("");
  const [cashbookHidden, setCashbookHidden] = useState<string[]>([]);
  const [showCashbookAcctModal, setShowCashbookAcctModal] = useState(false);

  const fetchAccounts = useCallback(() => { setAcctLoading(true); api.get("/accounting/accounts").then((r: any) => setAccounts(r.data || r || [])).finally(() => setAcctLoading(false)); }, []);
  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const saveAccount = async () => {
    if (!acctForm.account_code || !acctForm.account_name) return alert("請填寫代碼和名稱");
    try {
      if (editingAcct) await api.put("/accounting/accounts/" + editingAcct.account_id, acctForm);
      else await api.post("/accounting/accounts", acctForm);
      setShowAcctModal(false); fetchAccounts();
    } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
  };

  const toggleAccountActive = async (acct: any) => {
    try {
      await api.put("/accounting/accounts/" + acct.account_id, { 
        account_name: acct.account_name, 
        account_type: acct.account_type, 
        description: acct.description || null,
        is_active: !acct.is_active 
      });
      fetchAccounts();
    } catch (e: any) { alert("操作失敗"); }
  };

  const fetchCashbookHidden = useCallback(() => { 
    api.get("/accounting/cashbook-hidden").then((r: any) => setCashbookHidden(r.data || r || [])).catch(() => {}); 
  }, []);
  useEffect(() => { if (tab === "cashbook") fetchCashbookHidden(); }, [tab, fetchCashbookHidden]);

  const toggleCashbookHidden = async (acct: any) => {
    const isHidden = cashbookHidden.includes(acct.account_id);
    const action = isHidden ? "顯示" : "隱藏";
    if (!confirm("確定" + action + "此科目？(僅影響現金帳下拉選單)")) return;
    try {
      const newList = isHidden ? cashbookHidden.filter(id => id !== acct.account_id) : [...cashbookHidden, acct.account_id];
      await api.put("/accounting/cashbook-hidden", { account_ids: newList });
      setCashbookHidden(newList);
    } catch (e: any) { alert("操作失敗"); }
  };

  // Journal
  const [entries, setEntries] = useState<any[]>([]);
  const [jePagination, setJePagination] = useState<any>({});
  const [jePage, setJePage] = useState(1);
  const [jeLoading, setJeLoading] = useState(false);
  const [showJeModal, setShowJeModal] = useState(false);
  const [jeLines, setJeLines] = useState<any[]>([{ account_id: "", debit: 0, credit: 0 }]);
  const [jeForm, setJeForm] = useState({ entry_date: new Date().toISOString().slice(0, 10), description: "" });
  const [jeDetail, setJeDetail] = useState<any>(null);
  const [expDetail, setExpDetail] = useState<any>(null);

  const fetchEntries = useCallback(() => { setJeLoading(true); api.get("/accounting/journal", { params: { page: jePage, page_size: 15 } }).then((r: any) => { setEntries(r.data?.items || r.items || []); setJePagination(r.data?.pagination || r.pagination || {}); }).finally(() => setJeLoading(false)); }, [jePage]);
  useEffect(() => { if (tab === "journal") fetchEntries(); }, [tab, jePage, fetchEntries]);

  const saveEntry = async () => {
    if (!jeLines.some((l: any) => l.account_id && l.debit > 0) || !jeLines.some((l: any) => l.account_id && l.credit > 0)) return alert("請至少各填一筆借方與貸方");
    try { await api.post("/accounting/journal", { ...jeForm, lines: jeLines }); setShowJeModal(false); fetchEntries(); } catch (e: any) { alert(e?.response?.data?.message || "分錄失敗"); }
  };

  const openJeDetail = async (id: string) => {
    try {
      const r: any = await api.get("/accounting/journal/" + id);
      const data = r.data || r;
      setJeDetail(data);
      setExpDetail(null);
      if (data.source_type === "EXPENSE_REIMBURSEMENT" && data.source_id) {
        api.get("/expense/" + data.source_id).then((er: any) => setExpDetail(er.data || er)).catch(function() {});
      }
    } catch (e) { alert("載入失敗"); }
  };

  // Ledger
  const [ledger, setLedger] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerAccount, setLedgerAccount] = useState("");
  const fetchLedger = useCallback(() => { setLedgerLoading(true); api.get("/accounting/ledger", { params: { account_id: ledgerAccount || undefined } }).then((r: any) => setLedger(r.data?.items || r.items || [])).finally(() => setLedgerLoading(false)); }, [ledgerAccount]);
  useEffect(() => { if (tab === "ledger") fetchLedger(); }, [tab, ledgerAccount, fetchLedger]);

  // Income Statement
  const [income, setIncome] = useState<any>(null);
  const [incomeYear, setIncomeYear] = useState(new Date().getFullYear());
  useEffect(() => { if (tab === "income") api.get("/accounting/income-statement", { params: { year: incomeYear } }).then((r: any) => setIncome(r.data || r)); }, [tab, incomeYear]);

  // Balance Sheet
  const [bs, setBs] = useState<any>(null);
  useEffect(() => { if (tab === "balance") api.get("/accounting/balance-sheet").then((r: any) => setBs(r.data || r)); }, [tab]);

  // Petty Cash
  const [pcList, setPcList] = useState<any>({ opening_balance: 0, items: [] });
  const [pcLoading, setPcLoading] = useState(false);
  const [pcStartDate, setPcStartDate] = useState("");
  const [pcEndDate, setPcEndDate] = useState("");
  const [showPcModal, setShowPcModal] = useState(false);
  const [editingPc, setEditingPc] = useState<any>(null);
  const [pcForm, setPcForm] = useState({ transaction_date: new Date().toISOString().slice(0, 10), type: "EXPENSE", amount: "", category: "雜項", description: "" });

  const cashbookAccounts = accounts.filter((a: any) => (a.account_type === "CASHBOOK" || a.account_type === "EXPENSE") && a.is_active && !cashbookHidden.includes(a.account_id));

  const fetchPettyCash = useCallback(() => { setPcLoading(true); api.get("/accounting/petty-cash", { params: { start_date: pcStartDate || undefined, end_date: pcEndDate || undefined } }).then((r: any) => setPcList(r.data || r)).finally(() => setPcLoading(false)); }, [pcStartDate, pcEndDate]);
  useEffect(() => { if (tab === "cashbook") fetchPettyCash(); }, [tab, fetchPettyCash]);

  const savePettyCash = async () => {
    if (!pcForm.amount || Number(pcForm.amount) <= 0) return alert("請填寫有效金額");
    try {
      if (editingPc) await api.put("/accounting/petty-cash/" + editingPc.pc_id, pcForm);
      else await api.post("/accounting/petty-cash", pcForm);
      setShowPcModal(false); fetchPettyCash();
    } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
  };

  const deletePettyCash = async (id: string) => {
    if (!confirm("確定刪除此筆記錄？")) return;
    try { await api.delete("/accounting/petty-cash/" + id); fetchPettyCash(); } catch (e: any) { alert("刪除失敗"); }
  };

// Bank Reconciliation
  const [bankItems, setBankItems] = useState<any[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);
  const [bankForm, setBankForm] = useState({ transaction_date: new Date().toISOString().slice(0, 10), type: "DEPOSIT", amount: "", description: "", bank_reference: "", note: "" });
  const [bankStats, setBankStats] = useState({ reconciled_total: 0, unreconciled_total: 0, total: 0 });

  const fetchBank = useCallback(() => { setBankLoading(true); api.get("/accounting/bank-statement").then((r: any) => { setBankItems(r.data?.items || r.items || []); setBankStats({ reconciled_total: r.data?.reconciled_total || r.reconciled_total || 0, unreconciled_total: r.data?.unreconciled_total || r.unreconciled_total || 0, total: r.data?.total || r.total || 0 }); }).finally(() => setBankLoading(false)); }, []);
  useEffect(() => { if (tab === "bank") fetchBank(); }, [tab, fetchBank]);

  const saveBank = async () => {
    if (!bankForm.amount || Number(bankForm.amount) <= 0) return alert("請填寫有效金額");
    try {
      if (editingBank) await api.put("/accounting/bank-statement/" + editingBank.statement_id, bankForm);
      else await api.post("/accounting/bank-statement", bankForm);
      setShowBankModal(false); fetchBank();
    } catch (e: any) { alert("失敗"); }
  };

  const toggleReconcile = async (id: string) => {
    try { await api.put("/accounting/bank-statement/" + id + "/reconcile"); fetchBank(); } catch { alert("失敗"); }
  };

  const deleteBank = async (id: string) => {
    if (!confirm("刪除此筆？")) return;
    try { await api.delete("/accounting/bank-statement/" + id); fetchBank(); } catch { alert("失敗"); }
  };

  // AP
  const [apList, setApList] = useState<any[]>([]);
  const [apLoading, setApLoading] = useState(false);
  const [apPage, setApPage] = useState(1);
  const [apPagination, setApPagination] = useState<any>({});
  const [apFilter, setApFilter] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAp, setPayAp] = useState<any>(null);
  const [payAmount, setPayAmount] = useState(0);

  const fetchAp = useCallback(() => { setApLoading(true); api.get("/accounting/ap", { params: { page: apPage, page_size: 15, status: apFilter || undefined } }).then((r: any) => { setApList(r.items || []); setApPagination(r.pagination || {}); }).finally(() => setApLoading(false)); }, [apPage, apFilter]);
  useEffect(() => { if (tab === "ap") fetchAp(); }, [tab, apPage, apFilter, fetchAp]);

  const doPay = async () => {
    if (payAmount <= 0) return alert("請輸入金額");
    try { await api.post("/accounting/ap/pay", { ap_id: payAp.ap_id, amount: payAmount }); setShowPayModal(false); fetchAp(); } catch (e: any) { alert(e?.response?.data?.message || "付款失敗"); }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "20px 24px", background: "#eef2f5", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 }}>會計管理</h2>
          <div style={{ display: "flex", gap: 6 }}>
            {tabs.map(t => <button key={t.key} onClick={() => setTab(t.key)} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: tab === t.key ? "#1890ff" : "#f0f0f0", color: tab === t.key ? "#fff" : "#666", fontSize: 13, cursor: "pointer" }}>{t.label}</button>)}
          </div>
        </div>

        {/* ====== Accounts ====== */}
        {tab === "accounts" && (<>
          <div style={{ marginBottom: 12 }}><button onClick={() => { setEditingAcct(null); setAcctForm({ account_code: "", account_name: "", account_type: "ASSET", description: "" }); setShowAcctModal(true); }} style={bp}>+ 新增科目</button>
          <div style={{ marginBottom: 12, display: "flex", gap: 6 }}>
            <button onClick={() => setAcctFilterType(acctFilterType === "CASHBOOK_EXPENSE" ? "" : "CASHBOOK_EXPENSE")} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: acctFilterType === "CASHBOOK" ? "#1890ff" : "#f0f0f0", color: acctFilterType === "CASHBOOK" ? "#fff" : "#666", fontSize: 13, cursor: "pointer" }}>現金帳可用科目</button>
          </div></div>
          {acctLoading ? <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div> : (
            <div style={cb}><table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#fafafa" }}>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>代碼</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>名稱</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0", width: 80 }}>類型</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0", width: 60 }}>狀態</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0", width: 80 }}>操作</th>
              </tr></thead>
              <tbody>
                {accounts.filter((a: any) => !acctFilterType || (acctFilterType === "CASHBOOK_EXPENSE" ? (a.account_type === "CASHBOOK" || a.account_type === "EXPENSE") : a.account_type === acctFilterType)).map((a: any, i: number) => (
                  <tr key={a.account_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontFamily: "monospace", borderBottom: "1px solid #f0f0f0" }}>{a.account_code}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, borderBottom: "1px solid #f0f0f0" }}>{a.account_name}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>{ACCOUNT_TYPE_MAP[a.account_type] || a.account_type}</td>
                    <td style={{ padding: "8px 12px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}><span style={{ fontSize: 11, color: a.is_active ? "#52c41a" : "#ff4d4f" }}>{a.is_active ? "啟用" : "停用"}</span></td>
                    <td style={{ padding: "4px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                      <button onClick={() => { setEditingAcct(a); setAcctForm({ account_code: a.account_code, account_name: a.account_name, account_type: a.account_type, description: a.description || "" }); setShowAcctModal(true); }} style={{ height: 24, padding: "0 8px", borderRadius: 3, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 11, cursor: "pointer" }}>編輯</button>
                      <button onClick={() => toggleAccountActive(a)} style={{ height: 24, padding: "0 8px", borderRadius: 3, border: a.is_active ? "1px solid #ff4d4f" : "1px solid #52c41a", background: "#fff", color: a.is_active ? "#ff4d4f" : "#52c41a", fontSize: 11, cursor: "pointer", marginLeft: 4 }}>{a.is_active ? "停用" : "啟用"}</button>
                      {acctFilterType === "CASHBOOK_EXPENSE" && (a.is_active ? <button onClick={() => toggleCashbookHidden(a)} style={{ height: 24, padding: "0 8px", borderRadius: 3, border: cashbookHidden.includes(a.account_id) ? "1px solid #52c41a" : "1px solid #ff4d4f", background: "#fff", color: cashbookHidden.includes(a.account_id) ? "#52c41a" : "#ff4d4f", fontSize: 11, cursor: "pointer", marginLeft: 4 }}>{cashbookHidden.includes(a.account_id) ? "顯示" : "隱藏"}</button> : <span style={{ marginLeft: 4, fontSize: 10, color: "#ccc" }}>已停用</span>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
          {showAcctModal && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowAcctModal(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 420 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>{editingAcct ? "編輯科目" : "新增科目"}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div><div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>代碼 *</div><input style={si} value={acctForm.account_code} onChange={e => setAcctForm({...acctForm, account_code: e.target.value})} disabled={!!editingAcct} /></div>
                <div><div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>名稱 *</div><input style={si} value={acctForm.account_name} onChange={e => setAcctForm({...acctForm, account_name: e.target.value})} /></div>
                <div><div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>類型</div><select style={si} value={acctForm.account_type} onChange={e => setAcctForm({...acctForm, account_type: e.target.value})}>{Object.entries(ACCOUNT_TYPE_MAP).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                <button onClick={() => setShowAcctModal(false)} style={{ height: 32, padding: "0 16px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" }}>取消</button>
                <button onClick={saveAccount} style={bp}>儲存</button>
              </div>
            </div>
          </div>)}
        </>)}

                {/* Cashbook Account Management Modal */}
        {showCashbookAcctModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowCashbookAcctModal(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 600, maxHeight: "80vh", overflow: "auto" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>現金帳科目管理</h3>
              
              <div style={{ marginBottom: 16, maxHeight: 300, overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ background: "#fafafa" }}>
                    <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>代碼</th>
                    <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>名稱</th>
                    <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "center", width: 160, borderBottom: "1px solid #f0f0f0" }}>操作</th>
                  </tr></thead>
                  <tbody>
                    {accounts.filter((a: any) => a.account_type === "CASHBOOK").map((a: any) => (
                      <tr key={a.account_id}>
                        <td style={{ padding: "6px 12px", fontSize: 13, fontFamily: "monospace", borderBottom: "1px solid #f0f0f0" }}>{a.account_code}</td>
                        <td style={{ padding: "6px 12px", fontSize: 13, borderBottom: "1px solid #f0f0f0" }}>{a.account_name}</td>
                        <td style={{ padding: "4px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                          <button onClick={() => { setEditingAcct(a); setAcctForm({ account_code: a.account_code, account_name: a.account_name, account_type: a.account_type, description: a.description || "" }); }} style={{ height: 24, padding: "0 8px", borderRadius: 3, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 11, cursor: "pointer", marginRight: 4 }}>編輯</button>
                          <button onClick={() => toggleCashbookHidden(a)} style={{ height: 24, padding: "0 8px", borderRadius: 3, border: cashbookHidden.includes(a.account_id) ? "1px solid #52c41a" : "1px solid #ff4d4f", background: "#fff", color: cashbookHidden.includes(a.account_id) ? "#52c41a" : "#ff4d4f", fontSize: 11, cursor: "pointer" }}>{cashbookHidden.includes(a.account_id) ? "顯示" : "隱藏"}</button>
                        </td>
                      </tr>
                    ))}
                    {accounts.filter((a: any) => a.account_type === "CASHBOOK").length === 0 && (
                      <tr><td colSpan={3} style={{ textAlign: "center", padding: 20, color: "#999", fontSize: 13 }}>尚無現金帳科目，請新增</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "16px 0" }} />

              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{editingAcct ? "編輯科目" : "新增科目"}</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>代碼 *</div>
                  <input style={si} value={acctForm.account_code} onChange={e => setAcctForm({...acctForm, account_code: e.target.value})} disabled={!!editingAcct} placeholder="例: 1001" />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>名稱 *</div>
                  <input style={si} value={acctForm.account_name} onChange={e => setAcctForm({...acctForm, account_name: e.target.value})} placeholder="例: 雜項" />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => { setShowCashbookAcctModal(false); setEditingAcct(null); }} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>關閉</button>
                <button onClick={async () => { await saveAccount(); fetchCashbookHidden(); }} style={bp}>{editingAcct ? "更新" : "新增"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ====== Journal ====== */}
        {tab === "journal" && (<>
          <div style={{ marginBottom: 12, display: "flex", gap: 8 }}><button onClick={() => { setJeForm({ entry_date: new Date().toISOString().slice(0, 10), description: "" }); setJeLines([{ account_id: "", debit: 0, credit: 0 }]); setShowJeModal(true); }} style={bp}>+ 新增分錄</button></div>
          {jeLoading ? <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div> : entries.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: "#999" }}>尚無分錄</div> : (
            <div style={cb}><table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#fafafa" }}>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>日期</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>分錄編號</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>摘要</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>來源單號</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>客戶</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>借方科目</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>借方金額</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>貸方科目</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>貸方金額</th>
              </tr></thead>
              <tbody>
                {entries.map((je: any, i: number) => {
                  const drLines = (je.lines || []).filter((l: any) => Number(l.debit) > 0);
                  const crLines = (je.lines || []).filter((l: any) => Number(l.credit) > 0);
                  return (
                  <tr key={je.entry_id} onClick={() => openJeDetail(je.entry_id)} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", cursor: "pointer" }}>
                    <td style={{ padding: "8px 12px", fontSize: 13, borderBottom: "1px solid #f0f0f0" }}>{je.entry_date?.slice(0, 10)}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12, fontFamily: "monospace", color: "#1890ff", borderBottom: "1px solid #f0f0f0" }}>{je.entry_no}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, borderBottom: "1px solid #f0f0f0" }}>{je.description || "-"}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12, fontFamily: "monospace", borderBottom: "1px solid #f0f0f0" }}>
                      {je.source_ref ? (je.source_type === "SALES" || je.source_type === "COGS" ? <a href={"/orders/" + je.source_id} onClick={e => e.stopPropagation()} style={{ color: "#1890ff" }}>{je.source_ref}</a> : <span>{je.source_ref}</span>) : "-"}
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 12, borderBottom: "1px solid #f0f0f0" }}>{je.customer_name || "-"}
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 12, borderBottom: "1px solid #f0f0f0" }}>
                      {drLines.map((l: any, j: number) => <div key={j} style={{ fontSize: 12, lineHeight: "1.6" }}>{l.account_code} {l.account_name}</div>)}
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right", color: "#52c41a", borderBottom: "1px solid #f0f0f0" }}>
                      {drLines.map((l: any, j: number) => <div key={j} style={{ lineHeight: "1.6" }}>{Number(l.debit).toLocaleString()}</div>)}
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 12, borderBottom: "1px solid #f0f0f0" }}>
                      {crLines.map((l: any, j: number) => <div key={j} style={{ fontSize: 12, lineHeight: "1.6" }}>{l.account_code} {l.account_name}</div>)}
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right", color: "#ff4d4f", borderBottom: "1px solid #f0f0f0" }}>
                      {crLines.map((l: any, j: number) => <div key={j} style={{ lineHeight: "1.6" }}>{Number(l.credit).toLocaleString()}</div>)}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table></div>
          )}
          {jePagination.total_pages > 1 && (<div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
            <button disabled={jePage <= 1} onClick={() => setJePage(jePage - 1)} style={{ ...bp, background: jePage <= 1 ? "#ccc" : "#1890ff" }}>上一頁</button>
            <span style={{ lineHeight: "32px", fontSize: 13 }}>{jePage}/{jePagination.total_pages}</span>
            <button disabled={jePage >= jePagination.total_pages} onClick={() => setJePage(jePage + 1)} style={{ ...bp, background: jePage >= jePagination.total_pages ? "#ccc" : "#1890ff" }}>下一頁</button>
          </div>)}

          {showJeModal && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowJeModal(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 640, maxHeight: "80vh", overflow: "auto" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>新增分錄</h3>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>日期</div><input type="date" style={si} value={jeForm.entry_date} onChange={e => setJeForm({...jeForm, entry_date: e.target.value})} /></div>
                <div style={{ flex: 2 }}><div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>說明</div><input style={si} value={jeForm.description} onChange={e => setJeForm({...jeForm, description: e.target.value})} /></div>
              </div>
              {jeLines.map((line: any, i: number) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <select style={{ flex: 2, height: 32, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 12, padding: "0 4px" }} value={line.account_id} onChange={e => { const ns = [...jeLines]; ns[i] = {...ns[i], account_id: e.target.value}; setJeLines(ns); }}>
                    <option value="">選擇科目</option>
                    {accounts.map((a: any) => <option key={a.account_id} value={a.account_id}>{a.account_code} {a.account_name}</option>)}
                  </select>
                  <input type="number" style={{ width: 100, height: 32, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, textAlign: "right", padding: "0 8px" }} placeholder="借方" value={line.debit || ""} onChange={e => { const ns = [...jeLines]; ns[i] = {...ns[i], debit: +e.target.value}; setJeLines(ns); }} />
                  <input type="number" style={{ width: 100, height: 32, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, textAlign: "right", padding: "0 8px" }} placeholder="貸方" value={line.credit || ""} onChange={e => { const ns = [...jeLines]; ns[i] = {...ns[i], credit: +e.target.value}; setJeLines(ns); }} />
                  <button onClick={() => { if (jeLines.length <= 2) return alert("至少兩行"); setJeLines(jeLines.filter((_: any, j: number) => j !== i)); }} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 12, cursor: "pointer", padding: 0 }}>✕</button>
                </div>
              ))}
              <button onClick={() => setJeLines([...jeLines, { account_id: "", debit: 0, credit: 0 }])} style={{ ...bp, background: "#fff", color: "#1890ff", border: "1px dashed #1890ff", marginBottom: 12 }}>+ 新增行</button>
              <div style={{ fontSize: 12, marginBottom: 12 }}>
                借方合計: {jeLines.reduce((s: number, l: any) => s + (+l.debit || 0), 0).toLocaleString()} | 貸方合計: {jeLines.reduce((s: number, l: any) => s + (+l.credit || 0), 0).toLocaleString()}
                {Math.abs(jeLines.reduce((s: number, l: any) => s + (+l.debit || 0), 0) - jeLines.reduce((s: number, l: any) => s + (+l.credit || 0), 0)) > 0.01 && <span style={{ color: "#ff4d4f", marginLeft: 8 }}>⚠ 借貸不平衡</span>}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button onClick={() => setShowJeModal(false)} style={{ height: 32, padding: "0 16px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" }}>取消</button>
                <button onClick={saveEntry} style={bp}>儲存分錄</button>
              </div>
            </div>
          </div>)}

          {jeDetail && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setJeDetail(null); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 560, maxHeight: "70vh", overflow: "auto" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>{jeDetail.entry_no} — {jeDetail.description || "分錄詳情"}</h3>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>日期: {jeDetail.entry_date?.slice(0, 10)}</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#fafafa" }}>
                  <th style={{ padding: "6px 10px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>科目</th>
                  <th style={{ padding: "6px 10px", fontSize: 12, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>借方</th>
                  <th style={{ padding: "6px 10px", fontSize: 12, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>貸方</th>
                </tr></thead>
                <tbody>
                  {jeDetail.lines?.map((l: any, i: number) => (
                    <tr key={i}>
                      <td style={{ padding: "6px 10px", fontSize: 13, borderBottom: "1px solid #f0f0f0" }}>{l.account_code} {l.account_name}</td>
                      <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{l.debit > 0 ? Number(l.debit).toLocaleString() : ""}</td>
                      <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{l.credit > 0 ? Number(l.credit).toLocaleString() : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {expDetail && (
              <div style={{ marginTop: 16, padding: 16, background: "#fafafa", borderRadius: 6, border: "1px solid #f0f0f0" }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>報銷明細</h4>
                <div style={{ fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: "#888" }}>員工：</span>
                  <span>{expDetail.employee_name || "-"} ({expDetail.employee_no || "-"})</span>
                  <span style={{ marginLeft: 16, color: "#888" }}>月份：</span>
                  <span>{expDetail.expense_month ? expDetail.expense_month.slice(0,4) + "/" + expDetail.expense_month.slice(4) : "-"}</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ background: "#f5f5f5" }}>
                    <th style={{ padding: "6px 10px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #e5e6eb" }}>科目</th>
                    <th style={{ padding: "6px 10px", fontSize: 12, color: "#888", textAlign: "right", borderBottom: "1px solid #e5e6eb" }}>金額</th>
                    <th style={{ padding: "6px 10px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #e5e6eb" }}>備註</th>
                  </tr></thead>
                  <tbody>
                    {(expDetail.items || []).map(function(it, i) {
                      return (
                      <tr key={i}>
                        <td style={{ padding: "6px 10px", fontSize: 13, borderBottom: "1px solid #f0f0f0" }}>{it.account_code} {it.account_name}</td>
                        <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", fontWeight: 500, borderBottom: "1px solid #f0f0f0" }}>${Number(it.amount || 0).toLocaleString()}</td>
                        <td style={{ padding: "6px 10px", fontSize: 12, color: "#888", borderBottom: "1px solid #f0f0f0" }}>{it.notes || "-"}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
                <div style={{ textAlign: "right", marginTop: 8, fontSize: 14, fontWeight: 600 }}>
                  合計：${Number(expDetail.total_amount || 0).toLocaleString()}
                </div>
              </div>
            )}
              <div style={{ textAlign: "right", marginTop: 12 }}><button onClick={() => setJeDetail(null)} style={{ height: 32, padding: "0 16px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" }}>關閉</button></div>
            </div>
          </div>)}
        </>)}

        {/* ====== Ledger ====== */}
        {tab === "ledger" && (<>
          <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <select style={{ height: 32, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px", minWidth: 200 }} value={ledgerAccount} onChange={e => setLedgerAccount(e.target.value)}>
              <option value="">全部科目</option>
              {accounts.map((a: any) => <option key={a.account_id} value={a.account_id}>{a.account_code} {a.account_name}</option>)}
            </select>
          </div>
          {ledgerLoading ? <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div> : ledger.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: "#999" }}>尚無明細</div> : (
            <div style={cb}><table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#fafafa" }}>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>日期</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>分錄</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>科目</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>說明</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>借方</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>貸方</th>
              </tr></thead>
              <tbody>
                {ledger.map((l: any, i: number) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "6px 10px", fontSize: 12, borderBottom: "1px solid #f0f0f0" }}>{l.entry_date?.slice(0, 10)}</td>
                    <td style={{ padding: "6px 10px", fontSize: 12, fontFamily: "monospace", borderBottom: "1px solid #f0f0f0" }}>{l.entry_no}</td>
                    <td style={{ padding: "6px 10px", fontSize: 12, borderBottom: "1px solid #f0f0f0" }}>{l.account_code} {l.account_name}</td>
                    <td style={{ padding: "6px 10px", fontSize: 12, borderBottom: "1px solid #f0f0f0" }}>{l.line_desc || l.entry_desc || "-"}</td>
                    <td style={{ padding: "6px 10px", fontSize: 12, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{+l.debit > 0 ? Number(l.debit).toLocaleString() : ""}</td>
                    <td style={{ padding: "6px 10px", fontSize: 12, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{+l.credit > 0 ? Number(l.credit).toLocaleString() : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </>)}

        {/* ====== Income Statement ====== */}
        {tab === "income" && (<>
          <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13 }}>年度:</span>
            <input type="number" style={{ width: 80, height: 32, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px", textAlign: "center" }} value={incomeYear} onChange={e => setIncomeYear(+e.target.value)} />
          </div>
          {income ? (
            <div style={{ ...cb, padding: 24 }}>
              <h3 style={{ textAlign: "center", margin: "0 0 20px" }}>損益表 — {incomeYear}年度</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr><td colSpan={2} style={{ padding: "8px 12px", fontSize: 14, fontWeight: 600, borderBottom: "1px solid #e8e8e8" }}>收入</td></tr>
                  <tr><td style={{ padding: "8px 24px", fontSize: 13 }}>銷貨收入</td><td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right" }}>{Number(income.total_revenue).toLocaleString()}</td></tr>
                  <tr><td style={{ padding: "4px 24px" }} colSpan={2}><hr /></td></tr>
                  <tr><td colSpan={2} style={{ padding: "8px 12px", fontSize: 14, fontWeight: 600, borderBottom: "1px solid #e8e8e8" }}>費用</td></tr>
                  {income.expenses?.map((e: any) => (
                    <tr key={e.account_code}><td style={{ padding: "6px 24px", fontSize: 13 }}>{e.account_code} {e.account_name}</td><td style={{ padding: "6px 12px", fontSize: 13, textAlign: "right" }}>{Number(e.total).toLocaleString()}</td></tr>
                  ))}
                  <tr><td style={{ padding: "4px 24px" }} colSpan={2}><hr /></td></tr>
                  <tr style={{ background: "#fafafa", fontWeight: 600 }}>
                    <td style={{ padding: "8px 12px", fontSize: 14 }}>本期損益</td>
                    <td style={{ padding: "8px 12px", fontSize: 14, textAlign: "right", color: income.net_income >= 0 ? "#52c41a" : "#ff4d4f" }}>{Number(income.net_income).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div>}
        </>)}

        {/* ====== Balance Sheet ====== */}
        {tab === "balance" && (
          bs ? (<div style={{ ...cb, padding: 24 }}>
            <h3 style={{ textAlign: "center", margin: "0 0 20px" }}>資產負債表</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", color: "#1890ff" }}>資產</h4>
                {bs.assets?.map((a: any) => (
                  <div key={a.account_code} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, borderBottom: "1px dotted #f0f0f0" }}>
                    <span>{a.account_name}</span><span>{Number(a.balance).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, fontWeight: 600, borderTop: "2px solid #1890ff", marginTop: 4 }}>
                  <span>資產總計</span><span>{Number(bs.total_assets).toLocaleString()}</span>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", color: "#ff4d4f" }}>負債</h4>
                {bs.liabilities?.map((a: any) => (
                  <div key={a.account_code} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, borderBottom: "1px dotted #f0f0f0" }}>
                    <span>{a.account_name}</span><span>{Number(a.balance).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, fontWeight: 600, borderTop: "2px solid #ff4d4f", marginTop: 4 }}>
                  <span>負債總計</span><span>{Number(bs.total_liabilities).toLocaleString()}</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 600, margin: "16px 0 8px", color: "#722ed1" }}>權益</h4>
                {bs.equity?.map((a: any) => (
                  <div key={a.account_code} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, borderBottom: "1px dotted #f0f0f0" }}>
                    <span>{a.account_name}</span><span>{Number(a.balance).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, fontWeight: 600, borderTop: "2px solid #722ed1", marginTop: 4 }}>
                  <span>負債+權益總計</span><span>{Number(bs.total_liabilities + bs.total_equity).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>) : <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div>
        )}

        {/* ====== AP ====== */}
        {tab === "cashbook" && (<>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input type="date" value={pcStartDate} onChange={e => setPcStartDate(e.target.value)} style={{ height: 36, padding: "0 8px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13 }} />
              <span style={{ color: "#999" }}>~</span>
              <input type="date" value={pcEndDate} onChange={e => setPcEndDate(e.target.value)} style={{ height: 36, padding: "0 8px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13 }} />
              <button onClick={fetchPettyCash} style={{ height: 36, padding: "0 16px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", fontSize: 13, cursor: "pointer" }}>查詢</button>
            </div>
            <button onClick={() => { setEditingAcct(null); setAcctForm({ account_code: "", account_name: "", account_type: "CASHBOOK", description: "" }); setShowCashbookAcctModal(true); }} style={{ ...bp, background: "#fff", color: "#1890ff", border: "1px solid #1890ff" }}>管理科目</button>
            <button onClick={() => { setEditingPc(null); setPcForm({ transaction_date: new Date().toISOString().slice(0, 10), type: "EXPENSE", amount: "", category: "雜項", description: "" }); setShowPcModal(true); }} style={bp}>+ 新增收支</button>
          </div>
          {pcLoading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : (
            <div>
              <div style={{ display: "flex", gap: 32, marginBottom: 16, padding: "16px 20px", background: "#fafafa", borderRadius: 6, border: "1px solid #f0f0f0" }}>
                <div><span style={{ fontSize: 12, color: "#888" }}>前期結餘</span><div style={{ fontSize: 20, fontWeight: 600 }}>{pcList.opening_balance?.toLocaleString() ?? 0}</div></div>
                <div><span style={{ fontSize: 12, color: "#888" }}>本期收入</span><div style={{ fontSize: 20, fontWeight: 600, color: "#52c41a" }}>{pcList.items?.filter((r: any) => r.type === "INCOME").reduce((s: number, r: any) => s + r.amount, 0).toLocaleString()}</div></div>
                <div><span style={{ fontSize: 12, color: "#888" }}>本期支出</span><div style={{ fontSize: 20, fontWeight: 600, color: "#ff4d4f" }}>{pcList.items?.filter((r: any) => r.type === "EXPENSE").reduce((s: number, r: any) => s + r.amount, 0).toLocaleString()}</div></div>
                <div><span style={{ fontSize: 12, color: "#888" }}>目前結餘</span><div style={{ fontSize: 20, fontWeight: 600, color: "#1890ff" }}>{(pcList.items?.length > 0 ? pcList.items[pcList.items.length - 1].running_balance : pcList.opening_balance)?.toLocaleString() ?? 0}</div></div>
              </div>
              <div style={cb}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ background: "#fafafa" }}>
                    <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>日期</th>
                    <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>類型</th>
                    <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>類別</th>
                    <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>金額</th>
                    <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>餘額</th>
                    <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>摘要</th>
                    <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>操作</th>
                  </tr></thead>
                  <tbody>
                    {pcList.items?.length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#999" }}>尚無收支記錄</td></tr> : pcList.items?.map((r: any, i: number) => (
                      <tr key={r.pc_id || i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "6px 10px", fontSize: 12, borderBottom: "1px solid #f0f0f0" }}>{r.transaction_date?.slice(0, 10)}</td>
                        <td style={{ padding: "6px 10px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 2, background: r.type === "INCOME" ? "#f6ffed" : "#fff1f0", color: r.type === "INCOME" ? "#52c41a" : "#ff4d4f" }}>{r.type === "INCOME" ? "收入" : "支出"}</span>
                        </td>
                        <td style={{ padding: "6px 10px", fontSize: 12, borderBottom: "1px solid #f0f0f0" }}>{r.category}</td>
                        <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", fontWeight: 500, color: r.type === "INCOME" ? "#52c41a" : "#ff4d4f", borderBottom: "1px solid #f0f0f0" }}>{r.type === "INCOME" ? "+" : "-"}{r.amount.toLocaleString()}</td>
                        <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", fontFamily: "monospace", borderBottom: "1px solid #f0f0f0" }}>{r.running_balance.toLocaleString()}</td>
                        <td style={{ padding: "6px 10px", fontSize: 12, color: "#666", borderBottom: "1px solid #f0f0f0" }}>{r.description || "-"}</td>
                        <td style={{ padding: "4px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                          <button onClick={() => { setEditingPc(r); setPcForm({ transaction_date: r.transaction_date?.slice(0, 10), type: r.type, amount: String(r.amount), category: r.category, description: r.description || "" }); setShowPcModal(true); }} style={{ height: 24, padding: "0 8px", marginRight: 4, borderRadius: 3, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 11, cursor: "pointer" }}>編輯</button>
                          <button onClick={() => deletePettyCash(r.pc_id)} style={{ height: 24, padding: "0 8px", borderRadius: 3, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 11, cursor: "pointer" }}>刪除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {showPcModal && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowPcModal(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 420 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>{editingPc ? "編輯收支" : "新增收支"}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>日期</div><input type="date" value={pcForm.transaction_date} onChange={e => setPcForm({ ...pcForm, transaction_date: e.target.value })} style={si} /></div>
                <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>類型</div>
                  <select value={pcForm.type} onChange={e => setPcForm({ ...pcForm, type: e.target.value })} style={si}>
                    <option value="INCOME">收入</option>
                    <option value="EXPENSE">支出</option>
                  </select>
                </div>
                <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>金額</div><input type="number" value={pcForm.amount} onChange={e => setPcForm({ ...pcForm, amount: e.target.value })} style={si} min="0" /></div>
                <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>類別</div>
                  <select value={pcForm.category} onChange={e => setPcForm({ ...pcForm, category: e.target.value })} style={si}>
                    {cashbookAccounts.map((a: any) => <option key={a.account_id} value={a.account_name}>{a.account_code} {a.account_name}</option>)}
                  </select>
                </div>
                <div><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>摘要</div><input value={pcForm.description} onChange={e => setPcForm({ ...pcForm, description: e.target.value })} style={si} placeholder="備註說明" /></div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowPcModal(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={savePettyCash} style={bp}>{editingPc ? "更新" : "新增"}</button>
              </div>
            </div>
          </div>)}
        </>)}

        {tab === "bank" && (<>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 24, padding: "12px 16px", background: "#fafafa", borderRadius: 6, border: "1px solid #f0f0f0" }}>
              <div><span style={{ fontSize: 11, color: "#888" }}>銀行總額</span><div style={{ fontSize: 16, fontWeight: 600 }}>{bankStats.total?.toLocaleString()}</div></div>
              <div><span style={{ fontSize: 11, color: "#888" }}>已對帳</span><div style={{ fontSize: 16, fontWeight: 600, color: "#52c41a" }}>{bankStats.reconciled_total?.toLocaleString()}</div></div>
              <div><span style={{ fontSize: 11, color: "#888" }}>未對帳</span><div style={{ fontSize: 16, fontWeight: 600, color: "#fa8c16" }}>{bankStats.unreconciled_total?.toLocaleString()}</div></div>
            </div>
            <button onClick={() => { setEditingBank(null); setBankForm({ transaction_date: new Date().toISOString().slice(0, 10), type: "DEPOSIT", amount: "", description: "", bank_reference: "", note: "" }); setShowBankModal(true); }} style={bp}>+ 新增銀行明細</button>
          </div>
          {bankLoading ? <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div> : bankItems.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: "#999" }}>尚無銀行明細，請手動新增或匯入銀行對帳單</div> : (
            <div style={cb}><table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#fafafa" }}>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>日期</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>銀行參考號</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>摘要</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>類型</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>金額</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>對帳</th>
                <th style={{ padding: "8px 10px", fontSize: 11, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>操作</th>
              </tr></thead>
              <tbody>
                {bankItems.map((b: any, i: number) => (
                  <tr key={b.statement_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", opacity: b.is_reconciled ? 0.6 : 1 }}>
                    <td style={{ padding: "6px 8px", fontSize: 12, borderBottom: "1px solid #f0f0f0" }}>{b.transaction_date?.slice(0, 10)}</td>
                    <td style={{ padding: "6px 8px", fontSize: 11, fontFamily: "monospace", borderBottom: "1px solid #f0f0f0" }}>{b.bank_reference || "-"}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12, borderBottom: "1px solid #f0f0f0" }}>{b.description || "-"}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                      <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 2, background: b.type === "DEPOSIT" ? "#f6ffed" : "#fff1f0", color: b.type === "DEPOSIT" ? "#52c41a" : "#ff4d4f" }}>{b.type === "DEPOSIT" ? "存入" : "支出"}</span>
                    </td>
                    <td style={{ padding: "6px 8px", fontSize: 12, textAlign: "right", color: b.type === "DEPOSIT" ? "#52c41a" : "#ff4d4f", fontWeight: 500, borderBottom: "1px solid #f0f0f0" }}>{b.type === "DEPOSIT" ? "+" : "-"}{Number(b.amount).toLocaleString()}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                      <button onClick={() => toggleReconcile(b.statement_id)} style={{ height: 24, padding: "0 10px", borderRadius: 3, border: "1px solid " + (b.is_reconciled ? "#d9d9d9" : "#52c41a"), background: b.is_reconciled ? "#f5f5f5" : "#fff", color: b.is_reconciled ? "#999" : "#52c41a", fontSize: 11, cursor: "pointer" }}>{b.is_reconciled ? "已對" : "對帳"}</button>
                    </td>
                    <td style={{ padding: "4px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                      <button onClick={() => { setEditingBank(b); setBankForm({ transaction_date: b.transaction_date?.slice(0,10), type: b.type, amount: String(b.amount), description: b.description||"", bank_reference: b.bank_reference||"", note: b.note||"" }); setShowBankModal(true); }} style={{ height: 24, padding: "0 6px", marginRight: 4, borderRadius: 3, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 11, cursor: "pointer" }}>編輯</button>
                      <button onClick={() => deleteBank(b.statement_id)} style={{ height: 24, padding: "0 6px", borderRadius: 3, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 11, cursor: "pointer" }}>刪除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
          {showBankModal && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowBankModal(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 420 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>{editingBank ? "編輯銀行明細" : "新增銀行明細"}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div><div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>日期</div><input type="date" value={bankForm.transaction_date} onChange={e => setBankForm({...bankForm, transaction_date: e.target.value})} style={si} /></div>
                <div><div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>類型</div><select value={bankForm.type} onChange={e => setBankForm({...bankForm, type: e.target.value})} style={si}><option value="DEPOSIT">存入</option><option value="WITHDRAWAL">支出</option></select></div>
                <div><div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>金額</div><input type="number" value={bankForm.amount} onChange={e => setBankForm({...bankForm, amount: e.target.value})} style={si} min="0" step="0.01" /></div>
                <div><div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>銀行參考號</div><input value={bankForm.bank_reference} onChange={e => setBankForm({...bankForm, bank_reference: e.target.value})} style={si} placeholder="支票號碼或交易編號" /></div>
                <div><div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>摘要</div><input value={bankForm.description} onChange={e => setBankForm({...bankForm, description: e.target.value})} style={si} /></div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                <button onClick={() => setShowBankModal(false)} style={{ height: 32, padding: "0 16px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" }}>取消</button>
                <button onClick={saveBank} style={bp}>{editingBank ? "更新" : "新增"}</button>
              </div>
            </div>
          </div>)}
        </>)}

        {tab === "ap" && (<>
          <div style={{ marginBottom: 12 }}>
            <select value={apFilter} onChange={e => { setApFilter(e.target.value); setApPage(1); }} style={{ height: 32, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px", minWidth: 120 }}>
              <option value="">全部</option><option value="UNPAID">未付</option><option value="PARTIAL">部分付款</option><option value="PAID">已付清</option>
            </select>
          </div>
          {apLoading ? <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div> : apList.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: "#999" }}>尚無應付帳款</div> : (
            <div style={cb}><table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#fafafa" }}>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>供應商</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>採購單</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>應付金額</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>已付</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>到期日</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>狀態</th>
                <th style={{ padding: "8px 12px", fontSize: 12, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>操作</th>
              </tr></thead>
              <tbody>
                {apList.map((ap: any, i: number) => (
                  <tr key={ap.ap_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "6px 10px", fontSize: 13, borderBottom: "1px solid #f0f0f0" }}>{ap.supplier_name}</td>
                    <td style={{ padding: "6px 10px", fontSize: 12, fontFamily: "monospace", borderBottom: "1px solid #f0f0f0" }}>{ap.po_no || "-"}</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{Number(ap.amount).toLocaleString()}</td>
                    <td style={{ padding: "6px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>{Number(ap.paid_amount).toLocaleString()}</td>
                    <td style={{ padding: "6px 10px", fontSize: 12, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>{ap.due_date?.slice(0, 10)}</td>
                    <td style={{ padding: "6px 10px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 2, background: ap.status === "PAID" ? "#f6ffed" : ap.status === "PARTIAL" ? "#fff7e6" : "#fff1f0", color: ap.status === "PAID" ? "#52c41a" : ap.status === "PARTIAL" ? "#fa8c16" : "#ff4d4f" }}>{ap.status === "PAID" ? "已付" : ap.status === "PARTIAL" ? "部分" : "未付"}</span>
                    </td>
                    <td style={{ padding: "4px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                      {ap.status !== "PAID" && <button onClick={() => { setPayAp(ap); setPayAmount(Number(ap.amount) - Number(ap.paid_amount)); setShowPayModal(true); }} style={{ height: 24, padding: "0 8px", borderRadius: 3, border: "1px solid #52c41a", background: "#fff", color: "#52c41a", fontSize: 11, cursor: "pointer" }}>付款</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
          {showPayModal && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowPayModal(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 380 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>記錄付款</h3>
              <div style={{ fontSize: 13, marginBottom: 8 }}>供應商: {payAp?.supplier_name}</div>
              <div style={{ fontSize: 13, marginBottom: 8 }}>應付: {Number(payAp?.amount).toLocaleString()} | 已付: {Number(payAp?.paid_amount).toLocaleString()} | 餘額: {(Number(payAp?.amount) - Number(payAp?.paid_amount)).toLocaleString()}</div>
              <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>付款金額</div><input type="number" style={si} value={payAmount} onChange={e => setPayAmount(+e.target.value)} /></div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button onClick={() => setShowPayModal(false)} style={{ height: 32, padding: "0 16px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" }}>取消</button>
                <button onClick={doPay} style={{ ...bp, background: "#52c41a" }}>確認付款</button>
              </div>
            </div>
          </div>)}
        </>)}
      </div>
    </DashboardLayout>
  );
}
