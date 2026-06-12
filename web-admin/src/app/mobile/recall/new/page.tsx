"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { api } from "@/lib/api";

const inputStyle: React.CSSProperties = { width: "100%", height: 44, padding: "0 14px", borderRadius: 12, border: "1px solid #d9d9d9", fontSize: 15, outline: "none", boxSizing: "border-box", background: "#fff" };
const labelStyle: React.CSSProperties = { fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 };
const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 16, marginBottom: 12 };

export default function MobileNewRecallPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ product_id: "", batch_no: "", recall_level: "R3", found_date: new Date().toISOString().slice(0, 10), description: "" });

  useEffect(() => { api.get("/products").then((r: any) => setProducts(r.data?.items || r.items || [])).catch(() => {}); }, []);

  const handleSubmit = async () => {
    if (!form.product_id) { alert("請選擇產品"); return; }
    if (!form.batch_no.trim()) { alert("請輸入問題批號"); return; }
    setSaving(true);
    try {
      await api.post("/recall/cases", form);
      alert("召回案件建立成功");
      router.push("/mobile/recall");
    } catch (e: any) { alert(e?.response?.data?.message || "建立失敗"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <button className="mobile-btn" onClick={() => router.back()} style={{ background: "none", border: "none", padding: 8, cursor: "pointer", minWidth: 44, minHeight: 44 }}><ArrowLeft size={22} color="#333" /></button>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, flex: 1 }}>新建召回案件</h1>
      </div>
      <div className="mobile-card" style={cardStyle}>
        <div style={{ marginBottom: 14 }}><div style={labelStyle}>產品 *</div>
          <select style={{ ...inputStyle, cursor: "pointer" } as React.CSSProperties} value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
            <option value="">請選擇產品</option>
            {products.map((p: any) => <option key={p.product_id} value={p.product_id}>{p.product_code} {p.product_name}</option>)}
          </select>
        </div>
        {[{ k: "batch_no", l: "問題批號 *" }, { k: "found_date", l: "發現日期", t: "date" }].map(f => (
          <div key={f.k} style={{ marginBottom: 14 }}><div style={labelStyle}>{f.l}</div><input style={inputStyle} type={f.t || "text"} value={(form as any)[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} /></div>
        ))}
        <div style={{ marginBottom: 14 }}><div style={labelStyle}>召回等級</div>
          <select style={{ ...inputStyle, cursor: "pointer" } as React.CSSProperties} value={form.recall_level} onChange={e => setForm({ ...form, recall_level: e.target.value })}>
            <option value="R1">R1 - 嚴重</option><option value="R2">R2 - 主要</option><option value="R3">R3 - 觀察</option>
          </select>
        </div>
        <div style={{ marginBottom: 14 }}><div style={labelStyle}>描述</div>
          <textarea style={{ ...inputStyle, height: 80, padding: "12px 14px", resize: "vertical" }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
      <button className="mobile-btn" onClick={handleSubmit} disabled={saving} style={{ width: "100%", height: 48, borderRadius: 12, border: "none", background: saving ? "#91caff" : "#1890ff", color: "#fff", fontSize: 16, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Save size={20} />{saving ? "建立中..." : "建立召回案件"}
      </button>
    </div>
  );
}