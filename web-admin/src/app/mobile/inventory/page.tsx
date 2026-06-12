"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface Batch {
  id: number;
  batch_no: string;
  product_name: string;
  warehouse_name: string;
  quantity: number;
  expiry_date: string;
  qa_status: string;
}

const QA_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待驗", color: "#fa8c16" },
  PASSED: { label: "合格", color: "#52c41a" },
  REJECTED: { label: "不合格", color: "#ff4d4f" },
  RECALL_LOCKED: { label: "召回鎖定", color: "#ff4d4f" },
};

const WAREHOUSES = [
  { label: "全部", value: "" },
  { label: "總倉", value: "總倉" },
  { label: "北區倉", value: "北區倉" },
  { label: "南區倉", value: "南區倉" },
  { label: "QA待驗區", value: "QA待驗區" },
];

export default function InventoryPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [warehouse, setWarehouse] = useState("");
  const [loading, setLoading] = useState(false);

  const pageSize = 20;

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      if (warehouse) params.set("warehouse_name", warehouse);

      const res = await api.get(`/inventory/batches?${params.toString()}`);
      setBatches(res.data?.items ?? res.data?.results ?? []);
      setTotal(res.data?.total ?? 0);
    } catch (err) {
      console.error("載入批次資料失敗", err);
    } finally {
      setLoading(false);
    }
  }, [page, warehouse]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>庫存批次管理</h1>

      {/* Warehouse filter */}
      <div style={styles.filterRow}>
        {WAREHOUSES.map((w) => (
          <button
            key={w.value}
            onClick={() => { setWarehouse(w.value); setPage(1); }}
            style={{
              ...styles.filterBtn,
              ...(warehouse === w.value ? styles.filterBtnActive : {}),
            }}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Batch cards */}
      {loading ? (
        <p style={styles.loading}>載入中...</p>
      ) : batches.length === 0 ? (
        <p style={styles.empty}>暫無批次資料</p>
      ) : (
        batches.map((batch) => {
          const qa = QA_STATUS_MAP[batch.qa_status] ?? { label: batch.qa_status, color: "#999" };
          return (
            <div key={batch.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.batchNo}>{batch.batch_no}</span>
                <span style={{ ...styles.badge, backgroundColor: qa.color }}>
                  {qa.label}
                </span>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.row}>
                  <span style={styles.label}>品名</span>
                  <span style={styles.value}>{batch.product_name}</span>
                </div>
                <div style={styles.row}>
                  <span style={styles.label}>倉庫</span>
                  <span style={styles.value}>{batch.warehouse_name}</span>
                </div>
                <div style={styles.row}>
                  <span style={styles.label}>數量</span>
                  <span style={styles.value}>{batch.quantity}</span>
                </div>
                <div style={styles.row}>
                  <span style={styles.label}>效期</span>
                  <span style={styles.value}>{batch.expiry_date}</span>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ ...styles.pageBtn, opacity: page <= 1 ? 0.4 : 1 }}
          >
            上一頁
          </button>
          <span style={styles.pageInfo}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{ ...styles.pageBtn, opacity: page >= totalPages ? 0.4 : 1 }}
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "16px",
    maxWidth: 480,
    margin: "0 auto",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 16,
    color: "#1a1a1a",
  },
  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    padding: "8px 14px",
    minHeight: 44,
    borderRadius: 12,
    border: "1px solid #d9d9d9",
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#333",
    cursor: "pointer",
  },
  filterBtnActive: {
    backgroundColor: "#1677ff",
    color: "#fff",
    borderColor: "#1677ff",
  },
  loading: {
    textAlign: "center",
    color: "#999",
    padding: 32,
  },
  empty: {
    textAlign: "center",
    color: "#999",
    padding: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  batchNo: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1a1a1a",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
    color: "#fff",
    fontWeight: 500,
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 28,
  },
  label: {
    fontSize: 13,
    color: "#888",
  },
  value: {
    fontSize: 14,
    color: "#333",
    fontWeight: 500,
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginTop: 20,
  },
  pageBtn: {
    padding: "10px 18px",
    minHeight: 44,
    borderRadius: 12,
    border: "1px solid #d9d9d9",
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#333",
    cursor: "pointer",
  },
  pageInfo: {
    fontSize: 14,
    color: "#666",
  },
};
