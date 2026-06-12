"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { api } from "../../../lib/api";

const inputStyle: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box" };
const selectStyle: React.CSSProperties = { ...inputStyle, background: "#fff", cursor: "pointer" };
const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 20, marginBottom: 16 };
const btnPrimary: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const btnDefault: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" };

const nextCode = () => {
  const n = Math.floor(Math.random() * 900 + 100);
  return "PROD-" + String(n).padStart(3, "0");
};

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_code: nextCode(),
    product_name: "",
    product_short_name: "",
    product_barcode: "",
    product_category: "DEVICE",
    product_specification: "",
    recall_level: "R1",
    medical_device_flag: false,
    medical_device_class: "",
    medical_registration_no: "",
    expiration_days: "",
    base_price: "",
    minimum_price: "",
    qa_review_required: true,
  });

  const update = (f: string, v: any) => setForm({ ...form, [f]: v });

  const handleSubmit = async () => {
    if (!form.product_name.trim()) { alert("請輸入產品名稱"); return; }
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (payload.expiration_days === "") payload.expiration_days = null;
      if (payload.base_price === "") payload.base_price = null;
      if (payload.minimum_price === "") payload.minimum_price = null;
      const res = await api.post("/products", payload);
      alert("產品建立成功");
      router.push("/products/" + res.data.product_id);
    } catch (e: any) {
      alert(e?.response?.data?.message || "建立失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push("/products")} style={{ ...btnDefault, width: 36, padding: 0, fontSize: 18 }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#333", margin: 0, flex: 1 }}>新增產品</h1>
        <button onClick={() => router.push("/products")} style={btnDefault}>取消</button>
        <button onClick={handleSubmit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
          {saving ? "建立中..." : "建立產品"}
        </button>
      </div>

      {/* ====== Basic Info ====== */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>基本資料</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          <div>
            <div style={fieldLabel}>產品編碼 <span style={{ color: "#999", fontWeight: 400 }}>(系統自動)</span></div>
            <input style={{ ...inputStyle, background: "#f5f5f5", color: "#999" }} value={form.product_code} readOnly />
          </div>
          <div>
            <div style={fieldLabel}>產品名稱 <span style={{ color: "#ff4d4f" }}>*</span></div>
            <input style={inputStyle} value={form.product_name} onChange={e => update("product_name", e.target.value)} placeholder="請輸入產品名稱" />
          </div>
          <div>
            <div style={fieldLabel}>產品短稱</div>
            <input style={inputStyle} value={form.product_short_name} onChange={e => update("product_short_name", e.target.value)} />
          </div>
          <div>
            <div style={fieldLabel}>條碼</div>
            <input style={inputStyle} value={form.product_barcode} onChange={e => update("product_barcode", e.target.value)} />
          </div>
          <div>
            <div style={fieldLabel}>產品類別 <span style={{ color: "#ff4d4f" }}>*</span></div>
            <select style={selectStyle} value={form.product_category} onChange={e => update("product_category", e.target.value)}>
              <option value="DEVICE">醫療器材</option>
              <option value="COSMETIC">醫學美容</option>
              <option value="CONSUMABLE">耗材</option>
            </select>
          </div>
          <div>
            <div style={fieldLabel}>規格</div>
            <input style={inputStyle} value={form.product_specification} onChange={e => update("product_specification", e.target.value)} placeholder="例: 5ml / 100片" />
          </div>
          <div>
            <div style={fieldLabel}>召回等級</div>
            <select style={selectStyle} value={form.recall_level} onChange={e => update("recall_level", e.target.value)}>
              <option value="R1">R1 - 觀察</option>
              <option value="R2">R2 - 內部限制</option>
              <option value="R3">R3 - 正式召回</option>
              <option value="R4">R4 - 緊急召回</option>
            </select>
          </div>
        </div>
      </div>

      {/* ====== Price ====== */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>價格資訊</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          <div>
            <div style={fieldLabel}>牌價 (NT$)</div>
            <input style={inputStyle} type="number" step="0.01" value={form.base_price} onChange={e => update("base_price", e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <div style={fieldLabel}>最低售價 (NT$)</div>
            <input style={inputStyle} type="number" step="0.01" value={form.minimum_price} onChange={e => update("minimum_price", e.target.value)} placeholder="0.00" />
          </div>
        </div>
      </div>

      {/* ====== Medical Device & Governance ====== */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>醫療器材 & 治理設定</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          <div>
            <div style={fieldLabel}>醫療器材</div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", height: 36 }}>
              <input type="checkbox" checked={form.medical_device_flag} onChange={e => update("medical_device_flag", e.target.checked)} />
              <span style={{ fontSize: 14 }}>此產品為醫療器材</span>
            </label>
          </div>
          <div>
            <div style={fieldLabel}>醫療器材分級</div>
            <select style={selectStyle} value={form.medical_device_class} onChange={e => update("medical_device_class", e.target.value)}>
              <option value="">無</option>
              <option value="1">第一級 (低風險)</option>
              <option value="2">第二級 (中風險)</option>
              <option value="3">第三級 (高風險)</option>
            </select>
          </div>
          <div>
            <div style={fieldLabel}>醫療器材註冊號</div>
            <input style={inputStyle} value={form.medical_registration_no} onChange={e => update("medical_registration_no", e.target.value)} />
          </div>
          <div>
            <div style={fieldLabel}>有效天數</div>
            <input style={inputStyle} type="number" value={form.expiration_days} onChange={e => update("expiration_days", e.target.value)} placeholder="例: 365" />
          </div>
          <div>
            <div style={fieldLabel}>QA審查要求</div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", height: 36 }}>
              <input type="checkbox" checked={form.qa_review_required} onChange={e => update("qa_review_required", e.target.checked)} />
              <span style={{ fontSize: 14 }}>出貨前需QA審查</span>
            </label>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
