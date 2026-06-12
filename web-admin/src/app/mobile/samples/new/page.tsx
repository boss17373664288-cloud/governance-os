"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

const inputStyle: React.CSSProperties = { width: "100%", height: 44, padding: "0 14px", borderRadius: 12, border: "1px solid #d9d9d9", fontSize: 15, outline: "none", boxSizing: "border-box", background: "#fff" };
const selectStyle = { ...inputStyle, cursor: "pointer" } as React.CSSProperties;
const labelStyle: React.CSSProperties = { fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 };
const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 16, marginBottom: 12 };

export default function MobileNewSamplePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ customer_id: "", purpose: "NEW_PRODUCT_PROMOTION", notes: "" });
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ product_id: "", quantity: 1 });

  useEffect(() => { api.get("/customers", { params: { page_size: 200 } }).then((r: any) => setCustomers(r.data?.items || r.items || [])).catch(() => {}); api.get("/products").then((r: any) => setProducts(r.data?.items || r.items || [])).catch(() => {}); }, []);

  const addItem = () => {
    if (!newItem.product_id) { alert("請選擇產品"); return; }
    if (items.length >= 5) { alert("最多可選5種產品"); return; }
    const prod = products.find((p: any) => p.product_id === newItem.product_id);
    setItems([...items, { product_id: newItem.product_id, product_name: prod?.product_name || "", quantity: newItem.quantity }]);
    setNewItem({ product_id: "", quantity: 1 });
  };

  const handleSubmit = async () => {
    if (!form.customer_id) { alert("請選擇客戶"); return; }
    if (items.length === 0) { alert("請至少新增一項產品"); return; }
    setSaving(true);
    try {
      await api.post("/sample-requests", { ...form, items });
      alert("打板申請建立成功");
      router.push("/mobile/samples");
    } catch (e: any) { alert(e?.response?.data?.message || "建立失敗"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <button className="mobile-btn" onClick={() => router.back()} style={{ background: "none", border: "none", padding: 8, cursor: "pointer", minWidth: 44, minHeight: 44 }}><ArrowLeft size={22} color="#333" /></button>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, flex: 1 }}>新增打板申請</h1>
      </div>
      <div className="mobile-card" style={cardStyle}>
        <div style={{ marginBottom: 14 }}><div style={labelStyle}>客戶 *</div>
          <select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} style={selectStyle}>
            <option value="">請選擇客戶</option>
            {customers.map((c: any) => <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}><div style={labelStyle}>目的</div>
          <select value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} style={selectStyle}>
            <option value="NEW_PRODUCT_PROMOTION">新產品推廣</option><option value="CUSTOMER_REQUEST">客戶要求</option><option value="QUALITY_VERIFICATION">品質驗證</option><option value="REGULATORY_REQUIREMENT">法規要求</option>
          </select>
        </div>
        <div><div style={labelStyle}>備註</div><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, height: "auto", padding: "12px 14px", resize: "vertical" }} /></div>
      </div>
      <div className="mobile-card" style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>打板產品（最多5項）</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <select style={{ ...selectStyle, flex: 1 }} value={newItem.product_id} onChange={e => setNewItem({ ...newItem, product_id: e.target.value })}>
            <option value="">請選擇產品</option>
            {products.map((p: any) => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
          </select>
          <input type="number" style={{ ...inputStyle, width: 70 }} value={newItem.quantity} min={1} onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })} placeholder="數量" />
          <button className="mobile-btn" onClick={addItem} style={{ minWidth: 44, minHeight: 44, borderRadius: 8, border: "none", background: "#1890ff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={18} /></button>
        </div>
        {items.map((item: any, i: number) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
            <span>{item.product_name}</span><span>x{item.quantity}</span>
            <button className="mobile-btn" onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#ff4d4f", cursor: "pointer" }}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <button className="mobile-btn" onClick={handleSubmit} disabled={saving} style={{ width: "100%", height: 48, borderRadius: 12, border: "none", background: saving ? "#91caff" : "#1890ff", color: "#fff", fontSize: 16, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Save size={20} />{saving ? "建立中..." : "建立申請"}
      </button>
    </div>
  );
}
