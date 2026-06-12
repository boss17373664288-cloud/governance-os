"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";
import { downloadCsv } from "../../lib/download";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const ts = (bg: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color, whiteSpace: "nowrap" });
const bp: React.CSSProperties = { height: 36, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const bgBtn: React.CSSProperties = { ...bp, background: "#52c41a" };
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" };
const sl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const modalBg: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalCard: React.CSSProperties = { background: "#fff", borderRadius: 8, padding: 24, width: 480, maxHeight: "80vh", overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" };
const actionBtn: React.CSSProperties = { height: 28, padding: "0 10px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer" };

const statusLabels: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: "未收款", bg: "#fff7e6", color: "#fa8c16" },
  PARTIAL: { label: "部分收款", bg: "#e6f7ff", color: "#1890ff" },
  PAID: { label: "已結清", bg: "#f6ffed", color: "#52c41a" },
};

const agingTabs = [
  { key: "", label: "全部" },
  { key: "current", label: "未逾期" },
  { key: "1_30", label: "逾期 1-30 天" },
  { key: "31_60", label: "逾期 31-60 天" },
  { key: "61_90", label: "逾期 61-90 天" },
  { key: "90_plus", label: "逾期 90+ 天" },
  { key: "paid", label: "已結清" },
];

export default function FinancePage() {
  const [dashboard, setDashboard] = useState<any>({});
  const [aging, setAging] = useState<any>({});
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [agingTab, setAgingTab] = useState("");
  const [page, setPage] = useState(1);

  // Payment modal
  const [showPayment, setShowPayment] = useState(false);
  const [payAr, setPayAr] = useState<any>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payRef, setPayRef] = useState("");
  const [paySaving, setPaySaving] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get("/finance/dashboard"),
      api.get("/finance/ar/aging"),
      api.get("/finance/ar/list", { params: { page, page_size: 20, search, aging: agingTab } }),
    ]).then(([d, a, l]: any[]) => {
      setDashboard(d.data || {});
      setAging(a.data || {});
      setItems(l.data?.items || []);
      setPagination(l.data?.pagination || {});
    }).finally(() => setLoading(false));
  }, [page, search, agingTab]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openPayment = (ar: any) => {
    setPayAr(ar);
    setPayAmount(Number(ar.amount) - Number(ar.paid_amount));
    setPayRef("");
    setShowPayment(true);
  };

  const doPayment = async () => {
    if (!payAr || payAmount <= 0) { alert("請填寫有效的收款金額"); return; }
    const remaining = Number(payAr.amount) - Number(payAr.paid_amount);
    if (payAmount > remaining) { alert("收款金額不可超過應收餘額 NT$ " + remaining.toLocaleString()); return; }
    setPaySaving(true);
    try {
      await api.post("/finance/payment", { ar_id: payAr.ar_id, amount: payAmount, reference_no: payRef });
      alert("收款核銷成功"); setShowPayment(false); fetchAll();
    } catch (e: any) { alert(e?.response?.data?.message || "收款失敗"); }
    finally { setPaySaving(false); }
  };

  const formatNT = (v: any) => "NT$ " + (Number(v) || 0).toLocaleString();

  const agingBars = [
    { label: "未逾期", value: aging.current || 0, color: "#52c41a" },
    { label: "逾期 1-30 天", value: aging.overdue_1_30 || 0, color: "#faad14" },
    { label: "逾期 31-60 天", value: aging.overdue_31_60 || 0, color: "#fa8c16" },
    { label: "逾期 61-90 天", value: aging.overdue_61_90 || 0, color: "#ff7a45" },
    { label: "逾期 90+ 天", value: aging.overdue_90_plus || 0, color: "#ff4d4f" },
  ];
  const maxAging = Math.max(...agingBars.map(b => b.value), 1);

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a2e" }}>財務管理</h2>
            <button onClick={() => downloadCsv("/api/v1/system/export/finance-ar", "應收帳款.csv")} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "1px solid #52c41a", background: "#fff", color: "#52c41a", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>📥 導出 CSV</button>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#999" }}>應收帳款管理、收款核銷與帳齡分析</p>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          {[
            { label: "應收總額", value: formatNT(dashboard.total_ar), color: "#1890ff" },
            { label: "已收金額", value: formatNT(dashboard.total_paid), color: "#52c41a" },
            { label: "未收餘額", value: formatNT(dashboard.total_outstanding), color: "#fa8c16" },
            { label: "逾期金額", value: formatNT(dashboard.overdue_amount), color: "#ff4d4f" },
          ].map((s, i) => (
            <div key={i} style={{ ...cb, padding: "16px 20px", borderLeft: "3px solid " + s.color }}>
              <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Aging Bar Chart */}
        <div style={{ ...cb, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#555", marginBottom: 16 }}>應收帳齡分析</div>
          <div style={{ display: "grid", gap: 8 }}>
            {agingBars.map((b, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "#666", textAlign: "right" }}>{b.label}</span>
                <div style={{ height: 22, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: maxAging > 0 ? (b.value / maxAging * 100) + "%" : "0%", background: b.color, borderRadius: 3, transition: "width 0.3s", minWidth: b.value > 0 ? 4 : 0 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: b.color }}>{formatNT(b.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search & Tabs */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <input style={{ ...si, width: 260 }} placeholder="搜尋客戶/訂單..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ display: "flex", gap: 0, marginBottom: 16, flexWrap: "wrap" }}>
          {agingTabs.map((t) => (
            <button key={t.key} onClick={() => { setAgingTab(t.key); setPage(1); }}
              style={{
                height: 34, padding: "0 14px", fontSize: 12, fontWeight: agingTab === t.key ? 600 : 400,
                border: "1px solid " + (agingTab === t.key ? "#1890ff" : "#d9d9d9"),
                background: agingTab === t.key ? "#e6f7ff" : "#fff",
                color: agingTab === t.key ? "#1890ff" : "#666",
                cursor: "pointer", marginRight: -1, position: "relative" as any, zIndex: agingTab === t.key ? 1 : 0,
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無應收帳款</div>
        ) : (
          <div style={cb}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>訂單編號</th>
                    <th style={th}>客戶名稱</th>
                    <th style={th}>應收金額</th>
                    <th style={th}>已收金額</th>
                    <th style={th}>未收餘額</th>
                    <th style={th}>到期日</th>
                    <th style={th}>逾期天數</th>
                    <th style={th}>狀態</th>
                    <th style={th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((ar: any, i: number) => (
                    <tr key={ar.ar_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ ...td, fontWeight: 500, color: "#1890ff" }}>{ar.order_no}</td>
                      <td style={td}>{ar.customer_code} {ar.customer_name}</td>
                      <td style={{ ...td, fontWeight: 500 }}>{formatNT(ar.amount)}</td>
                      <td style={{ ...td, color: "#52c41a" }}>{formatNT(ar.paid_amount)}</td>
                      <td style={{ ...td, fontWeight: 600, color: Number(ar.amount) - Number(ar.paid_amount) > 0 ? "#fa8c16" : "#52c41a" }}>
                        {formatNT(Number(ar.amount) - Number(ar.paid_amount))}
                      </td>
                      <td style={{ ...td, color: ar.is_overdue ? "#ff4d4f" : "#333" }}>{ar.due_date ? ar.due_date.slice(0, 10) : "-"}</td>
                      <td style={td}>
                        {ar.days_overdue > 0 ? (
                          <span style={ar.days_overdue > 30 ? ts("#fff1f0", "#ff4d4f") : ts("#fff7e6", "#fa8c16")}>{ar.days_overdue} 天</span>
                        ) : <span style={{ color: "#52c41a", fontSize: 12 }}>未逾期</span>}
                      </td>
                      <td style={td}>
                        <span style={ts(statusLabels[ar.status]?.bg || "#f0f0f0", statusLabels[ar.status]?.color || "#666")}>
                          {statusLabels[ar.status]?.label || ar.status}
                        </span>
                      </td>
                      <td style={td}>
                        {ar.status !== "PAID" && (
                          <button onClick={() => openPayment(ar)} style={{ ...actionBtn, color: "#52c41a", borderColor: "#52c41a" }}>收款核銷</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 12, color: "#999" }}>共 {pagination.total} 筆，第 {pagination.page}/{pagination.total_pages || 1} 頁</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ ...actionBtn, opacity: page <= 1 ? 0.4 : 1 }}>上一頁</button>
                <button disabled={page >= pagination.total_pages} onClick={() => setPage(page + 1)} style={{ ...actionBtn, opacity: page >= pagination.total_pages ? 0.4 : 1 }}>下一頁</button>
              </div>
            </div>
          </div>
        )}

        {/* ====== Payment Modal ====== */}
        {showPayment && payAr && (
          <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowPayment(false); }}>
            <div style={modalCard}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>收款核銷</h3>
              <div style={{ display: "grid", gap: 12, marginBottom: 20, padding: "12px 16px", background: "#fafafa", borderRadius: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>訂單編號</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{payAr.order_no}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>客戶</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{payAr.customer_code} {payAr.customer_name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>應收金額</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{formatNT(payAr.amount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>已收金額</span>
                  <span style={{ fontSize: 13, color: "#52c41a" }}>{formatNT(payAr.paid_amount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>未收餘額</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fa8c16" }}>{formatNT(Number(payAr.amount) - Number(payAr.paid_amount))}</span>
                </div>
              </div>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={sl}>收款金額 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={si} type="number" min={0.01} step="0.01" value={payAmount}
                    max={Number(payAr.amount) - Number(payAr.paid_amount)}
                    onChange={e => setPayAmount(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <div style={sl}>參考編號（選填）</div>
                  <input style={si} placeholder="銀行轉帳編號/支票號碼" value={payRef} onChange={e => setPayRef(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowPayment(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={doPayment} disabled={paySaving} style={{ ...bgBtn, opacity: paySaving ? 0.6 : 1 }}>{paySaving ? "處理中..." : "確認收款"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}