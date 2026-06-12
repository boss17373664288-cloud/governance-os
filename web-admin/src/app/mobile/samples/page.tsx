"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Beaker, ChevronRight, Plus, Search } from "lucide-react";
import { api } from "@/lib/api";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "草稿", color: "#999" },
  PENDING_APPROVAL: { label: "待審批", color: "#1890ff" },
  APPROVED: { label: "已核准", color: "#52c41a" },
  SHIPPED: { label: "已出貨", color: "#13c2c2" },
};

const STATUS_KEYS = ["", "DRAFT", "PENDING_APPROVAL", "APPROVED", "SHIPPED"];
const STATUS_LABELS = ["全部", "草稿", "待審批", "已核准", "已出貨"];

export default function MobileSamplesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const pageSize = 15;
  const router = useRouter();

  const [allItems, setAllItems] = useState<any[]>([]);

  async function load(p: number) {
    setLoading(true);
    try {
      let url = "/sample-requests?page=1&page_size=200";
      if (statusFilter) url += "&status=" + encodeURIComponent(statusFilter);
      const res: any = await api.get(url);
      const data = res.data || res;
      setAllItems(data.items || []);
      setTotal(data.total || 0);
      setPage(1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, [statusFilter]);

  // Client-side keyword filtering
  var filteredItems = allItems.filter((item: any) => {
    if (!search.trim()) return true;
    var s = search.trim().toLowerCase();
    return (
      (item.sample_no || "").toLowerCase().includes(s) ||
      (item.customer_name || "").toLowerCase().includes(s) ||
      (item.customer_code || "").toLowerCase().includes(s) ||
      (item.product_name || "").toLowerCase().includes(s) ||
      (item.product_code || "").toLowerCase().includes(s)
    );
  });

  // Client-side pagination
  var displayItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  var displayTotal = filteredItems.length;

  const totalPages = Math.ceil(displayTotal / pageSize);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Beaker size={22} color="#722ed1" style={{ marginRight: 8 }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: "#333" }}>打板管理</span>
        </div>
        <button
          className="mobile-btn"
          onClick={() => router.push("/mobile/samples/new")}
          style={{ minWidth: 44, minHeight: 44, background: "#722ed1", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "0 14px", display: "flex", alignItems: "center", gap: 4 }}
        >
          <Plus size={16} />
          新建打板
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 12, padding: "10px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <Search size={16} color="#999" />
            <input
              placeholder="搜尋打板編號 / 客戶名稱 / 產品名稱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, marginLeft: 8, background: "transparent", color: "#333" }}
            />
          </div>

        </div>
      </div>

      {/* Status Filter Pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 4 }}>
        {STATUS_KEYS.map((key, idx) => (
          <button
            key={key}
            className="mobile-btn"
            onClick={() => { setStatusFilter(key); setPage(1); }}
            style={{
              minWidth: 44, minHeight: 36, borderRadius: 12, border: "1px solid " + (statusFilter === key ? "#722ed1" : "#e8e8e8"),
              background: statusFilter === key ? "#722ed1" : "#fff",
              color: statusFilter === key ? "#fff" : "#666",
              fontSize: 13, fontWeight: statusFilter === key ? 600 : 400,
              cursor: "pointer", padding: "6px 14px", flexShrink: 0,
            }}
          >
            {STATUS_LABELS[idx]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 14 }}>載入中...</div>
      ) : displayItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 14 }}>尚無打板記錄</div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {displayItems.map((item: any) => (
              <div
                key={item.sample_id || item.id}
                className="mobile-card"
                onClick={() => router.push("/mobile/samples/" + (item.sample_id || item.id))}
                style={{ cursor: "pointer" }}
              >
                {/* Top row: sample_no */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#722ed1" }}>
                    {item.sample_no || "SPL-00000"}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
                    background: (STATUS_MAP[item.status]?.color || "#999") + "15",
                    color: STATUS_MAP[item.status]?.color || "#999",
                    border: "1px solid " + (STATUS_MAP[item.status]?.color || "#999") + "30",
                  }}>
                    {STATUS_MAP[item.status]?.label || item.status || "—"}
                  </span>
                </div>

                {/* Customer + Product */}
                <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
                  客戶：{item.customer_name || "—"}
                </div>
                <div style={{ fontSize: 13, color: "#333", marginBottom: 6 }}>
                  產品：{item.product_name || "—"}
                </div>

                {/* Bottom: date */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 11, color: "#999" }}>
                    {item.created_at ? item.created_at.slice(0, 16).replace("T", " ") : "—"}
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
