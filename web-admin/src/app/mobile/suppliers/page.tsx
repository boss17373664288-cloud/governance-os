"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Building2 } from "lucide-react";
import { api } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = { ACTIVE: "#52c41a", LEAD: "#fa8c16", INACTIVE: "#999" };

export default function MobileSuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 15;

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (search.trim()) params.search = search.trim();
      const res: any = await api.get("/suppliers", { params });
      const data = res.data || res;
      setSuppliers(data.items || []);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: 0 }}>供應商列表</h3>
        <button className="mobile-btn" onClick={() => router.push("/mobile/suppliers/new")}
          style={{ background: "#1890ff", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <Plus size={16} /> 新增
        </button>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#fff", borderRadius: 12, padding: "10px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <Search size={16} color="#999" />
          <input placeholder="搜尋供應商名稱或編碼..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, marginLeft: 8, background: "transparent" }} />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 14 }}>載入中...</div>
      ) : suppliers.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 14 }}>尚無供應商</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {suppliers.map((s: any) => (
            <div key={s.supplier_id} className="mobile-card mobile-btn"
              onClick={() => router.push("/suppliers/" + s.supplier_id)}
              style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eb2f9615", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Building2 size={20} color="#eb2f96" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>{s.supplier_name || "-"}</div>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{s.supplier_code || "-"}</div>
                </div>
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 16, fontSize: 12, color: "#666" }}>
                {s.contact_person && <span>👤 {s.contact_person}</span>}
                {s.contact_phone && <span>📞 {s.contact_phone}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16, paddingBottom: 16 }}>
          <button className="mobile-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d9d9d9", background: page <= 1 ? "#f5f5f5" : "#fff", color: page <= 1 ? "#ccc" : "#333", fontSize: 13, cursor: page <= 1 ? "default" : "pointer" }}>
            上一頁
          </button>
          <span style={{ fontSize: 13, color: "#666" }}>{page} / {totalPages}</span>
          <button className="mobile-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d9d9d9", background: page >= totalPages ? "#f5f5f5" : "#fff", color: page >= totalPages ? "#ccc" : "#333", fontSize: 13, cursor: page >= totalPages ? "default" : "pointer" }}>
            下一頁
          </button>
        </div>
      )}
    </div>
  );
}
