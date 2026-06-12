"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden", padding: 24, marginBottom: 16 };
const cardGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 };

const formTypes = [
  { key: "sales_order", label: "銷售訂單", icon: "📋", color: "#1890ff", route: "/orders" },
  { key: "purchase_order", label: "採購單", icon: "📦", color: "#52c41a", route: "/purchase" },
  { key: "delivery_note", label: "出貨單", icon: "🚚", color: "#fa8c16", route: "/orders" },
  { key: "consignment_note", label: "寄庫單", icon: "📑", color: "#722ed1", route: "/consignment" },
  { key: "consignment_release", label: "寄庫出貨單", icon: "📤", color: "#13c2c2", route: "/consignment" },
  { key: "exchange_note", label: "換貨單", icon: "🔄", color: "#eb2f96", route: "/consignment" },
  { key: "recall_notice", label: "召回通知單", icon: "⚠️", color: "#ff4d4f", route: "/recall" },
  { key: "sample_request", label: "樣品申請單", icon: "🧪", color: "#2f54eb", route: "/samples" },
];

export default function FormsPage() {
  const router = useRouter();
  const [entityId, setEntityId] = useState("");
  const [entityType, setEntityType] = useState("sales_order");
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    if (!entityId.trim()) { alert("請輸入單據編號"); return; }
    setPrinting(true);
    try {
      const r = await api.post("/print/generate", { entity_type: entityType, entity_id: entityId.trim() });
      if (r.data?.pdf_base64) {
        const byteChars = atob(r.data.pdf_base64);
        const byteNums = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNums)], { type: "application/pdf" });
        window.open(URL.createObjectURL(blob), "_blank");
      }
    } catch (e: any) { alert(e?.response?.data?.message || "生成失敗"); }
    finally { setPrinting(false); }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a2e" }}>表單中心</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#999" }}>生成與打印各類業務單據</p>
        </div>

        {/* Quick Print Card */}
        <div style={cb}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#333", margin: "0 0 16px" }}>快速生成表單</h3>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ minWidth: 200 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>單據類型</div>
              <select value={entityType} onChange={e => setEntityType(e.target.value)}
                style={{ width: "100%", height: 36, padding: "0 10px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, background: "#fff", outline: "none" }}>
                {formTypes.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 250 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>單據編號 (UUID)</div>
              <input value={entityId} onChange={e => setEntityId(e.target.value)}
                style={{ width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                placeholder="輸入訂單/採購單的 UUID" />
            </div>
            <button onClick={handlePrint} disabled={printing}
              style={{ height: 36, padding: "0 24px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: printing ? 0.6 : 1 }}>
              {printing ? "生成中..." : "生成 PDF"}
            </button>
          </div>
        </div>

        {/* Form Type Cards */}
        <div style={cardGrid}>
          {formTypes.map(f => (
            <div key={f.key} onClick={() => router.push(f.route)}
              style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", cursor: "pointer", border: "1px solid #f0f0f0", transition: "all 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#f0f0f0"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>{f.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>{f.label}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#999" }}>前往 {f.label} 列表打印</span>
                <span style={{ fontSize: 18, color: f.color }}>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
