"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const bp: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" };
const ss: React.CSSProperties = { ...si, cursor: "pointer" };
const s_l: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const cardBox: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 20, marginBottom: 16 };
const modalBg: React.CSSProperties = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalCard: React.CSSProperties = { background: "#fff", borderRadius: 8, padding: 24, width: 640, maxHeight: "80vh", overflow: "auto" };
const ts = (bg: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color });

const ENTITY_TYPES = [
  { value: "sales_order", label: "銷售訂單" },
  { value: "purchase_order", label: "採購單" },
  { value: "delivery_note", label: "出貨單" },
  { value: "invoice", label: "發票" },
  { value: "consignment_note", label: "寄庫單" },
];

const PAPER_FORMATS = [
  { value: "A4", label: "A4 (210×297mm)" },
  { value: "A5", label: "A5 (148×210mm)" },
  { value: "LETTER", label: "Letter (216×279mm)" },
  { value: "THERMAL_80", label: "熱感紙 80mm" },
];

export default function PrintPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ template_code: "", template_name: "", entity_type: "sales_order", paper_format_id: "A4", html_content: "", is_multi_part: false, part_total: 1 });

  const fetchTemplates = () => {
    setLoading(true);
    api.get("/print/templates").then((r: any) => setTemplates(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTemplates(); }, []);

  const doCreate = async () => {
    if (!form.template_code || !form.template_name) { alert("請填寫模板代碼與名稱"); return; }
    setSaving(true);
    try {
      await api.post("/print/templates", form);
      alert("模板建立成功");
      setShowAdd(false);
      setForm({ template_code: "", template_name: "", entity_type: "sales_order", paper_format_id: "A4", html_content: "", is_multi_part: false, part_total: 1 });
      fetchTemplates();
    } catch (e: any) { alert(e?.response?.data?.message || "建立失敗"); }
    finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a2e" }}>打印模板管理</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#999" }}>管理各類單據的 HTML 打印模板與紙張格式</p>
          </div>
          <button onClick={() => setShowAdd(true)} style={bp}>+ 新增模板</button>
        </div>

        {loading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : templates.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無打印模板，點擊上方按鈕新增</div>
        ) : (
          <div style={cb}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={th}>模板代碼</th><th style={th}>模板名稱</th><th style={th}>適用單據</th><th style={th}>紙張格式</th><th style={th}>多聯</th><th style={th}>版本</th><th style={th}>狀態</th>
                </tr></thead>
                <tbody>
                  {templates.map((t: any, i: number) => (
                    <tr key={t.template_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ ...td, fontFamily: "monospace", fontSize: 12 }}>{t.template_code}</td>
                      <td style={{ ...td, fontWeight: 500 }}>{t.template_name}</td>
                      <td style={td}>{ENTITY_TYPES.find(e => e.value === t.entity_type)?.label || t.entity_type}</td>
                      <td style={td}>{PAPER_FORMATS.find(p => p.value === t.paper_format_id)?.label || t.paper_format_id || "-"}</td>
                      <td style={td}>{t.is_multi_part ? `是 (${t.part_total}聯)` : "否"}</td>
                      <td style={td}>v{t.version || 1}</td>
                      <td style={td}><span style={ts(t.is_active ? "#f6ffed" : "#f5f5f5", t.is_active ? "#52c41a" : "#999")}>{t.is_active ? "啟用" : "停用"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Template Modal */}
        {showAdd && (
          <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
            <div style={modalCard}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>新增打印模板</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={s_l}>模板代碼 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={si} value={form.template_code} onChange={e => setForm({ ...form, template_code: e.target.value })} placeholder="例如: SO_STANDARD" />
                </div>
                <div>
                  <div style={s_l}>模板名稱 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={si} value={form.template_name} onChange={e => setForm({ ...form, template_name: e.target.value })} placeholder="例如: 標準銷售訂單" />
                </div>
                <div>
                  <div style={s_l}>適用單據</div>
                  <select style={ss} value={form.entity_type} onChange={e => setForm({ ...form, entity_type: e.target.value })}>
                    {ENTITY_TYPES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={s_l}>紙張格式</div>
                  <select style={ss} value={form.paper_format_id} onChange={e => setForm({ ...form, paper_format_id: e.target.value })}>
                    {PAPER_FORMATS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={s_l}>HTML 模板內容</div>
                  <textarea style={{ ...si, height: 200, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
                    value={form.html_content} onChange={e => setForm({ ...form, html_content: e.target.value })}
                    placeholder="<div>{{order_no}}</div><table>...</table>" />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowAdd(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={doCreate} disabled={saving} style={{ ...bp, opacity: saving ? 0.6 : 1 }}>{saving ? "建立中..." : "建立模板"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}