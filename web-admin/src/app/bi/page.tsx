"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

const S = {
  statCards: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 16 } as React.CSSProperties,
  statCard: { background: "#fff", borderRadius: 4, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" } as React.CSSProperties,
  statLabel: { fontSize: 13, color: "#999", marginBottom: 4 } as React.CSSProperties,
  statValue: { fontSize: 24, fontWeight: 600, color: "#333" } as React.CSSProperties,
  statIcon: (bg: string, clr: string) => ({ width: 36, height: 36, borderRadius: "50%", background: bg, color: clr, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }) as React.CSSProperties,
  section: { background: "#fff", borderRadius: 4, padding: 20, boxShadow: "0 1px 2px rgba(0,0,0,0.03)", marginBottom: 16 } as React.CSSProperties,
  sectionTitle: { fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16 } as React.CSSProperties,
  dataLabel: { fontSize: 12, color: "#999", marginBottom: 2 } as React.CSSProperties,
  dataVal: { fontSize: 18, fontWeight: 600, color: "#333" } as React.CSSProperties,
  tableWrap: { background: "#fff", borderRadius: 4, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" } as React.CSSProperties,
  tableHeader: { padding: "12px 16px", borderBottom: "1px solid #f0f0f0", fontSize: 14, fontWeight: 600, color: "#333" } as React.CSSProperties,
  th: { padding: "10px 12px", textAlign: "left" as const, fontSize: 13, fontWeight: 600, color: "#333", background: "#fafafa", borderBottom: "1px solid #f0f0f0" },
  td: { padding: "10px 12px", fontSize: 13, color: "#666", borderBottom: "1px solid #f0f0f0" },
  tag: (bg: string, clr: string) => ({ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color: clr }) as React.CSSProperties,
  dot: (clr: string) => ({ width: 6, height: 6, borderRadius: "50%", background: clr, display: "inline-block" }) as React.CSSProperties,
};

export default function BiPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [orderAnalytics, setOrderAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/bi/dashboard/ceo").catch(() => ({ data: null })),
      api.get("/bi/analytics/orders", { params: { groupBy: "day" } }).catch(() => ({ data: null })),
    ]).then(([ceo, orders]: any[]) => {
      setDashboard(ceo?.data || ceo || {});
      setOrderAnalytics(orders?.data || orders || {});
    }).finally(() => setLoading(false));
  }, []);

  const realtime = dashboard?.realtime || dashboard || {};
  const t1 = dashboard?.t1 || {};

  if (loading) return <DashboardLayout><div style={{ textAlign: "center", padding: 80, color: "#999", fontSize: 14 }}>載入中...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      {/* 統計卡片 */}
      <div style={S.statCards}>
        {[
          { label: "今日訂單", value: realtime.today_orders ?? 0, bc: "#1890ff", bg: "#e6f7ff", clr: "#1890ff", emoji: "📦", path: "/orders", filter: "today" },
          { label: "待審批", value: realtime.pending_approval ?? 0, bc: "#fa8c16", bg: "#fff7e6", clr: "#fa8c16", emoji: "⏳", path: "/orders", filter: "pending" },
          { label: "本月營收", value: "NT$ " + ((t1?.month_revenue || 0) / 1000).toFixed(0) + "K", bc: "#52c41a", bg: "#f6ffed", clr: "#52c41a", emoji: "📈" },
          { label: "逾期應收", value: realtime.overdue_ar_count ?? 0, bc: "#f5222d", bg: "#fff1f0", clr: "#f5222d", emoji: "💵", path: "/finance" },
          { label: "活躍召回", value: realtime.active_recalls ?? 0, bc: "#722ed1", bg: "#f9f0ff", clr: "#722ed1", emoji: "⚠️", path: "/recall" },
        ].map((s, i) => (
          <div key={i} onClick={() => s.path ? router.push(s.path) : null} style={{ ...S.statCard, borderLeft: "3px solid " + s.bc, cursor: s.path ? "pointer" : "default", transition: "box-shadow 0.2s" }} onMouseEnter={e => { if (s.path) e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }} onMouseLeave={e => { if (s.path) e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.03)"; }}>
            <div><div style={S.statLabel}>{s.label}</div><div style={S.statValue}>{s.value}</div></div>
            <div style={S.statIcon(s.bg, s.clr)}>{s.emoji}</div>
          </div>
        ))}
      </div>

      {/* 每日營收 + 摘要 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={S.tableWrap}>
          <div style={S.tableHeader}>每日營收明細（本月）</div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {orderAnalytics?.series?.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={S.th}>日期</th><th style={{ ...S.th, textAlign: "right" }}>訂單數</th><th style={{ ...S.th, textAlign: "right" }}>營收金額</th>
                </tr></thead>
                <tbody>
                  {orderAnalytics.series.map((d: any, i: number) => {
                    const prev = i > 0 ? orderAnalytics.series[i-1].revenue : d.revenue;
                    const diff = d.revenue - prev;
                    const isUp = diff >= 0;
                    return (
                      <tr key={i}>
                        <td style={{ ...S.td, fontWeight: 500, color: "#333" }}>{d.date}</td>
                        <td style={{ ...S.td, textAlign: "right" }}>{d.orders}</td>
                        <td style={{ ...S.td, textAlign: "right", fontWeight: 600, color: isUp ? "#52c41a" : "#f5222d", fontFamily: "monospace" }}>
                          NT$ {d.revenue?.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: "#999", fontSize: 13 }}>尚無本月營收數據</div>
            )}
          </div>
        </div>

        {/* 營收概覽 */}
        <div style={S.section}>
          <div style={S.sectionTitle}>營收概覽</div>
          <div style={{ marginBottom: 16 }}><div style={S.dataLabel}>本月營收</div><div style={S.dataVal}>NT$ {(t1?.month_revenue || 0).toLocaleString()}</div></div>
          <div style={{ marginBottom: 16 }}><div style={S.dataLabel}>本月成本</div><div style={S.dataVal}>NT$ {(t1?.month_cost || 0).toLocaleString()}</div></div>
          <div style={{ marginBottom: 16 }}><div style={S.dataLabel}>毛利</div><div style={{ ...S.dataVal, color: "#52c41a" }}>NT$ {((t1?.month_revenue || 0) - (t1?.month_cost || 0)).toLocaleString()}</div></div>
          <div style={{ marginBottom: 16 }}><div style={S.dataLabel}>毛利率</div><div style={S.dataVal}>{t1?.month_revenue > 0 ? ((1 - (t1?.month_cost || 0) / t1.month_revenue) * 100).toFixed(1) : 0}%</div></div>
          <div style={{ marginBottom: 16 }}><div style={S.dataLabel}>本月訂單</div><div style={S.dataVal}>{realtime.month_orders ?? 0}</div></div>
          <div><div style={S.dataLabel}>總訂單營收</div><div style={S.dataVal}>NT$ {((orderAnalytics?.total_revenue || 0)).toLocaleString()}</div></div>
        </div>
      </div>

      {/* 風險預警 */}
      <div style={S.tableWrap}>
        <div style={S.tableHeader}>風險預警</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={S.th}>預警項目</th><th style={S.th}>風險等級</th><th style={S.th}>數量</th><th style={{ ...S.th, textAlign: "right" }}>操作</th>
          </tr></thead>
          <tbody>
            {[
              { label: "逾期應收", count: realtime.overdue_ar_count || 0, level: "高風險", clr: "#f5222d", bg: "#fff1f0", path: "/finance" },
              { label: "待審批訂單", count: realtime.pending_approval || 0, level: realtime.pending_approval > 5 ? "中風險" : "低風險", clr: realtime.pending_approval > 5 ? "#fa8c16" : "#52c41a", bg: realtime.pending_approval > 5 ? "#fff7e6" : "#f6ffed", path: "/orders" },
              { label: "活躍召回", count: realtime.active_recalls || 0, level: realtime.active_recalls > 0 ? "中風險" : "低風險", clr: realtime.active_recalls > 0 ? "#fa8c16" : "#52c41a", bg: realtime.active_recalls > 0 ? "#fff7e6" : "#f6ffed", path: "/recall" },
            ].map((r, i) => (
              <tr key={i}>
                <td style={{ ...S.td, fontWeight: 500, color: "#333" }}>{r.label}</td>
                <td style={S.td}><span style={S.tag(r.bg, r.clr)}><span style={S.dot(r.clr)} />{r.level}</span></td>
                <td style={{ ...S.td, fontWeight: 600, color: r.clr }}>{r.count}</td>
                <td style={{ ...S.td, textAlign: "right" }}><span onClick={() => router.push(r.path)} style={{ color: "#1890ff", fontSize: 12, cursor: "pointer" }}>查看詳情 →</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}