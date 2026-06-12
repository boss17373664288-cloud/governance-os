"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { api } from "@/lib/api";

const inputStyle: React.CSSProperties = { width: "100%", height: 44, padding: "0 14px", borderRadius: 12, border: "1px solid #d9d9d9", fontSize: 15, outline: "none", boxSizing: "border-box", background: "#fff" };
const selectStyle = { ...inputStyle, cursor: "pointer" } as React.CSSProperties;
const labelStyle: React.CSSProperties = { fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 };
const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 16, marginBottom: 12 };

export default function MobileConsignmentReleasePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [srcProducts, setSrcProducts] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [sourceProductId, setSourceProductId] = useState("");
  const [selectedProd, setSelectedProd] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [custSearch, setCustSearch] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  useEffect(() => {
    api.get("/customers", { params: { page_size: 200 } })
      .then((r: any) => setCustomers(r.data?.items || r.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      api.get("/consignment/ledger", { params: { customer_id: selectedCustomer.customer_id } })
        .then((r: any) => setSrcProducts(r.data || r || []))
        .catch(() => setSrcProducts([]));
    } else {
      setSrcProducts([]);
      setSourceProductId("");
    }
  }, [selectedCustomer]);

  useEffect(() => {
    setSelectedProd(srcProducts.find((p: any) => p.product_id === sourceProductId) || null);
  }, [sourceProductId, srcProducts]);

  const filtered = customers.filter((c: any) =>
    !custSearch ||
    (c.customer_name || "").toLowerCase().includes(custSearch.toLowerCase()) ||
    (c.customer_code || "").toLowerCase().includes(custSearch.toLowerCase())
  );
  const maxQty = selectedProd?.remaining_qty || 0;

  const handleSubmit = async () => {
    if (!selectedCustomer) { alert("請選擇客戶"); return; }
    if (!sourceProductId) { alert("請選擇產品"); return; }
    if (quantity < 1) { alert("數量至少為1"); return; }
    if (quantity > maxQty) { alert("出庫數量不可超過寄庫餘額 " + maxQty); return; }
    setSaving(true);
    try {
      await api.post("/consignment/release", {
        customer_id: selectedCustomer.customer_id,
        product_id: sourceProductId,
        quantity
      });
      alert("寄庫出庫成功");
      router.push("/mobile");
    } catch (e: any) {
      alert(e?.response?.data?.message || "出庫失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <button className="mobile-btn" onClick={() => router.back()}
          style={{ background: "none", border: "none", padding: 8, cursor: "pointer", minWidth: 44, minHeight: 44 }}>
          <ArrowLeft size={22} color="#333" />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, flex: 1 }}>寄庫出庫</h1>
      </div>
      <div className="mobile-card" style={cardStyle}>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <div style={labelStyle}>客戶 <span style={{ color: "#ff4d4f" }}>*</span></div>
          <input style={inputStyle} placeholder="搜尋客戶名稱或編碼..."
            value={selectedCustomer ? selectedCustomer.customer_name : custSearch}
            onChange={e => { setCustSearch(e.target.value); setShowCustDropdown(true); }}
            onFocus={() => setShowCustDropdown(true)} />
          {showCustDropdown && (
            <div style={{ position: "absolute", top: 44, left: 0, right: 0, maxHeight: 200, overflow: "auto", background: "#fff", border: "1px solid #d9d9d9", borderRadius: 8, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <div style={{ padding: "8px 12px", fontSize: 12, color: "#999", cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                onMouseDown={() => { setSelectedCustomer(null); setCustSearch(""); setShowCustDropdown(false); }}>
                清除選擇
              </div>
              {filtered.slice(0, 50).map((c: any) => (
                <div key={c.customer_id}
                  style={{ padding: "10px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f5f5f5" }}
                  onMouseDown={() => { setSelectedCustomer(c); setCustSearch(""); setShowCustDropdown(false); }}>
                  <span style={{ fontWeight: 500 }}>{c.customer_name}</span>
                  <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>{c.customer_code}</span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", color: "#999", fontSize: 13 }}>無匹配客戶</div>
              )}
            </div>
          )}
        </div>
        {selectedCustomer && srcProducts.length === 0 && (
          <div style={{ fontSize: 13, color: "#999", padding: "12px 0" }}>該客戶無寄庫產品</div>
        )}
        {srcProducts.length > 0 && (
          <>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>產品 <span style={{ color: "#ff4d4f" }}>*</span></div>
              <select value={sourceProductId} onChange={e => setSourceProductId(e.target.value)} style={selectStyle}>
                <option value="">請選擇產品</option>
                {srcProducts.map((p: any) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_name || p.product_code} (剩餘: {p.remaining_qty})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>數量 <span style={{ color: "#ff4d4f" }}>*</span></div>
              <input type="number" style={inputStyle} value={quantity} min={1} max={maxQty}
                onChange={e => setQuantity(parseInt(e.target.value) || 1)} />
              <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>可出庫上限：{maxQty}</div>
            </div>
          </>
        )}
      </div>
      <button className="mobile-btn" onClick={handleSubmit} disabled={saving}
        style={{
          width: "100%", height: 48, borderRadius: 12, border: "none",
          background: saving ? "#91caff" : "#1890ff", color: "#fff",
          fontSize: 16, fontWeight: 600,
          cursor: saving ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
        <Save size={20} />
        {saving ? "處理中..." : "確認出庫"}
      </button>
    </div>
  );
}