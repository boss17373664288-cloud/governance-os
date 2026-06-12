"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Search } from "lucide-react";
import { api } from "@/lib/api";

const inputStyle: React.CSSProperties = { width: "100%", height: 44, padding: "0 14px", borderRadius: 12, border: "1px solid #d9d9d9", fontSize: 15, outline: "none", boxSizing: "border-box", background: "#fff" };
const selectStyle = { ...inputStyle, cursor: "pointer" } as React.CSSProperties;
const labelStyle: React.CSSProperties = { fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 };
const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 16, marginBottom: 12 };
const required = { color: "#ff4d4f" };

export default function MobileNewOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [form, setForm] = useState({ customer_id: "", order_type: "ONE_TIME" });
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ product_id: "", quantity: 1, unit_price: 0 });

  useEffect(() => { api.get("/customers", { params: { page_size: 200 } }).then((r: any) => setCustomers(r.data?.items || r.items || [])).catch(() => {}); api.get("/products").then((r: any) => setProducts(r.data?.items || r.items || [])).catch(() => {}); }, []);

  const filtered = customers.filter((c: any) => !custSearch || (c.customer_name || "").toLowerCase().includes(custSearch.toLowerCase()) || (c.customer_code || "").toLowerCase().includes(custSearch.toLowerCase()));

  const addItem = () => {
    if (!newItem.product_id) { alert("請選擇產品"); return; }
    const prod = products.find((p: any) => p.product_id === newItem.product_id);
    setItems([...items, { ...newItem, product_name: prod?.product_name || "", subtotal: newItem.quantity * newItem.unit_price }]);
    setNewItem({ product_id: "", quantity: 1, unit_price: 0 });
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!form.customer_id) { alert("請選擇客戶"); return; }
    if (items.length === 0) { alert("請至少新增一項明細"); return; }
    setSaving(true);
    try {
      await api.post("/orders", { ...form, items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })) });
      alert("訂單建立成功");
      router.push("/mobile/orders");
    } catch (e: any) { alert(e?.response?.data?.message || "建立失敗"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <button className="mobile-btn" onClick={() => router.back()} style={{ background: "none", border: "none", padding: 8, cursor: "pointer", minWidth: 44, minHeight: 44 }}><ArrowLeft size={22} color="#333" /></button>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, flex: 1 }}>新增銷售訂單</h1>
      </div>
      <div className="mobile-card" style={cardStyle}>
        <div style={{ marginBottom: 14 }}><div style={labelStyle}>訂單類型 <span style={required}>*</span></div>
          <select value={form.order_type} onChange={e => setForm({ ...form, order_type: e.target.value })} style={selectStyle}>
            <option value="ONE_TIME">一次性出貨</option><option value="PARTIAL_CONSIGNMENT">部分出貨+寄庫</option>
          </select>
        </div>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <div style={labelStyle}>客戶 <span style={required}>*</span></div>
          <input style={inputStyle} placeholder="搜尋客戶..." value={custSearch} onChange={e => { setCustSearch(e.target.value); setShowCustDropdown(true); }} onFocus={() => setShowCustDropdown(true)} />
          {showCustDropdown && (
            <div style={{ position: "absolute", top: 44, left: 0, right: 0, maxHeight: 200, overflow: "auto", background: "#fff", border: "1px solid #d9d9d9", borderRadius: 8, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              {filtered.slice(0, 50).map((c: any) => (
                <div key={c.customer_id} style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f5f5f5" }} onMouseDown={() => { setForm({ ...form, customer_id: c.customer_id }); setCustSearch(c.customer_name); setShowCustDropdown(false); }}>
                  <span style={{ fontWeight: 500 }}>{c.customer_name}</span><span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>{c.customer_code}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mobile-card" style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>訂單明細</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <select style={{ ...selectStyle, flex: 1, minWidth: 120 }} value={newItem.product_id} onChange={e => setNewItem({ ...newItem, product_id: e.target.value })}>
            <option value="">請選擇產品</option>
            {products.map((p: any) => <option key={p.product_id} value={p.product_id}>{p.product_code} {p.product_name}</option>)}
          </select>
          <input type="number" placeholder="數量" style={{ ...inputStyle, width: 70 }} value={newItem.quantity} min={1} onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })} />
          <input type="number" placeholder="單價" style={{ ...inputStyle, width: 90 }} value={newItem.unit_price} min={0} onChange={e => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })} />
          <button className="mobile-btn" onClick={addItem} style={{ minWidth: 44, minHeight: 44, borderRadius: 8, border: "none", background: "#1890ff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={18} /></button>
        </div>
        {items.length > 0 && (
          <div>
            {items.map((item: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
                <span style={{ flex: 1 }}>{item.product_name}</span>
                <span style={{ width: 50, textAlign: "center" }}>x{item.quantity}</span>
                <span style={{ width: 70, textAlign: "right" }}>NT$ {item.subtotal || 0}</span>
                <button className="mobile-btn" onClick={() => removeItem(i)} style={{ background: "none", border: "none", color: "#ff4d4f", cursor: "pointer", padding: 4 }}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button className="mobile-btn" onClick={handleSubmit} disabled={saving} style={{ width: "100%", height: 48, borderRadius: 12, border: "none", background: saving ? "#91caff" : "#1890ff", color: "#fff", fontSize: 16, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Save size={20} />{saving ? "建立中..." : "建立訂單"}
      </button>
    </div>
  );
}
