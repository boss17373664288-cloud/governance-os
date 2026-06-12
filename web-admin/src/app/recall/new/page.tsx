"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { api } from "../../../lib/api";

const LEVEL_OPTIONS = [
  { value: "R1", label: "觀察 R1 - 單起客訴/內部關注/輕微異常", color: "#52c41a" },
  { value: "R2", label: "內部限制 R2 - 多起客訴/重複異常", color: "#fa8c16" },
  { value: "R3", label: "正式召回 R3 - 品質問題/法規要求/可能影響患者安全", color: "#ff4d4f" },
  { value: "R4", label: "緊急召回 R4 - 醫療傷害事件/重大風險", color: "#cf1322" },
];

const inputStyle: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box" };
const selectStyle: React.CSSProperties = { ...inputStyle, background: "#fff", cursor: "pointer" };
const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 20, marginBottom: 16 };
const btnPrimary: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const btnDefault: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" };

export default function NewRecallPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [batches, setBatches] = useState<any[]>([]);
  const [form, setForm] = useState({
    recall_level: "R1",
    product_id: "",
    batch_no: "",
    description: "",
    discovery_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    api.get("/products", { params: { page_size: 500 } }).then((res: any) => setProducts(res.data.items || []));
    api.get("/inventory/batches", { params: { page_size: 9999 } }).then((res: any) => setBatches(res.data.items || []));
  }, []);

  const filteredProducts = products.filter(p =>
    !productSearch || p.product_name?.includes(productSearch) || p.product_code?.includes(productSearch)
  );

  // Get selected product info
  const selectedProduct = products.find(p => p.product_id === form.product_id);
  // Filter batches by selected product
  const filteredBatches = batches.filter(b => b.product_id === form.product_id);
  // When product changes, reset batch_no if current batch doesn't belong to new product
  const handleProductChange = (productId: string) => {
    setForm(prev => ({
      ...prev,
      product_id: productId,
      batch_no: "",
    }));
  };

  const handleSubmit = async () => {
    if (!form.product_id) { alert("請選擇產品"); return; }
    if (!form.batch_no.trim()) { alert("請輸入批號"); return; }

    setSaving(true);
    try {
      await api.post("/recall", {
        recall_level: form.recall_level,
        product_id: form.product_id,
        batch_no: form.batch_no.trim(),
        description: form.description || undefined,
        discovery_date: form.discovery_date,
      });
      alert("召回案件建立成功");
      router.push("/recall");
    } catch (e: any) {
      alert(e?.response?.data?.message || "建立失敗");
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push("/recall")} style={{ ...btnDefault, width: 36, padding: 0, fontSize: 18 }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#333", margin: 0, flex: 1 }}>新建召回案件</h1>
        <button onClick={() => router.push("/recall")} style={btnDefault}>取消</button>
        <button onClick={handleSubmit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
          {saving ? "建立中..." : "建立案件"}
        </button>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>案件資訊</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {/* Recall Level */}
          <div>
            <div style={fieldLabel}>召回等級 <span style={{ color: "#ff4d4f" }}>*</span></div>
            <select style={selectStyle} value={form.recall_level} onChange={e => setForm({ ...form, recall_level: e.target.value })}>
              {LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Discovery Date */}
          <div>
            <div style={fieldLabel}>發現日期</div>
            <input style={inputStyle} type="date" value={form.discovery_date} onChange={e => setForm({ ...form, discovery_date: e.target.value })} />
          </div>

          {/* Product */}
          <div>
            <div style={fieldLabel}>產品 <span style={{ color: "#ff4d4f" }}>*</span></div>
            <select style={selectStyle} value={form.product_id} onChange={e => handleProductChange(e.target.value)}>
              <option value="">請選擇產品</option>
              {filteredProducts.map(p => (
                <option key={p.product_id} value={p.product_id}>{p.product_code} - {p.product_name}</option>
              ))}
            </select>
            {/* Search input for quick filter */}
            <input
              style={{ ...inputStyle, marginTop: 4, height: 28, fontSize: 11 }}
              placeholder="搜索產品名稱/編碼..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
            />
          </div>

          {/* Batch Number */}
          <div>
            <div style={fieldLabel}>批號 <span style={{ color: "#ff4d4f" }}>*</span></div>
            <select
              style={selectStyle}
              value={form.batch_no}
              onChange={e => setForm({ ...form, batch_no: e.target.value })}
              disabled={!form.product_id}
            >
              <option value="">{form.product_id ? "請選擇批號" : "請先選擇產品"}</option>
              {filteredBatches.map((b: any) => (
                <option key={b.batch_id} value={b.batch_no}>
                  {b.batch_no}{b.product_code ? " - " + b.product_code : ""}{b.qa_status ? " [" + b.qa_status + "]" : ""}
                </option>
              ))}
            </select>
            {selectedProduct && (
              <div style={{ fontSize: 11, color: "#52c41a", marginTop: 2 }}>
                已選產品：{selectedProduct.product_code} - {selectedProduct.product_name}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginTop: 16 }}>
          <div style={fieldLabel}>召回說明</div>
          <textarea
            style={{ ...inputStyle, height: 100, padding: "8px 12px", resize: "vertical", width: "100%" }}
            placeholder="請描述召回原因、發現情況等..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </div>

      {/* Level Info */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f0f0f0" }}>召回等級說明</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {LEVEL_OPTIONS.map(o => (
            <div key={o.value} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #fafafa" }}>
              <span style={{ display: "inline-block", width: 28, height: 20, lineHeight: "20px", textAlign: "center", borderRadius: 2, background: o.color, color: "#fff", fontSize: 10, fontWeight: 600 }}>{o.value}</span>
              <span style={{ fontSize: 13, color: "#666" }}>{o.label}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
