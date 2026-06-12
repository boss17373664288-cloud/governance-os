"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, Package, Plus } from "lucide-react";
import { api } from "@/lib/api";

const CATEGORY_MAP: Record<string, { label: string; bg: string; color: string }> = {
  DEVICE: { label: "醫療器材", bg: "#e6f7ff", color: "#1890ff" },
  COSMETIC: { label: "化妝品", bg: "#fff0f6", color: "#eb2f96" },
  CONSUMABLE: { label: "耗材", bg: "#f6ffed", color: "#52c41a" },
  EQUIPMENT: { label: "設備", bg: "#fff7e6", color: "#fa8c16" },
};

const FILTER_TABS = [
  { key: "", label: "全部" },
  { key: "DEVICE", label: "醫療器材" },
  { key: "COSMETIC", label: "化妝品" },
  { key: "CONSUMABLE", label: "耗材" },
  { key: "EQUIPMENT", label: "設備" },
];

function getCategoryBadge(category: string) {
  const cat = CATEGORY_MAP[category] || { label: category || "其他", bg: "#f5f5f5", color: "#999" };
  return (
    <span style={{
      display: "inline-block", fontSize: 11, fontWeight: 500,
      padding: "2px 10px", borderRadius: 10, background: cat.bg, color: cat.color,
    }}>
      {cat.label}
    </span>
  );
}

function formatPrice(price: any): string {
  if (price == null) return "NT$ -";
  const n = Number(price);
  if (isNaN(n)) return "NT$ -";
  return "NT$ " + n.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function MobileProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    const params: any = { page, page_size: pageSize };
    if (search.trim()) params.search = search.trim();
    if (filterCategory) params.category = filterCategory;
    api.get("/products", { params })
      .then((r: any) => {
        setProducts(r.data?.items || []);
        setTotal(r.data?.pagination?.total || 0);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [page, search, filterCategory]);

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
            placeholder="搜尋產品名稱或代碼..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 15, background: "transparent" }}
          />
        </div>
        <button
          className="mobile-btn"
          onClick={() => router.push("/mobile/products/new")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 4, minWidth: 44, minHeight: 44, borderRadius: 12,
            background: "#1677ff", color: "#fff", border: "none",
            fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "0 16px",
            whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          <Plus size={18} />
          新增產品
        </button>
      </div>

      {/* 類別篩選 pills */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 16, overflowX: "auto",
        paddingBottom: 4, WebkitOverflowScrolling: "touch",
      }}>
        {FILTER_TABS.map((tab) => {
          const isActive = filterCategory === tab.key;
          return (
            <button
              key={tab.key}
              className="mobile-btn"
              onClick={() => { setFilterCategory(tab.key); setPage(1); }}
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

      {/* 產品列表 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 14 }}>載入中...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 14 }}>暫無產品資料</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {products.map((p: any) => (
            <div
              key={p.product_id}
              className="mobile-card mobile-btn"
              onClick={() => router.push("/products/" + p.product_id)}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: (CATEGORY_MAP[p.category]?.bg || "#f5f5f5"),
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Package size={20} color={CATEGORY_MAP[p.category]?.color || "#999"} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 3 }}>
                  {p.product_name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#999" }}>{p.product_code || "-"}</span>
                  {getCategoryBadge(p.category)}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>
                  {formatPrice(p.base_price)}
                </div>
                <ChevronRight size={14} color="#ccc" style={{ marginTop: 2 }} />
              </div>
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
