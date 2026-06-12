"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { api } from "../../../lib/api";

const PURPOSE_OPTIONS = [
  { value: "PRODUCT_TEST", label: "產品測試" },
  { value: "CLINICAL_TRIAL", label: "臨床試驗" },
  { value: "PROMOTION", label: "推廣活動" },
  { value: "COMPETITOR_ANALYSIS", label: "競品分析" },
];

const inputStyle: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box" };
const selectStyle: React.CSSProperties = { ...inputStyle, background: "#fff", cursor: "pointer" };
const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 20, marginBottom: 16 };
const btnPrimary: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const btnDefault: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" };
const btnDanger: React.CSSProperties = { height: 28, padding: "0 10px", borderRadius: 3, border: "1px solid #ffccc7", background: "#fff", color: "#ff4d4f", fontSize: 12, cursor: "pointer" };

export default function NewSamplePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [form, setForm] = useState({
    customer_id: "", purpose: "PRODUCT_TEST",
    items: [{ product_id: "", quantity: 1 }] as { product_id: string; quantity: number }[],
  });

  const MAX_ITEMS = 5;

  useEffect(() => {
    api.get("/customers", { params: { page_size: 200 } }).then((res: any) => setCustomers(res.data.items || []));
    api.get("/products", { params: { page_size: 200 } }).then((res: any) => setProducts(res.data.items || []));
  }, []);

  const filteredCustomers = customers.filter(c =>
    !customerSearch || c.customer_name?.includes(customerSearch) || c.customer_code?.includes(customerSearch)
  );

  const updateItem = (index: number, field: "product_id" | "quantity", value: any) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: field === "quantity" ? Math.max(1, parseInt(value) || 1) : value } : item),
    }));
  };

  const addItem = () => {
    if (form.items.length >= MAX_ITEMS) { alert("最多可選 " + MAX_ITEMS + " 個產品"); return; }
    setForm(prev => ({ ...prev, items: [...prev.items, { product_id: "", quantity: 1 }] }));
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!form.customer_id) { alert("請選擇客戶"); return; }
    const validItems = form.items.filter(i => i.product_id);
    if (validItems.length === 0) { alert("請至少選擇一個產品"); return; }
    for (const item of validItems) {
      if (item.quantity < 1) { alert("數量至少為1"); return; }
    }
    // Check for duplicate products
    const productIds = validItems.map(i => i.product_id);
    if (new Set(productIds).size !== productIds.length) { alert("不可重複選擇相同產品"); return; }

    setSaving(true);
    try {
      const r: any = await api.post("/sample-requests", {
        customer_id: form.customer_id,
        purpose: form.purpose,
        items: validItems,
      });
      alert("打板申請建立成功，共 " + (r.data?.count || validItems.length) + " 筆");
      router.push("/samples");
    } catch (e: any) {
      alert(e?.response?.data?.message || "建立失敗");
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push("/samples")} style={{ ...btnDefault, width: 36, padding: 0, fontSize: 18 }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#333", margin: 0, flex: 1 }}>新增打板申請</h1>
        <button onClick={() => router.push("/samples")} style={btnDefault}>取消</button>
        <button onClick={handleSubmit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
          {saving ? "建立中..." : "建立申請"}
        </button>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>打板資訊</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          <div>
            <div style={fieldLabel}>客戶 <span style={{ color: "#ff4d4f" }}>*</span></div>
            <select style={selectStyle} value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">請選擇客戶</option>
              {filteredCustomers.map(c => (
                <option key={c.customer_id} value={c.customer_id}>{c.customer_code} - {c.customer_name}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={fieldLabel}>打板目的 <span style={{ color: "#ff4d4f" }}>*</span></div>
            <select style={selectStyle} value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}>
              {PURPOSE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: 0 }}>打板產品（最多 {MAX_ITEMS} 個）</h3>
          <button onClick={addItem} disabled={form.items.length >= MAX_ITEMS}
            style={{ ...btnPrimary, height: 28, fontSize: 12, padding: "0 12px", opacity: form.items.length >= MAX_ITEMS ? 0.5 : 1 }}>
            + 新增產品
          </button>
        </div>

        {form.items.map((item, index) => (
          <div key={index} style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 12, padding: 12, background: "#fafafa", borderRadius: 4 }}>
            <div style={{ flex: "1 1 300px", minWidth: 200 }}>
              <div style={fieldLabel}>產品 {index + 1} <span style={{ color: "#ff4d4f" }}>*</span></div>
              <select style={selectStyle} value={item.product_id} onChange={e => updateItem(index, "product_id", e.target.value)}>
                <option value="">請選擇產品</option>
                {products
                  .filter(p => !form.items.some((it, i) => i !== index && it.product_id === p.product_id))
                  .map(p => (
                    <option key={p.product_id} value={p.product_id}>{p.product_code} - {p.product_name}</option>
                  ))}
              </select>
            </div>
            <div style={{ width: 100 }}>
              <div style={fieldLabel}>數量 <span style={{ color: "#ff4d4f" }}>*</span></div>
              <input style={inputStyle} type="number" min={1} value={item.quantity} onChange={e => updateItem(index, "quantity", e.target.value)} />
            </div>
            {form.items.length > 1 && (
              <button onClick={() => removeItem(index)} style={btnDanger}>✕ 移除</button>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}