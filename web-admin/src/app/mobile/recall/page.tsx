"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronRight, Plus, Search } from "lucide-react";
import { api } from "@/lib/api";

const RECALL_LEVEL_MAP: Record<string, { label: string; color: string }> = {
  R1: { label: "R1", color: "#ff4d4f" },
  R2: { label: "R2", color: "#fa8c16" },
  R3: { label: "R3", color: "#1890ff" },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "草稿", color: "#999" },
  PENDING_APPROVAL: { label: "待審批", color: "#1890ff" },
  APPROVED: { label: "已核准", color: "#52c41a" },
  IN_PROGRESS: { label: "進行中", color: "#fa8c16" },
  RESOLVED: { label: "已解決", color: "#52c41a" },
  CLOSED: { label: "已結案", color: "#999" },
};

const STATUS_KEYS = ["", "DRAFT", "PENDING_APPROVAL", "APPROVED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const STATUS_LABELS = ["全部", "草稿", "待審批", "已核准", "進行中", "已解決", "已結案"];
const LEVEL_KEYS = ["", "R1", "R2", "R3"];
const LEVEL_LABELS = ["全部", "R1", "R2", "R3"];

export default function MobileRecallPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const pageSize = 15;
  const router = useRouter();

  async function load(p: number) {
    setLoading(true);
    try {
      let url = "/recall?page=" + p + "&page_size=" + pageSize;
      if (search) url += "&search=" + encodeURIComponent(search);
      if (statusFilter) url += "&status=" + encodeURIComponent(statusFilter);
      if (levelFilter) url += "&recall_level=" + encodeURIComponent(levelFilter);
      const res: any = await api.get(url);
      const data = res.data || res;
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, [statusFilter, levelFilter]);

  function handleSearch() {
    setPage(1);
    load(1);
  }

  const totalPages = Math.ceil(total / pageSize);
  const level = RECALL_LEVEL_MAP;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <AlertTriangle size={22} color="#ff4d4f" style={{ marginRight: 8 }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: "#333" }}>召回案件</span>
        </div>
        <button
          className="mobile-btn"
          onClick={() => router.push("/mobile/recall/new")}
          style={{ minWidth: 44, minHeight: 44, background: "#ff4d4f", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "0 14px", display: "flex", alignItems: "center", gap: 4 }}
        >
          <Plus size={16} />
          新建召回
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#fff", borderRadius: 12, padding: "10px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <Search size={16} color="#999" />
            <input
              placeholder="搜尋召回編號 / 產品名稱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, marginLeft: 8, background: "transparent", color: "#333" }}
            />
          </div>
          <button
            className="mobile-btn"
            onClick={handleSearch}
            style={{ minWidth: 44, minHeight: 44, background: "#1890ff", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "0 16px" }}
          >
            搜尋
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 4 }}>
        {STATUS_KEYS.map((key, idx) => (
          <button
            key={key}
            className="mobile-btn"
            onClick={() => { setStatusFilter(key); setPage(1); }}
            style={{
              minWidth: 44, minHeight: 36, borderRadius: 12, border: "1px solid " + (statusFilter === key ? "#1890ff" : "#e8e8e8"),
              background: statusFilter === key ? "#1890ff" : "#fff",
              color: statusFilter === key ? "#fff" : "#666",
              fontSize: 13, fontWeight: statusFilter === key ? 600 : 400,
              cursor: "pointer", padding: "6px 14px", flexShrink: 0,
            }}
          >
            {STATUS_LABELS[idx]}
          </button>
        ))}
      </div>

      {/* Level Filter Pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 4 }}>
        {LEVEL_KEYS.map((key, idx) => (
          <button
            key={key}
            className="mobile-btn"
            onClick={() => { setLevelFilter(key); setPage(1); }}
            style={{
              minWidth: 44, minHeight: 36, borderRadius: 12, border: "1px solid " + (levelFilter === key ? "#1890ff" : "#e8e8e8"),
              background: levelFilter === key ? "#1890ff" : "#fff",
              color: levelFilter === key ? "#fff" : "#666",
              fontSize: 13, fontWeight: levelFilter === key ? 600 : 400,
              cursor: "pointer", padding: "6px 14px", flexShrink: 0,
            }}
          >
            {LEVEL_LABELS[idx]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 14 }}>載入中...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 14 }}>尚無召回案件</div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item: any) => (
              <div
                key={item.recall_id || item.id}
                className="mobile-card"
                onClick={() => router.push("/mobile/recall/" + (item.recall_id || item.id))}
                style={{ cursor: "pointer" }}
              >
                {/* Top row: recall_no + level badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#1890ff" }}>
                    {item.recall_no || "RCR-00000"}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                    background: (level[item.recall_level]?.color || "#999") + "15",
                    color: level[item.recall_level]?.color || "#999",
                    border: "1px solid " + (level[item.recall_level]?.color || "#999") + "30",
                  }}>
                    {level[item.recall_level]?.label || item.recall_level || "—"}
                  </span>
                </div>

                {/* Product name */}
                <div style={{ fontSize: 14, color: "#333", marginBottom: 6 }}>
                  {item.product_name || "—"}
                </div>

                {/* Bottom row: status + date */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4,
                    background: (STATUS_MAP[item.status]?.color || "#999") + "12",
                    color: STATUS_MAP[item.status]?.color || "#999",
                  }}>
                    {STATUS_MAP[item.status]?.label || item.status || "—"}
                  </span>
                  <span style={{ fontSize: 11, color: "#999" }}>
                    {item.discovery_date ? item.discovery_date.slice(0, 10) : "—"}
                  </span>
                </div>

                <ChevronRight size={16} color="#ccc" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
              <button
                className="mobile-btn"
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                style={{ minWidth: 44, minHeight: 44, background: page <= 1 ? "#f5f5f5" : "#fff", color: page <= 1 ? "#ccc" : "#333", border: "1px solid #e8e8e8", borderRadius: 12, fontSize: 14, cursor: page <= 1 ? "default" : "pointer", padding: "8px 14px" }}
              >
                上一頁
              </button>
              <span style={{ fontSize: 13, color: "#666" }}>
                {page} / {totalPages}
              </span>
              <button
                className="mobile-btn"
                disabled={page >= totalPages}
                onClick={() => load(page + 1)}
                style={{ minWidth: 44, minHeight: 44, background: page >= totalPages ? "#f5f5f5" : "#fff", color: page >= totalPages ? "#ccc" : "#333", border: "1px solid #e8e8e8", borderRadius: 12, fontSize: 14, cursor: page >= totalPages ? "default" : "pointer", padding: "8px 14px" }}
              >
                下一頁
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
