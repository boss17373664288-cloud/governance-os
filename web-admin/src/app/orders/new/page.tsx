"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { api } from "../../../lib/api";

const ORDER_TYPES = [
  { value: "ONE_TIME", label: "一次性出貨" },
  { value: "PARTIAL_CONSIGNMENT", label: "部分出貨 + 寄庫" },
];

const s_i: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box" };
const s_s: React.CSSProperties = { background: "#fff", cursor: "pointer", width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box" };
const s_l: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const s_c: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 20, marginBottom: 16 };
const s_bp: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const s_bd: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" };
const s_br: React.CSSProperties = { height: 28, padding: "0 10px", borderRadius: 4, border: "1px solid #ffccc7", background: "#fff", color: "#ff4d4f", fontSize: 12, cursor: "pointer" };

export default function NewOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orderType, setOrderType] = useState("ONE_TIME");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [items, setItems] = useState<any[]>([{ key: 0, product_id: "", quantity: 1, consignment_quantity: 0, unit_price: 0 }]);

  useEffect(() => {
    api.get("/customers", { params: { page_size: 200 } }).then((r: any) => setCustomers(r.data.items || [])).catch(() => {});
    api.get("/products", { params: { page_size: 200 } }).then((r: any) => setProducts(r.data.items || [])).catch(() => {});
  }, []);

  const updateItem = (key: number, field: string, value: any) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, [field]: value } : i));
  };

  const addItem = () => {
    setItems(prev => { const mk = Math.max(...prev.map(i => i.key), 0); return [...prev, { key: mk + 1, product_id: "", quantity: 1, consignment_quantity: 0, unit_price: 0 }]; });
  };

  const removeItem = (key: number) => { setItems(prev => prev.length <= 1 ? prev : prev.filter(i => i.key !== key)); };

  const handleSubmit = async () => {
    if (!selectedCustomer) { alert("請選擇客戶"); return; }
    const oi = items.filter(i => i.product_id);
    if (oi.length === 0) { alert("請至少選擇一個產品"); return; }
    for (const i of oi) { if (i.quantity < 1) { alert("數量至少為1"); return; } if (i.unit_price <= 0) { alert("單價需大於0"); return; } }
    setSaving(true);
    try {
      await api.post("/sales-orders", { customer_id: selectedCustomer, order_type: orderType, items: oi.map(i => ({ product_id: i.product_id, quantity: i.quantity, consignment_quantity: orderType === "PARTIAL_CONSIGNMENT" ? i.consignment_quantity : 0, unit_price: i.unit_price })) });
      alert("訂單建立成功"); router.push("/orders");
    } catch (e: any) { alert(e?.response?.data?.message || "建立失敗"); } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push("/orders")} style={{ ...s_bd, width: 36, padding: 0, fontSize: 18 }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#333", margin: 0, flex: 1 }}>新增銷售訂單</h1>
        <button onClick={() => router.push("/orders")} style={s_bd}>取消</button>
        <button onClick={handleSubmit} disabled={saving} style={{ ...s_bp, opacity: saving ? 0.6 : 1 }}>{saving ? "建立中..." : "建立訂單"}</button>
      </div>
      <div style={s_c}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>訂單資訊</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          <div><div style={s_l}>訂單類型 <span style={{ color: "#ff4d4f" }}>*</span></div>
            <select value={orderType} onChange={e => setOrderType(e.target.value)} style={s_s}>{ORDER_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div><div style={s_l}>客戶 <span style={{ color: "#ff4d4f" }}>*</span></div>
            <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} style={s_s}><option value="">請選擇客戶</option>{customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_code} - {c.customer_name}</option>)}</select></div>
        </div>
      </div>
      <div style={s_c}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: 0 }}>訂單明細</h3>
          <button onClick={addItem} style={{ ...s_bp, height: 28, fontSize: 12, padding: "0 12px" }}>+ 新增明細</button>
        </div>
        {items.map((item) => {
          const la = item.quantity * item.unit_price;
          const iq = item.quantity - (orderType === "PARTIAL_CONSIGNMENT" ? item.consignment_quantity : 0);
          return (
            <div key={item.key} style={{ background: "#fafafa", borderRadius: 4, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: "1 1 240px", minWidth: 200 }}>
                  <div style={s_l}>產品 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <select style={s_s} value={item.product_id} onChange={e => { const pid = e.target.value; const prod = products.find(p => p.product_id === pid); updateItem(item.key, "product_id", pid); if (prod) { updateItem(item.key, "unit_price", Number(prod.base_price) || 0); } }}>
                    <option value="">請選擇產品</option>
                    {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_code} - {p.product_name}</option>)}
                  </select>
                </div>
                <div style={{ width: 80 }}><div style={s_l}>數量 *</div><input style={s_i} type="number" min={1} value={item.quantity} onChange={e => updateItem(item.key, "quantity", parseInt(e.target.value) || 0)} /></div>
                {orderType === "PARTIAL_CONSIGNMENT" && (<div style={{ width: 80 }}><div style={s_l}>寄庫數</div><input style={s_i} type="number" min={0} max={item.quantity} value={item.consignment_quantity} onChange={e => updateItem(item.key, "consignment_quantity", Math.min(parseInt(e.target.value) || 0, item.quantity))} /></div>)}
                <div style={{ width: 130 }}><div style={s_l}>單價 (NT$)</div><input style={s_i} type="number" min={0} step="0.01" value={item.unit_price} onChange={e => updateItem(item.key, "unit_price", parseFloat(e.target.value) || 0)} />{item.product_id && (() => { const p = products.find(x => x.product_id === item.product_id); return p?.minimum_price ? <div style={{ fontSize: 10, color: "#fa8c16", marginTop: 2 }}>最低限價: NT$ {Number(p.minimum_price).toLocaleString()}</div> : null; })()}</div>
                <div style={{ width: 100, textAlign: "right" }}><div style={s_l}>小計</div><div style={{ fontSize: 14, fontWeight: 600, color: "#333", padding: "6px 0" }}>NT$ {la.toLocaleString("zh-TW")}</div></div>
                <div><button onClick={() => removeItem(item.key)} style={s_br}>刪除</button></div>
              </div>
              {orderType === "PARTIAL_CONSIGNMENT" && (<div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>立即出貨: {iq} | 寄庫: {item.consignment_quantity}</div>)}
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}