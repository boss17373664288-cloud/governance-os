"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Phone, ChevronRight, Plus } from "lucide-react";
import { api } from "@/lib/api";

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  ACTIVE: { label: "活躍", bg: "#f6ffed", color: "#52c41a" },
  LEAD: { label: "潛在客戶", bg: "#fff7e6", color: "#fa8c16" },
  INACTIVE: { label: "已停用", bg: "#f5f5f5", color: "#999" },
};

const FILTER_TABS = [
  { key: "", label: "全部" },
  { key: "ACTIVE", label: "活躍" },
  { key: "LEAD", label: "潛在" },
  { key: "INACTIVE", label: "非活躍" },
];

function getStatusBadge(status: string) {
  const s = STATUS_MAP[status] || STATUS_MAP["ACTIVE"];
  return (
    <span style={{
      display: "inline-block", fontSize: 11, fontWeight: 500,
      padding: "2px 10px", borderRadius: 10, background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

export default function MobileCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    const params: any = { page, page_size: pageSize };
    if (search.trim()) params.search = search.trim();
    if (filterStatus) params.status = filterStatus;
    api.get("/customers", { params })
      .then((r: any) => {
        setCustomers(r.data?.items || []);
        setTotal(r.data?.pagination?.total || 0);
      })
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, [page, search, filterStatus]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      {/* 搜尋列 + 新增按鈕 */}
      <div style={{ marginBottom: 12, display: "flex", gap: 10 }}>
        <div style={{
          display: "flex", alignItems: "center", background: "#fff",
          borderRadius: 12, padding: "10px 16px", gap: 8, flex: 1, minWidth: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <Search size={18} color="#999" />
          <input
            placeholder="搜尋客戶名稱或代碼..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 15, background: "transparent" }}
          />
        </div>
        <button
          className="mobile-btn"
          onClick={() => router.push("/mobile/customers/new")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 4, minWidth: 44, minHeight: 44, borderRadius: 12,
            background: "#1677ff", color: "#fff", border: "none",
            fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "0 16px",
            whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          <Plus size={18} />
          新增客戶
        </button>
      </div>

      {/* 狀態篩選 pills */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 16, overflowX: "auto",
        paddingBottom: 4, WebkitOverflowScrolling: "touch",
      }}>
        {FILTER_TABS.map((tab) => {
          const isActive = filterStatus === tab.key;
          return (
            <button
              key={tab.key}
              className="mobile-btn"
              onClick={() => { setFilterStatus(tab.key); setPage(1); }}
              style={{
                minHeight: 36, padding: "6px 16px", borderRadius: 12,
                border: isActive ? "1px solid #1677ff" : "1px solid #e8e8e8",
                background: isActive ? "#e6f4ff" : "#fff",
                color: isActive ? "#1677ff" : "#666",
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 客戶列表 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 14 }}>載入中...</div>
      ) : customers.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 14 }}>暫無客戶資料</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {customers.map((c: any) => (
            <div
              key={c.customer_id}
              className="mobile-card mobile-btn"
              onClick={() => router.push("/customers/" + c.customer_id)}
              style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#333", marginBottom: 4 }}>
                    {c.customer_name}
                  </div>
                  <div style={{ fontSize: 12, color: "#999" }}>
                    代碼：{c.customer_code || "-"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {getStatusBadge(c.status)}
                  <ChevronRight size={16} color="#ccc" />
                </div>
              </div>
              {c.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#666" }}>
                  <Phone size={12} />
                  <span>{c.phone}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 分頁 */}
      {totalPages > 1 && (
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          gap: 12, marginTop: 16, paddingBottom: 8,
        }}>
          <button
            className="mobile-btn"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{
              minHeight: 44, padding: "8px 16px", borderRadius: 12,
              border: "1px solid #d9d9d9",
              background: page <= 1 ? "#f5f5f5" : "#fff", color: page <= 1 ? "#ccc" : "#333",
              fontSize: 13, cursor: page <= 1 ? "default" : "pointer",
            }}
          >
            上一頁
          </button>
          <span style={{ fontSize: 12, color: "#999" }}>{page} / {totalPages}</span>
          <button
            className="mobile-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            style={{
              minHeight: 44, padding: "8px 16px", borderRadius: 12,
              border: "1px solid #d9d9d9",
              background: page >= totalPages ? "#f5f5f5" : "#fff", color: page >= totalPages ? "#ccc" : "#333",
              fontSize: 13, cursor: page >= totalPages ? "default" : "pointer",
            }}
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
}
