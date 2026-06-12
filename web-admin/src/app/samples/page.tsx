"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const PURPOSE_MAP: Record<string, string> = {
  PRODUCT_TEST: "產品測試", CLINICAL_TRIAL: "臨床試驗",
  PROMOTION: "推廣活動", COMPETITOR_ANALYSIS: "競品分析",
};

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: "草稿", bg: "#f5f5f5", color: "#999" },
  SUBMITTED: { label: "已提交", bg: "#e6f7ff", color: "#1890ff" },
  MANAGER_APPROVED: { label: "主管已審", bg: "#fff7e6", color: "#fa8c16" },
  QA_RELEASED: { label: "QA已放行", bg: "#f6ffed", color: "#52c41a" },
  SHIPPED: { label: "已出庫", bg: "#e6fffb", color: "#13c2c2" },
  FEEDBACK_DONE: { label: "已完成", bg: "#f0f5ff", color: "#2f54eb" },
  REJECTED: { label: "已退回", bg: "#fff1f0", color: "#ff4d4f" },
};

const cardBox: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const tagStyle = (bg: string, color: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500,
  padding: "2px 8px", borderRadius: 2, background: bg, color, whiteSpace: "nowrap",
});

export default function SamplesPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get("/sample-requests", { params: { page, page_size: 15, status: statusFilter || undefined } })
      .then((res: any) => { setItems(res.data.items || []); setTotal(res.data.pagination?.total || 0); })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#333", margin: 0 }}>樣品/打板管理</h1>
        <button onClick={() => router.push("/samples/new")}
          style={{ height: 32, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          + 新增打板申請
        </button>
      </div>

      {/* ====== Filters ====== */}
      <div style={{ ...cardBox, padding: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>狀態篩選：</span>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ height: 32, padding: "0 8px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", background: "#fff" }}>
          <option value="">全部</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "#999", whiteSpace: "nowrap", marginLeft: "auto" }}>共 {total} 筆</span>
      </div>

      {/* ====== Table ====== */}
      <div style={cardBox}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>打板編號</th>
              <th style={th}>客戶</th>
              <th style={th}>產品</th>
              <th style={th}>打板目的</th>
              <th style={{ ...th, textAlign: "center" }}>數量</th>
              <th style={{ ...th, textAlign: "center" }}>狀態</th>
              <th style={th}>建立時間</th>
              <th style={{ ...th, textAlign: "center" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ ...td, textAlign: "center", padding: 48, color: "#999" }}>載入中...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} style={{ ...td, textAlign: "center", padding: 48, color: "#999" }}>暫無打板申請</td></tr>
            ) : items.map((s: any) => {
              const st = STATUS_MAP[s.status] || { label: s.status, bg: "#f5f5f5", color: "#999" };
              return (
                <tr key={s.sample_id} style={{ cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                  onClick={() => router.push("/samples/" + s.sample_id)}>
                  <td style={{ ...td, fontFamily: "monospace", fontWeight: 500, whiteSpace: "nowrap" }}>{s.sample_no}</td><td style={{ ...td, fontWeight: 500 }}>{s.customer_name || s.customer_code || "-"}</td><td style={td}>{s.product_name || s.product_code || "-"}</td>
                  <td style={td}>{PURPOSE_MAP[s.purpose] || s.purpose}</td>
                  <td style={{ ...td, textAlign: "center" }}>{s.quantity}</td>
                  <td style={{ ...td, textAlign: "center" }}>
                    <span style={tagStyle(st.bg, st.color)}>{st.label}</span>
                  </td>
                  <td style={{ ...td, fontSize: 12, color: "#888" }}>{s.created_at ? new Date(s.created_at).toLocaleDateString("zh-TW") : "-"}</td>
                  <td style={{ ...td, textAlign: "center" }}>
                    <span style={{ fontSize: 12, color: "#1890ff", cursor: "pointer" }}>詳情 →</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ====== Pagination ====== */}
      {total > 15 && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 16, gap: 4 }}>
          <span style={{ fontSize: 12, color: "#999", marginRight: 8 }}>第 {page} 頁 / 共 {Math.ceil(total / 15)} 頁</span>
          {Array.from({ length: Math.min(Math.ceil(total / 15), 7) }, (_, i) => {
            const p = i + 1;
            return (
              <button key={i} onClick={() => setPage(p)} style={{
                width: 32, height: 32, borderRadius: 4, border: `1px solid ${page === p ? "#1890ff" : "#d9d9d9"}`,
                background: page === p ? "#1890ff" : "#fff", color: page === p ? "#fff" : "#666",
                fontSize: 12, cursor: "pointer", fontWeight: 500,
              }}>{p}</button>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}