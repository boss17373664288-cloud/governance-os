"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Search } from "lucide-react";
import { api } from "@/lib/api";

const labelStyle : React.CSSProperties = { fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 };
const inputStyle : React.CSSProperties = { width: "100%", height: 44, padding: "0 14px", borderRadius: 12, border: "1px solid #d9d9d9", fontSize: 15, outline: "none", boxSizing: "border-box", background: "#fff" };
const selectStyle : React.CSSProperties = { ...inputStyle, cursor: "pointer" } as any;
const required = { color: "#ff4d4f" };
const cardStyle : React.CSSProperties = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 16, marginBottom: 12 };

export default function MobileConsignmentExchangePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [srcProducts, setSrcProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Customer search
  const [custSearch, setCustSearch] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");

  // Form
  const [sourceProductId, setSourceProductId] = useState("");
  const [targetProductId, setTargetProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");

  // Load all customers
  useEffect(() => {
    api.get("/customers", { params: { page_size: 200 } })
      .then((r: any) => setCustomers(r.data?.items || r.items || []))
      .catch(() => {});
    api.get("/products", { params: { page_size: 500 } })
      .then((r: any) => setAllProducts(r.data?.items || r.items || []))
      .catch(() => {});
  }, []);

  // Load customer's consignment products
  useEffect(() => {
    if (!selectedCustomer) { setSrcProducts([]); setSourceProductId(""); return; }
    api.get("/consignment/ledger", { params: { customer_id: selectedCustomer } })
      .then((r: any) => setSrcProducts(r.data || r || []))
      .catch(() => setSrcProducts([]));
  }, [selectedCustomer]);

  var filteredCusts = customers.filter((c: any) =>
    !custSearch || (c.customer_name || "").toLowerCase().includes(custSearch.toLowerCase()) ||
    (c.customer_code || "").toLowerCase().includes(custSearch.toLowerCase())
  );

  var selectedCustName = customers.find(c => c.customer_id === selectedCustomer)?.customer_name || "";
  var sourceProd = srcProducts.find((p: any) => p.product_id === sourceProductId);
  var maxQty = sourceProd?.remaining_qty || 0;

  // Filter target products: exclude source product, only same brand_series
  var targetProducts = allProducts.filter((p: any) => {
    if (p.product_id === sourceProductId) return false;
    if (!sourceProd) return true;
    // If source has brand_series_id, filter to same series
    if (sourceProd.brand_series_id) {
      return p.brand_series_id === sourceProd.brand_series_id;
    }
    return true;
  });

  var handleSubmit = async () => {
    if (!selectedCustomer) { alert("請選擇客戶"); return; }
    if (!sourceProductId) { alert("請選擇來源產品"); return; }
    if (!targetProductId) { alert("請選擇目標產品"); return; }
    if (quantity < 1) { alert("數量至少為1"); return; }
    if (quantity > maxQty) { alert("換貨數量不可超過寄庫餘額 " + maxQty); return; }
    if (!reason.trim()) { alert("請輸入換貨原因"); return; }
    setSaving(true);
    try {
      await api.post("/consignment/exchange", {
        customer_id: selectedCustomer,
        source_product_id: sourceProductId,
        target_product_id: targetProductId,
        quantity: quantity,
        reason: reason.trim(),
      });
      alert("寄庫換貨成功");
      router.push("/mobile");
    } catch (e: any) {
      alert(e?.response?.data?.message || "換貨失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button className="mobile-btn" onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#333" }}>
          <ArrowLeft size={22} />
        </button>
        <h3 style={{ flex: 1, fontSize: 17, fontWeight: 600, color: "#333", margin: 0 }}>寄庫換貨出庫</h3>
      </div>

      {/* Customer Selection */}
      <div className="mobile-card" style={cardStyle}>
        <div style={labelStyle}>客戶 <span style={required}>*</span></div>
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#f5f5f5", borderRadius: 12, padding: "0 12px" }}>
            <Search size={16} color="#999" />
            <input
              placeholder="搜尋客戶名稱或編碼..."
              value={selectedCustomer ? selectedCustName : custSearch}
              onChange={e => { setCustSearch(e.target.value); setSelectedCustomer(""); setShowCustDropdown(true); }}
              onFocus={() => setShowCustDropdown(true)}
              style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#333", height: 44 }}
            />
          </div>
          {showCustDropdown && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: 200, overflow: "auto", background: "#fff", border: "1px solid #d9d9d9", borderRadius: 12, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", marginTop: 4 }}>
              <div onClick={() => { setSelectedCustomer(""); setCustSearch(""); setShowCustDropdown(false); }}
                style={{ padding: "10px 14px", fontSize: 13, color: "#999", borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}>清除選擇</div>
              {filteredCusts.length === 0 ? (
                <div style={{ padding: "14px", textAlign: "center", color: "#999", fontSize: 13 }}>無匹配客戶</div>
              ) : (
                filteredCusts.slice(0, 50).map((c: any) => (
                  <div key={c.customer_id} onClick={() => { setSelectedCustomer(c.customer_id); setCustSearch(""); setShowCustDropdown(false); }}
                    style={{ padding: "10px 14px", cursor: "pointer", fontSize: 14, color: "#333", borderBottom: "1px solid #f5f5f5", background: selectedCustomer === c.customer_id ? "#e6f4ff" : "transparent" }}>
                    <span style={{ fontWeight: 500 }}>{c.customer_name}</span>
                    <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>{c.customer_code}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Source Product */}
      <div className="mobile-card" style={cardStyle}>
        <div style={labelStyle}>來源產品（換出） <span style={required}>*</span></div>
        {!selectedCustomer ? (
          <div style={{ fontSize: 13, color: "#999", padding: "12px 0" }}>請先選擇客戶</div>
        ) : srcProducts.length === 0 ? (
          <div style={{ fontSize: 13, color: "#999", padding: "12px 0" }}>該客戶無寄庫產品</div>
        ) : (
          <select value={sourceProductId} onChange={e => setSourceProductId(e.target.value)} style={selectStyle}>
            <option value="">請選擇來源產品</option>
            {srcProducts.map((p: any) => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_code} - {p.product_name} (庫存: {p.remaining_qty})
              </option>
            ))}
          </select>
        )}
        {sourceProd && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#fa8c16" }}>
            可用餘額：{sourceProd.remaining_qty}
          </div>
        )}
      </div>

      {/* Target Product */}
      <div className="mobile-card" style={cardStyle}>
        <div style={labelStyle}>目標產品（換入） <span style={required}>*</span></div>
        {!sourceProductId ? (
          <div style={{ fontSize: 13, color: "#999", padding: "12px 0" }}>請先選擇來源產品</div>
        ) : (
          <select value={targetProductId} onChange={e => setTargetProductId(e.target.value)} style={selectStyle}>
            <option value="">請選擇目標產品</option>
            {targetProducts.map((p: any) => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_code} - {p.product_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Quantity */}
      <div className="mobile-card" style={cardStyle}>
        <div style={labelStyle}>換貨數量 <span style={required}>*</span></div>
        <input type="number" min={1} max={maxQty || 9999}
          value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 0)}
          style={inputStyle} />
        {maxQty > 0 && <div style={{ marginTop: 6, fontSize: 11, color: "#999" }}>最大可換貨數量：{maxQty}</div>}
      </div>

      {/* Reason */}
      <div className="mobile-card" style={cardStyle}>
        <div style={labelStyle}>換貨原因 <span style={required}>*</span></div>
        <textarea
          placeholder="請輸入換貨原因..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          style={{ ...inputStyle, height: "auto", padding: "12px 14px", resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      {/* Submit */}
      <button className="mobile-btn" onClick={handleSubmit} disabled={saving}
        style={{ width: "100%", height: 48, borderRadius: 12, border: "none",
          background: saving ? "#b39ddb" : "#2f54eb", color: "#fff", fontSize: 16,
          fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Save size={20} />
        {saving ? "換貨中..." : "確認換貨"}
      </button>
    </div>
  );
}
