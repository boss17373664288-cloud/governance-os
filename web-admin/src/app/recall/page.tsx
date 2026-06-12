"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const LEVEL_MAP: Record<string, { label: string; color: string }> = {
  R1: { label: "觀察 R1", color: "#52c41a" },
  R2: { label: "內部限制 R2", color: "#fa8c16" },
  R3: { label: "正式召回 R3", color: "#ff4d4f" },
  R4: { label: "緊急召回 R4", color: "#cf1322" },
};

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: "草稿", bg: "#f5f5f5", color: "#999" },
  PENDING_APPROVAL: { label: "待審批", bg: "#e6f7ff", color: "#1890ff" },
  APPROVED: { label: "已批准", bg: "#fff7e6", color: "#fa8c16" },
  REJECTED: { label: "已退回", bg: "#fff1f0", color: "#ff4d4f" },
  IN_PROGRESS: { label: "執行中", bg: "#f6ffed", color: "#52c41a" },
  RESOLVED: { label: "已解決", bg: "#f0f5ff", color: "#2f54eb" },
  CLOSED: { label: "已關閉", bg: "#fafafa", color: "#8c8c8c" },
};

const cardBox: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 14px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const tagStyle = (bg: string, color: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500,
  padding: "2px 8px", borderRadius: 2, background: bg, color, whiteSpace: "nowrap",
});

export default function RecallPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get("/recall", { params: { page, page_size: 15, level: levelFilter || undefined, status: statusFilter || undefined } })
      .then((res: any) => { setItems(res.data.items || []); setTotal(res.data.pagination?.total || 0); })
      .finally(() => setLoading(false));
  }, [page, levelFilter, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#333", margin: 0 }}>召回管理</h1>
        <button onClick={() => router.push("/recall/new")}
          style={{ height: 32, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          + 新建召回案件
        </button>
      </div>

      <div style={{ ...cardBox, padding: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>召回等級：</span>
        <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1); }}
          style={{ height: 32, padding: "0 8px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", background: "#fff" }}>
          <option value="">全部</option>
          {Object.entries(LEVEL_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>狀態：</span>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ height: 32, padding: "0 8px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", background: "#fff" }}>
          <option value="">全部</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "#999", whiteSpace: "nowrap", marginLeft: "auto" }}>共 {total} 筆</span>
      </div>

      <div style={cardBox}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>召回編號</th>
              <th style={th}>產品編碼</th>
              <th style={th}>批號</th>
              <th style={{ ...th, textAlign: "center" }}>等級</th>
              <th style={{ ...th, textAlign: "center" }}>狀態</th>
              <th style={th}>發現日期</th>
              <th style={th}>建立時間</th>
              <th style={{ ...th, textAlign: "center" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ ...td, textAlign: "center", padding: 48, color: "#999" }}>載入中...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} style={{ ...td, textAlign: "center", padding: 48, color: "#999" }}>暫無召回案件</td></tr>
            ) : items.map((r: any) => {
              const lv = LEVEL_MAP[r.recall_level] || { label: r.recall_level, color: "#999" };
              const st = STATUS_MAP[r.status] || { label: r.status, bg: "#f5f5f5", color: "#999" };
              return (
                <tr key={r.recall_id} style={{ cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                  onClick={() => router.push("/recall/" + r.recall_id)}>
                  <td style={{ ...td, fontFamily: "monospace", fontWeight: 500, whiteSpace: "nowrap" }}>{r.recall_no}</td>
                  <td style={td}>{r.product_code || r.product_id}</td>
                  <td style={{ ...td, fontFamily: "monospace" }}>{r.batch_no}</td>
                  <td style={{ ...td, textAlign: "center" }}>
                    <span style={tagStyle("#fff", lv.color)}>{lv.label}</span>
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>
                    <span style={tagStyle(st.bg, st.color)}>{st.label}</span>
                  </td>
                  <td style={{ ...td, fontSize: 12, color: "#888" }}>{r.discovery_date ? new Date(r.discovery_date).toLocaleDateString("zh-TW") : "-"}</td>
                  <td style={{ ...td, fontSize: 12, color: "#888" }}>{r.created_at ? new Date(r.created_at).toLocaleDateString("zh-TW") : "-"}</td>
                  <td style={{ ...td, textAlign: "center", fontSize: 12, color: "#1890ff", cursor: "pointer" }}>詳情 →</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {total > 15 && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 16, gap: 4 }}>
          <span style={{ fontSize: 12, color: "#999", marginRight: 8 }}>第 {page} 頁 / 共 {Math.ceil(total / 15)} 頁</span>
          {Array.from({ length: Math.min(Math.ceil(total / 15), 7) }, (_, i) => {
            const p = i + 1;
            return (
              <button key={i} onClick={() => setPage(p)} style={{
                width: 32, height: 32, borderRadius: 4, border: "1px solid " + (page === p ? "#1890ff" : "#d9d9d9"),
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
