"use client";

import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden", padding: 24 };
const bp: React.CSSProperties = { height: 36, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const bgBtn: React.CSSProperties = { ...bp, background: "#52c41a" };
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" };
const sl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const ts = (bg: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color });

const entities = [
  { key: "customers", label: "客戶資料", template: "customer_code,customer_name,customer_type,contact_person,phone,email,company_address,company_zip_code" },
  { key: "products", label: "產品資料", template: "product_code,product_name,product_category,base_price" },
  { key: "suppliers", label: "供應商資料", template: "supplier_code,supplier_name,contact_person,contact_phone,payment_terms" },
  { key: "employees", label: "員工資料", template: "employee_no,full_name,role_code,region_code,email,phone" },
  { key: "inventory", label: "庫存資料", template: "batch_no,product_id,expiry_date,manufacturer,qa_status,total_quantity" },
];

export default function ImportPage() {
  const [entity, setEntity] = useState("customers");
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const parseCsv = (text: string): any[] => {
    const lines = text.trim().split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    return lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const row: any = {};
      headers.forEach((h, i) => { row[h] = vals[i] || ""; });
      return row;
    });
  };

  const doImport = async () => {
    const rows = parseCsv(csvText);
    if (rows.length === 0) { alert("請貼上有效的 CSV 資料（至少含標題行 + 1 筆資料）"); return; }
    if (rows.length > 500) { alert("單次最多 500 筆資料"); return; }
    setImporting(true); setResult(null);
    try {
      const r = await api.post("/system/import/" + entity, { rows });
      setResult(r.data);
    } catch (e: any) { alert(e?.response?.data?.message || "匯入失敗"); }
    finally { setImporting(false); }
  };


  const downloadExport = async (key: string) => {
    try {
      const res = await fetch("/api/v1/system/export/" + key);
      if (!res.ok) { alert("匯出失敗: " + res.status); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = key + ".csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("匯出失敗: " + (e.message || "網路錯誤"));
    }
  };

  const downloadTemplate = () => {
    const e = entities.find(ent => ent.key === entity);
    if (!e) return;
    const BOM = "\uFEFF";
    const csvContent = BOM + e.template + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = entity + "_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#333", margin: 0 }}>資料匯入與導出</h1>
            <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>支援 CSV 格式匯入，單次最多 500 筆</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={cb}>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={sl}>匯入類型</div>
                <select value={entity} onChange={e => setEntity(e.target.value)} style={si}>
                  {entities.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={sl}>CSV 資料內容</div>
                  <button onClick={downloadTemplate} style={{ fontSize: 11, color: "#1890ff", background: "none", border: "none", cursor: "pointer" }}>下載模板</button>
                </div>
                <textarea style={{ ...si, height: 200, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
                  value={csvText} onChange={e => setCsvText(e.target.value)}
                  placeholder={entities.find(e => e.key === entity)?.template + "\n..."} />
              </div>
              <button onClick={doImport} disabled={importing} style={{ ...bgBtn, width: "fit-content" }}>{importing ? "匯入中..." : "開始匯入"}</button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            {result && (
              <div style={cb}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#333", margin: "0 0 16px" }}>匯入結果</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div style={{ textAlign: "center", padding: "12px", background: "#f6ffed", borderRadius: 4 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#52c41a" }}>{result.total}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>總計</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "12px", background: "#e6f7ff", borderRadius: 4 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#1890ff" }}>{result.success}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>成功</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "12px", background: "#fff1f0", borderRadius: 4 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#ff4d4f" }}>{result.failed}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>失敗</div>
                  </div>
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div style={{ fontSize: 12, color: "#ff4d4f", maxHeight: 150, overflow: "auto" }}>
                    {result.errors.map((e: string, i: number) => <div key={i}>{e}</div>)}
                  </div>
                )}
              </div>
            )}

            <div style={cb}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#333", margin: "0 0 12px" }}>快速導出</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  { label: "客戶列表", key: "customers" },
                  { label: "產品列表", key: "products" },
                  { label: "供應商列表", key: "suppliers" },
                  { label: "員工列表", key: "employees" },
                  { label: "銷售訂單", key: "orders" },
                  { label: "應收帳款", key: "finance-ar" },
                  { label: "審計日誌", key: "audit-logs" },
                  { label: "庫存列表", key: "inventory" },
                ].map(item => (
                  <div key={item.label} onClick={() => downloadExport(item.key)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#fafafa", borderRadius: 4, textDecoration: "none", color: "#333", fontSize: 13, border: "1px solid #f0f0f0", cursor: "pointer" }}>
                    <span>{item.label}</span>
                    <span style={{ color: "#1890ff", fontSize: 12 }}>下載 CSV ↓</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
