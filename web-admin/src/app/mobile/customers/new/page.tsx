"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { api } from "@/lib/api";

const inputStyle: React.CSSProperties = { width: "100%", height: 44, padding: "0 14px", borderRadius: 12, border: "1px solid #d9d9d9", fontSize: 15, outline: "none", boxSizing: "border-box", background: "#fff" };
const labelStyle: React.CSSProperties = { fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 };
const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 16, marginBottom: 12 };

export default function MobileNewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customer_name: "", customer_code: "", contact_person: "", phone: "", region: "CN" });

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  const handleSubmit = async () => {
    if (!form.customer_name.trim()) { alert("請輸入客戶名稱"); return; }
    setSaving(true);
    try {
      await api.post("/customers", { ...form, status: "ACTIVE" });
      alert("客戶建立成功");
      router.push("/mobile/customers");
    } catch (e: any) { alert(e?.response?.data?.message || "建立失敗"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <button className="mobile-btn" onClick={() => router.back()} style={{ background: "none", border: "none", padding: 8, cursor: "pointer", minWidth: 44, minHeight: 44 }}><ArrowLeft size={22} color="#333" /></button>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, flex: 1 }}>新增客戶</h1>
      </div>
      <div className="mobile-card" style={cardStyle}>
        {[{ k: "customer_name", l: "客戶名稱 *" }, { k: "customer_code", l: "客戶編碼" }, { k: "contact_person", l: "聯絡人" }, { k: "phone", l: "電話" }].map(f => (
          <div key={f.k} style={{ marginBottom: 14 }}>
            <div style={labelStyle}>{f.l}</div>
            <input style={inputStyle} value={(form as any)[f.k]} onChange={e => update(f.k, e.target.value)} />
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>區域</div>
          <select style={{ ...inputStyle, cursor: "pointer" } as React.CSSProperties} value={form.region} onChange={e => update("region", e.target.value)}>
            <option value="CN">中國</option><option value="TW">台灣</option><option value="HK">香港</option><option value="OTHER">其他</option>
          </select>
        </div>
      </div>
      <button className="mobile-btn" onClick={handleSubmit} disabled={saving} style={{ width: "100%", height: 48, borderRadius: 12, border: "none", background: saving ? "#91caff" : "#1890ff", color: "#fff", fontSize: 16, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Save size={20} />{saving ? "建立中..." : "建立客戶"}
      </button>
    </div>
  );
}