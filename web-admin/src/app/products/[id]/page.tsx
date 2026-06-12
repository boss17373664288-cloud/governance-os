"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { api } from "../../../lib/api";

// Governance color system
const RECALL_MAP: Record<string, { label: string; bg: string; color: string }> = {
  R1: { label: "觀察", bg: "#f6ffed", color: "#52c41a" },
  R2: { label: "內部限制", bg: "#e6f7ff", color: "#1890ff" },
  R3: { label: "正式召回", bg: "#fffbe6", color: "#faad14" },
  R4: { label: "緊急召回", bg: "#fff2f0", color: "#ff4d4f" },
};
const CATEGORY_MAP: Record<string, { label: string; bg: string; color: string }> = {
  DEVICE:    { label: "醫療器材", bg: "#e6f7ff", color: "#1890ff" },
  COSMETIC:  { label: "醫學美容", bg: "#fff7e6", color: "#fa8c16" },
  CONSUMABLE:{ label: "耗材",     bg: "#f6ffed", color: "#52c41a" },
};
const tagStyle = (bg: string, color: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", fontSize: 13, fontWeight: 500,
  padding: "4px 12px", borderRadius: 4, background: bg, color: color, whiteSpace: "nowrap",
});

// Styles
const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 20, marginBottom: 16 };
const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const fieldValue: React.CSSProperties = { fontSize: 14, color: "#333", fontWeight: 500 };
const inputStyle: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box" };
const selectStyle: React.CSSProperties = { ...inputStyle, background: "#fff", cursor: "pointer" };
const btnPrimary: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const btnDefault: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" };

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    api.get("/products/" + id).then((r: any) => setProduct(r.data)).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/products/" + id, product);
      alert("儲存成功");
      setEditing(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: any) => setProduct({ ...product, [field]: value });

  if (loading) return <DashboardLayout><div style={{ textAlign: "center", padding: 80, color: "#999" }}>載入中...</div></DashboardLayout>;
  if (!product) return <DashboardLayout><div style={{ textAlign: "center", padding: 80, color: "#999" }}>產品不存在</div></DashboardLayout>;

  const recall = RECALL_MAP[product.recall_level];
  const cat = CATEGORY_MAP[product.product_category];

  return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push("/products")} style={{ ...btnDefault, width: 36, padding: 0, fontSize: 18 }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#333", margin: 0, flex: 1 }}>產品詳情</h1>
        {editing ? (
          <>
            <button onClick={() => setEditing(false)} style={btnDefault}>取消</button>
            <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? "儲存中..." : "儲存修改"}
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} style={btnPrimary}>編輯</button>
        )}
      </div>

      {/* ====== Summary Card ====== */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: "#1890ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
            {product.product_name?.charAt(0) || "P"}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#333" }}>{product.product_name}</div>
            <div style={{ fontSize: 13, color: "#999", fontFamily: "monospace", marginTop: 2 }}>{product.product_code}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {cat && <span style={tagStyle(cat.bg, cat.color)}>{cat.label}</span>}
            {recall && <span style={tagStyle(recall.bg, recall.color)}>召回: {recall.label} ({product.recall_level})</span>}
            {product.medical_device_flag && (
              <span style={tagStyle("#e6f7ff", "#1890ff")}>醫療器材 {product.medical_device_class ? "第"+product.medical_device_class+"級" : ""}</span>
            )}
          </div>
        </div>
      </div>

      {/* ====== Basic Info Card ====== */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>基本資料</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          <Field label="產品編碼" value={product.product_code} readonly />
          <Field label="產品名稱" value={product.product_name} editing={editing} onChange={(v: string) => update("product_name", v)} />
          <Field label="產品短稱" value={product.product_short_name || ""} editing={editing} onChange={(v: string) => update("product_short_name", v)} />
          <Field label="條碼" value={product.product_barcode || ""} editing={editing} onChange={(v: string) => update("product_barcode", v)} />
          <Field label="UDI編碼" value={product.product_uid_code || ""} editing={editing} onChange={(v: string) => update("product_uid_code", v)} />
          <div>
            <div style={fieldLabel}>產品類別</div>
            {editing ? (
              <select style={selectStyle} value={product.product_category || ""} onChange={e => update("product_category", e.target.value)}>
                <option value="">請選擇</option>
                <option value="DEVICE">醫療器材</option>
                <option value="COSMETIC">醫學美容</option>
                <option value="CONSUMABLE">耗材</option>
              </select>
            ) : (
              <div style={fieldValue}>{cat?.label || product.product_category || "-"}</div>
            )}
          </div>
          <Field label="規格" value={product.product_specification || ""} editing={editing} onChange={(v: string) => update("product_specification", v)} />
          <div>
            <div style={fieldLabel}>召回等級</div>
            {editing ? (
              <select style={selectStyle} value={product.recall_level || "R1"} onChange={e => update("recall_level", e.target.value)}>
                <option value="R1">R1 - 觀察</option>
                <option value="R2">R2 - 內部限制</option>
                <option value="R3">R3 - 正式召回</option>
                <option value="R4">R4 - 緊急召回</option>
              </select>
            ) : (
              <div style={fieldValue}>{recall ? `${recall.label} (${product.recall_level})` : product.recall_level || "-"}</div>
            )}
          </div>
          <Field label="醫療器材註冊號" value={product.medical_registration_no || ""} editing={editing} onChange={(v: string) => update("medical_registration_no", v)} />
          <Field label="有效天數" value={product.expiration_days || ""} editing={editing} onChange={(v: string) => update("expiration_days", v ? parseInt(v) : null)} type="number" />
          <div>
            <div style={fieldLabel}>醫療器材</div>
            {editing ? (
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={product.medical_device_flag || false} onChange={e => update("medical_device_flag", e.target.checked)} />
                <span style={{ fontSize: 14 }}>是</span>
              </label>
            ) : (
              <div style={fieldValue}>{product.medical_device_flag ? "是" : "否"}</div>
            )}
          </div>
          <Field label="醫療器材分級" value={product.medical_device_class || ""} editing={editing} onChange={(v: string) => update("medical_device_class", v)} />
        </div>
      </div>

      {/* ====== Price Card ====== */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>價格資訊</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          <Field label="牌價" value={product.base_price ? "NT$ " + Number(product.base_price).toLocaleString() : ""} editing={editing} onChange={(v: string) => update("base_price", v ? parseFloat(v) : null)} type="number" />
          <Field label="最低售價" value={product.minimum_price ? "NT$ " + Number(product.minimum_price).toLocaleString() : ""} editing={editing} onChange={(v: string) => update("minimum_price", v ? parseFloat(v) : null)} type="number" />
        </div>
      </div>

      {/* ====== Governance Card ====== */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>治理資訊</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          <div>
            <div style={fieldLabel}>QA審查要求</div>
            <div style={fieldValue}>{product.qa_review_required ? "✅ 需要" : "❌ 不需要"}</div>
          </div>
          <div>
            <div style={fieldLabel}>導入來源</div>
            <div style={fieldValue}>{product.import_source || "手動建立"}</div>
          </div>
          <div>
            <div style={fieldLabel}>建立時間</div>
            <div style={fieldValue}>{product.created_at?.slice(0, 10) || "-"}</div>
          </div>
          <div>
            <div style={fieldLabel}>更新時間</div>
            <div style={fieldValue}>{product.updated_at?.slice(0, 10) || "-"}</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, value, editing, onChange, readonly, type }: {
  label: string; value: any; editing?: boolean; onChange?: (v: string) => void;
  readonly?: boolean; type?: string;
}) {
  if (readonly || !editing) {
    return (
      <div>
        <div style={fieldLabel}>{label}</div>
        <div style={fieldValue}>{value || "-"}</div>
      </div>
    );
  }
  return (
    <div>
      <div style={fieldLabel}>{label}</div>
      <input
        type={type || "text"}
        style={inputStyle}
        value={value || ""}
        onChange={e => onChange?.(e.target.value)}
      />
    </div>
  );
}
