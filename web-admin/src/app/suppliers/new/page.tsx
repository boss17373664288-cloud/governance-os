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

export default function NewSupplierPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    supplier_code: "",
    supplier_name: "",
    supplier_short_name: "",
    tax_id: "",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    address: "",
    payment_terms: "NET_30",
  });

  const update = (f: string, v: any) => setForm({ ...form, [f]: v });

  const handleSubmit = async () => {
    if (!form.supplier_name.trim()) { alert("請輸入供應商名稱"); return; }
    setSaving(true);
    try {
      const res = await api.post("/suppliers", form);
      alert("供應商建立成功");
      router.push("/suppliers");
    } catch (e: any) {
      alert(e?.response?.data?.message || "建立失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push("/suppliers")} style={{ ...btnDefault, width: 36, padding: 0, fontSize: 18 }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#333", margin: 0, flex: 1 }}>新增供應商</h1>
        <button onClick={() => router.push("/suppliers")} style={btnDefault}>取消</button>
        <button onClick={handleSubmit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
          {saving ? "建立中..." : "建立供應商"}
        </button>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>基本資料</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          <div>
            <div style={fieldLabel}>供應商編碼 <span style={{ color: "#999", fontWeight: 400 }}>(系統自動)</span></div>
            <input style={{ ...inputStyle, background: "#f5f5f5", color: "#999" }} value={form.supplier_code} readOnly />
          </div>
          <div>
            <div style={fieldLabel}>供應商名稱 <span style={{ color: "#ff4d4f" }}>*</span></div>
            <input style={inputStyle} value={form.supplier_name} onChange={e => update("supplier_name", e.target.value)} placeholder="請輸入公司全稱" />
          </div>
          <div>
            <div style={fieldLabel}>簡稱</div>
            <input style={inputStyle} value={form.supplier_short_name} onChange={e => update("supplier_short_name", e.target.value)} />
          </div>
          <div>
            <div style={fieldLabel}>統一編號</div>
            <input style={inputStyle} value={form.tax_id} onChange={e => update("tax_id", e.target.value)} />
          </div>
          <div>
            <div style={fieldLabel}>聯絡人</div>
            <input style={inputStyle} value={form.contact_person} onChange={e => update("contact_person", e.target.value)} />
          </div>
          <div>
            <div style={fieldLabel}>聯絡電話</div>
            <input style={inputStyle} value={form.contact_phone} onChange={e => update("contact_phone", e.target.value)} placeholder="02-1234-5678" />
          </div>
          <div>
            <div style={fieldLabel}>Email</div>
            <input style={inputStyle} type="email" value={form.contact_email} onChange={e => update("contact_email", e.target.value)} />
          </div>
          <div>
            <div style={fieldLabel}>付款條件</div>
            <select style={selectStyle} value={form.payment_terms} onChange={e => update("payment_terms", e.target.value)}>
              <option value="CASH">現金/現匯</option>
              <option value="NET_30">票到30天</option>
              <option value="NET_45">票到45天</option>
              <option value="NET_60">票到60天</option>
              <option value="MONTHLY_BY_CLOSING">月結</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={fieldLabel}>地址</div>
          <input style={inputStyle} value={form.address} onChange={e => update("address", e.target.value)} placeholder="請輸入公司地址" />
        </div>
      </div>
    </DashboardLayout>
  );
}