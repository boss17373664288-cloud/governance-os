"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Plus } from "lucide-react";
import { api } from "@/lib/api";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "草稿", color: "#999" },
  PENDING_APPROVAL: { label: "待審批", color: "#1890ff" },
  APPROVED: { label: "已核准", color: "#52c41a" },
  REJECTED: { label: "已駁回", color: "#ff4d4f" },
  SHIPPED: { label: "已出貨", color: "#13c2c2" },
  COMPLETED: { label: "已完成", color: "#52c41a" },
};

const FILTER_TABS = [
  { key: "", label: "全部" },
  { key: "DRAFT", label: "草稿" },
  { key: "PENDING_APPROVAL", label: "待審批" },
  { key: "APPROVED", label: "已核准" },
  { key: "SHIPPED", label: "已出貨" },
];

export default function MobileOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (activeStatus) params.status = activeStatus;
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/sales-orders", { params });
      const data = (res as any).data || res;
      setOrders(data?.items || data?.list || []);
      setTotal(data?.total || 0);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, activeStatus, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <button
          className="mobile-btn"
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            padding: 8,
            cursor: "pointer",
            minWidth: 44,
            minHeight: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={22} color="#333" />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#333", margin: 0, flex: 1 }}>
          銷售訂單
        </h1>
        <button
          className="mobile-btn"
          onClick={() => router.push("/mobile/orders/new")}
          style={{
            minWidth: 44,
            minHeight: 44,
            padding: "6px 14px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            background: "#1890ff",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 4,
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={16} />
          新增訂單
        </button>
      </div>

      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#f5f5f5",
          borderRadius: 12,
          padding: "6px 12px",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <Search size={16} color="#999" />
        <input
          type="text"
          placeholder="搜尋訂單編號或客戶名稱..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: 14,
            color: "#333",
            minHeight: 44,
          }}
        />
      </div>

      {/* Status Filters */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 12,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            className="mobile-btn"
            onClick={() => {
              setActiveStatus(tab.key);
              setPage(1);
            }}
            style={{
              minWidth: 44,
              minHeight: 36,
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              background: activeStatus === tab.key ? "#1890ff" : "#f5f5f5",
              color: activeStatus === tab.key ? "#fff" : "#666",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 14 }}>
          載入中...
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 14 }}>
          暫無訂單
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {orders.map((order: any) => {
            const status = STATUS_MAP[order.status] || { label: order.status, color: "#999" };
            return (
              <div
                key={order.id || order.order_id || order.order_no}
                className="mobile-card mobile-btn"
                onClick={() => router.push("/mobile/orders/" + (order.order_id || order.id))}
                style={{ cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>
                    {order.order_no}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "3px 10px",
                      borderRadius: 10,
                      background: status.color + "18",
                      color: status.color,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {status.label}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: "#555", marginBottom: 6 }}>
                  {order.customer?.customer_name || order.customer_name || "—"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#ff4d4f" }}>
                    NT$ {Number(order.total_amount ?? 0).toLocaleString()}
                  </span>
                  <span style={{ fontSize: 11, color: "#999" }}>
                    {order.created_at ? order.created_at.slice(0, 16).replace("T", " ") : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            padding: "12px 0",
          }}
        >
          <button
            className="mobile-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              minWidth: 44,
              minHeight: 36,
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid #d9d9d9",
              background: page <= 1 ? "#f5f5f5" : "#fff",
              color: page <= 1 ? "#bbb" : "#333",
              cursor: page <= 1 ? "default" : "pointer",
              fontSize: 13,
            }}
          >
            上一頁
          </button>
          <span style={{ fontSize: 13, color: "#666" }}>
            {page} / {totalPages}
          </span>
          <button
            className="mobile-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{
              minWidth: 44,
              minHeight: 36,
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid #d9d9d9",
              background: page >= totalPages ? "#f5f5f5" : "#fff",
              color: page >= totalPages ? "#bbb" : "#333",
              cursor: page >= totalPages ? "default" : "pointer",
              fontSize: 13,
            }}
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
}