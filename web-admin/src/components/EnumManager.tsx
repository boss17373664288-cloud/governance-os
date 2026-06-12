"use client";

import { useState, useEffect } from "react";
import { api } from "../lib/api";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const btnSm: React.CSSProperties = { height: 28, padding: "0 10px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer" };
const btnPrimary: React.CSSProperties = { height: 32, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500 };
const inputS: React.CSSProperties = { width: "100%", height: 34, padding: "0 10px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, boxSizing: "border-box", outline: "none" };
const fl: React.CSSProperties = { fontSize: 12, color: "#888", marginBottom: 2 };
const modalBg: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalBox: React.CSSProperties = { background: "#fff", borderRadius: 8, padding: 24, width: 480, maxHeight: "80vh", overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" };

const ENUM_LABELS: Record<string, string> = {
  customer_type: "客戶類型",
  customer_source: "客戶來源",
  industry_type: "行業類型",
  payment_terms: "付款條件",
};

const ENUM_TYPES = ["customer_type", "customer_source", "industry_type", "payment_terms"];

export default function EnumManager({ onChange }: { onChange?: () => void }) {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ typeKey: "customer_type", code: "", label: "" });
  const [saving, setSaving] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all(
      ENUM_TYPES.map((type) =>
        api.get(`/system/enum-options/${type}`).then((r: any) => ({ type, items: r.data || r || [] }))
      )
    )
      .then((results) => {
        const map: Record<string, any[]> = {};
        results.forEach((r: any) => { map[r.type] = r.items; });
        setData(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = (typeKey: string) => {
    setEditing(null);
    setForm({ typeKey, code: "", label: "" });
    setModalOpen(true);
  };

  const openEdit = (typeKey: string, item: any) => {
    setEditing(item);
    setForm({ typeKey, code: item.code, label: item.label });
    setModalOpen(true);
  };

  const saveEnum = async () => {
    if (!form.code.trim() || !form.label.trim()) return alert("請填寫代碼和名稱");
    setSaving(true);
    try {
      if (editing) {
        await api.delete(`/system/enum-options/${form.typeKey}/${editing.code}`).catch(() => {});
      }
      await api.post(`/system/enum-options/${form.typeKey}`, { code: form.code, label: form.label }).catch(() => {});
    } finally {
      setSaving(false);
      setModalOpen(false);
      fetchAll(); if (onChange) onChange();
    }
  };

  const deleteEnum = async (typeKey: string, code: string) => {
    if (!confirm(`確定刪除 "${code}"？`)) return;
    await api.delete(`/system/enum-options/${typeKey}/${code}`).catch(() => {});
    fetchAll(); if (onChange) onChange();
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: 0 }}>下拉選項管理</h3>
        <div style={{ display: "flex", gap: 6 }}>
          {ENUM_TYPES.map((type) => (
            <button key={type} onClick={() => openAdd(type)} style={{ height: 28, padding: "0 12px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer" }}>
              + {ENUM_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {ENUM_TYPES.map((type) => (
        <div key={type} style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: "#555", margin: "0 0 8px" }}>
            {ENUM_LABELS[type]}（{(data[type] || []).length}）
          </h4>
          <div style={cb}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>代碼</th>
                  <th style={th}>名稱</th>
                  <th style={{ ...th, textAlign: "center", width: 120 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {(data[type] || []).map((item: any) => (
                  <tr key={item.code} style={{ background: "#fff" }}>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: 12 }}>{item.code}</td>
                    <td style={td}>{item.label}</td>
                    <td style={{ ...td, textAlign: "center" }}>
                      <button onClick={() => openEdit(type, item)} style={{ ...btnSm, marginRight: 4 }}>編輯</button>
                      <button onClick={() => deleteEnum(type, item.code)} style={{ ...btnSm, color: "#ff4d4f", borderColor: "#ffccc7" }}>刪除</button>
                    </td>
                  </tr>
                ))}
                {(data[type] || []).length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: "center", padding: 20, color: "#999", fontSize: 12 }}>尚無選項</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {modalOpen && (
        <div style={modalBg} onClick={() => setModalOpen(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>
              {editing ? `修改選項（${ENUM_LABELS[form.typeKey]}）` : `新增選項（${ENUM_LABELS[form.typeKey]}）`}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={fl}>類型</div>
                <select value={form.typeKey} onChange={(e) => setForm({ ...form, typeKey: e.target.value, code: "", label: "" })} disabled={!!editing}
                  style={{ width: "100%", height: 34, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px", background: "#fff", outline: "none" }}>
                  {ENUM_TYPES.map((t) => <option key={t} value={t}>{ENUM_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <div style={fl}>代碼 <span style={{ color: "#ff4d4f" }}>*</span></div>
                <input style={inputS} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="例如: HOSPITAL" disabled={!!editing} />
              </div>
              <div>
                <div style={fl}>名稱 <span style={{ color: "#ff4d4f" }}>*</span></div>
                <input style={inputS} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="例如: 醫院" />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button onClick={() => setModalOpen(false)} style={btnSm}>取消</button>
              <button onClick={saveEnum} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                {saving ? "儲存中..." : editing ? "更新" : "建立"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}