"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";

const STATUS_MAP = {
  DRAFT: { label: "草稿", color: "#999" },
  SUBMITTED: { label: "已提交", color: "#1890ff" },
  PENDING_APPROVAL: { label: "待審批", color: "#1890ff" },
  APPROVED: { label: "已核准", color: "#52c41a" },
  RECEIVED: { label: "已收貨", color: "#13c2c2" },
};

const STATUS_FILTERS = [
  { key: "", label: "全部" },
  { key: "DRAFT", label: "草稿" },
  { key: "SUBMITTED", label: "已提交" },
  { key: "PENDING_APPROVAL", label: "待審批" },
  { key: "APPROVED", label: "已核准" },
  { key: "RECEIVED", label: "已收貨" },
];

export default function PurchasePage() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // 搜尋 & 狀態篩選
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function load(pageNum = 1) {
    try {
      const res: any = await api.get("/purchase", { params: { page, page_size: pageSize, ...(search.trim() ? { search: search.trim() } : {}), ...(filterStatus ? { status: filterStatus } : {}) } });
      const data = res.data ?? res;
      const items = data.items ?? data.results ?? data.data ?? data;
      setList(Array.isArray(items) ? items : []);
      const total = data.total ?? data.total_pages ?? data.page_count ?? 1;
      setTotalPages(Math.max(1, Math.ceil((data.total ?? items.length) / pageSize)));
    } catch (e) {
      console.error("載入採購單失敗", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, []);

  // Search & filter handled server-side via API params
  const totalFiltered = list.length;
  const computedTotalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, computedTotalPages);
  const start = (safePage - 1) * pageSize;
  const paged = list.slice(start, start + pageSize);

  const statusBadge = (status) => {
    const cfg = STATUS_MAP[status] ?? { label: status, color: "#999" };
    return {
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 12,
      backgroundColor: cfg.color,
      color: "#fff",
      fontSize: 12,
      fontWeight: 600,
      lineHeight: "22px",
    };
  };

  return (
    <div style={{ padding: 16, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      {/* 頁面標題 + 新增按鈕 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#333" }}>
          採購單管理
        </h1>
        <button
          className="mobile-btn"
          onClick={() => router.push("/purchase")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            minHeight: 44,
            padding: "8px 16px",
            borderRadius: 12,
            border: "none",
            backgroundColor: "#1890ff",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={18} />
          新增採購
        </button>
      </div>

      {/* 搜尋列 */}
      <input
        type="text"
        placeholder="搜尋 PO 單號或供應商名稱..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          minHeight: 44,
          padding: "8px 14px",
          borderRadius: 12,
          border: "1px solid #d9d9d9",
          fontSize: 14,
          outline: "none",
          marginBottom: 12,
        }}
      />

      {/* 狀態篩選 Pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            className="mobile-btn"
            onClick={() => {
              setStatusFilter(f.key);
              setPage(1);
            }}
            style={{
              minHeight: 36,
              padding: "4px 14px",
              borderRadius: 12,
              border: "1px solid #d9d9d9",
              backgroundColor: statusFilter === f.key ? "#1890ff" : "#fff",
              color: statusFilter === f.key ? "#fff" : "#555",
              fontSize: 13,
              fontWeight: statusFilter === f.key ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div>
      ) : paged.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>暫無採購單</div>
      ) : (
        paged.map((item, idx) => (
          <div
            key={item.id ?? item.po_no ?? idx}
            className="mobile-card"
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            {/* 第一行：PO 單號 + 狀態 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>
                {item.po_no}
              </span>
              <span style={statusBadge(item.status)}>
                {(STATUS_MAP[item.status]?.label) ?? item.status}
              </span>
            </div>

            {/* 第二行：供應商 */}
            <div style={{ fontSize: 14, color: "#555", marginBottom: 4 }}>
              {item.supplier_name}
            </div>

            {/* 第三行：金額 + 日期 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 13,
                color: "#888",
              }}
            >
              <span>{item.created_at}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#333" }}>
                NT$ {item.total_amount?.toLocaleString?.() ?? item.total_amount}
              </span>
            </div>
          </div>
        ))
      )}

      {/* 分頁 */}
      {totalFiltered > pageSize && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            marginTop: 16,
            marginBottom: 24,
          }}
        >
          <button
            className="mobile-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            style={{
              minHeight: 44,
              minWidth: 80,
              borderRadius: 12,
              border: "1px solid #d9d9d9",
              backgroundColor: safePage <= 1 ? "#f5f5f5" : "#fff",
              color: safePage <= 1 ? "#ccc" : "#333",
              fontSize: 14,
              cursor: safePage <= 1 ? "not-allowed" : "pointer",
            }}
          >
            上一頁
          </button>
          <span style={{ fontSize: 14, color: "#666" }}>
            {safePage} / {computedTotalPages}
          </span>
          <button
            className="mobile-btn"
            onClick={() => setPage((p) => Math.min(computedTotalPages, p + 1))}
            disabled={safePage >= computedTotalPages}
            style={{
              minHeight: 44,
              minWidth: 80,
              borderRadius: 12,
              border: "1px solid #d9d9d9",
              backgroundColor: safePage >= computedTotalPages ? "#f5f5f5" : "#fff",
              color: safePage >= computedTotalPages ? "#ccc" : "#333",
              fontSize: 14,
              cursor: safePage >= computedTotalPages ? "not-allowed" : "pointer",
            }}
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
}
