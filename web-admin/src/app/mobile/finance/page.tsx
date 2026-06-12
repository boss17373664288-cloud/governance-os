"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function FinancePage() {
  const [stats, setStats] = useState({ total_ar: 0, total_collected: 0, overdue_amount: 0 });
  const [overdueList, setOverdueList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 搜尋 & 分頁
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, arRes] = await Promise.all([
          api.get("/finance/dashboard"),
          api.get("/finance/ar/overdue"),
        ]);
        setStats(dashRes.data ?? dashRes);
        const raw = arRes.data ?? arRes;
        setOverdueList(Array.isArray(raw) ? raw : raw.items ?? raw.results ?? raw.data ?? []);
      } catch (e) {
        console.error("載入財務資料失敗", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // 依 customer_name 篩選
  const filtered = overdueList.filter((item) =>
    (item.customer_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // 分頁計算
  const totalFiltered = filtered.length;
  const computedTotalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, computedTotalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  useEffect(() => {
    setTotalPages(computedTotalPages);
  }, [computedTotalPages]);

  const overdueBadgeStyle = (days) => {
    let color = "#1890ff";  // >30 藍
    if (days > 90) color = "#ff4d4f";   // >90 紅
    else if (days > 60) color = "#fa8c16"; // >60 橘
    return {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 12,
      backgroundColor: color,
      color: "#fff",
      fontSize: 12,
      fontWeight: 600,
      lineHeight: "20px",
    };
  };

  return (
    <div style={{ padding: 16, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      {/* 頁面標題 */}
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px 0", color: "#333" }}>
        財務管理
      </h1>

      {/* 統計卡片區 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[
          { label: "應收總額", value: stats.total_ar, color: "#1890ff" },
          { label: "已收款", value: stats.total_collected, color: "#52c41a" },
          { label: "逾期金額", value: stats.overdue_amount, color: "#ff4d4f" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: "14px 10px",
              textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: 13, color: "#999", marginBottom: 6 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>
              NT$ {item.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* 逾期應收帳款 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>
          逾期應收帳款
        </span>
        <span style={{ fontSize: 13, color: "#999" }}>
          共 {totalFiltered} 筆
        </span>
      </div>

      {/* 搜尋列 */}
      <input
        type="text"
        placeholder="搜尋客戶名稱..."
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

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div>
      ) : paged.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>暫無逾期帳款</div>
      ) : (
        paged.map((item, idx) => (
          <div
            key={item.id ?? idx}
            className="mobile-card"
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>
                {item.customer_name}
              </span>
              <span style={overdueBadgeStyle(item.days_overdue)}>
                {item.days_overdue} 天
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#666",
              }}
            >
              <span>到期日：{item.due_date}</span>
              <span
                style={{ fontSize: 16, fontWeight: 700, color: "#ff4d4f" }}
              >
                NT$ {item.amount?.toLocaleString?.() ?? item.amount}
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
