"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";
import { downloadCsv } from "../../lib/download";

const handleExport = () => downloadCsv("/api/v1/system/export/products", "產品資料.csv");

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const ts = (bg: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color, whiteSpace: "nowrap" });
const si: React.CSSProperties = { width: 260, height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", background: "#fff" };
const actionBtn: React.CSSProperties = { height: 28, padding: "0 10px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer", marginRight: 4 };
const bp: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const bd: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" };
const sfi: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" };
const sfs: React.CSSProperties = { ...sfi, cursor: "pointer" };
const sfl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const modalBg: React.CSSProperties = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };

const RECALL_MAP: Record<string, string> = { R1: "觀察", R2: "內部限制", R3: "正式召回", R4: "緊急召回" };
const MEDICAL_MAP: Record<string, string> = { CLASS_I: "第一級", CLASS_II: "第二級", CLASS_III: "第三級" };
const CATEGORIES = [
  { value: "DEVICE", label: "醫療器材" },
  { value: "COSMETIC", label: "化妝品" },
  { value: "CONSUMABLE", label: "耗材" },
  { value: "EQUIPMENT", label: "設備" },
  { value: "RAW_MATERIAL", label: "原料" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const fetchData = useCallback(() => {
    setLoading(true);
    const params: any = { page, page_size: 20 };
    if (search) params.search = search;
    api.get("/products", { params })
      .then((r: any) => { setProducts(r.data?.items || []); setPagination(r.data?.pagination || {}); })
      .catch(() => { setProducts([]); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditing(null);
    setForm({ product_code: "", product_name: "", product_short_name: "", product_category: "DEVICE", product_specification: "", product_barcode: "", product_uid_code: "", base_price: 0, minimum_price: 0, recall_level: "R1", medical_device_flag: false, medical_device_class: "", medical_registration_no: "", expiration_days: null, product_series: "" });
    setShowForm(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ ...p });
    setShowForm(true);
  };

  const saveProduct = async () => {
    if (!form.product_name?.trim()) { alert("請輸入產品名稱"); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put("/products/" + editing.product_id, form);
      } else {
        if (!form.product_code?.trim()) { form.product_code = "PROD-" + Date.now(); }
        await api.post("/products", form);
      }
      alert(editing ? "產品已更新" : "產品已建立");
      setShowForm(false);
      fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
    finally { setSaving(false); }
  };

  const deleteProduct = async (p: any) => {
    if (!confirm("確定要刪除產品「" + p.product_name + "」嗎？")) return;
    try {
      await api.delete("/products/" + p.product_id);
      alert("已刪除");
      fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "刪除失敗"); }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 }}>產品管理</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input style={si} placeholder="搜索產品名稱/編碼..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchData()} />
            <button onClick={fetchData} style={bd}>查詢</button>
            <button onClick={handleExport} style={bd}>導出CSV</button><button onClick={openAdd} style={bp}>新增產品</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div>
        ) : (
          <div style={cb}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>產品編碼</th>
                    <th style={th}>產品名稱</th>
                    <th style={th}>類別</th>
                    <th style={th}>簡稱</th>
                    <th style={th}>條碼</th>
                    <th style={th}>UDI碼</th>
                    <th style={th}>牌價</th>
                    <th style={th}>最低價</th>
                    <th style={th}>召回等級</th>
                    <th style={th}>醫療器材</th>
                    <th style={th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p: any, i: number) => (
                    <tr key={p.product_id || i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ ...td, fontFamily: "monospace", fontSize: 12, color: "#1890ff" }}>{p.product_code}</td>
                      <td style={{ ...td, fontWeight: 500 }}>{p.product_name}</td>
                      <td style={td}>{CATEGORIES.find(c => c.value === p.product_category || c.value === p.category)?.label || p.product_category || p.category || "-"}</td>
                      <td style={td}>{p.product_short_name || "-"}</td>
                      <td style={{ ...td, fontFamily: "monospace", fontSize: 11 }}>{p.product_barcode || "-"}</td>
                      <td style={{ ...td, fontFamily: "monospace", fontSize: 11 }}>{p.product_uid_code || "-"}</td>
                      <td style={{ ...td, fontWeight: 600 }}>NT$ {(Number(p.base_price) || 0).toLocaleString()}</td>
                      <td style={{ ...td, fontWeight: 500 }}>NT$ {(Number(p.minimum_price) || 0).toLocaleString()}</td>
                      <td style={td}>{RECALL_MAP[p.recall_level] || p.recall_level || "-"}</td>
                      <td style={td}>{p.medical_device_flag ? <span style={ts("#e6f7ff", "#1890ff")}>是 ({MEDICAL_MAP[p.medical_device_class] || p.medical_device_class || "-"})</span> : <span style={{ color: "#999" }}>否</span>}</td>
                      <td style={td}>
                        <button onClick={() => openEdit(p)} style={actionBtn}>編輯</button>
                        <button onClick={() => deleteProduct(p)} style={{ ...actionBtn, color: "#ff4d4f", borderColor: "#ffccc7" }}>刪除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 12, color: "#999" }}>共 {pagination.total} 筆</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ ...actionBtn, opacity: page <= 1 ? 0.4 : 1 }}>上一頁</button>
                <button disabled={page >= (pagination.total_pages || 1)} onClick={() => setPage(page + 1)} style={{ ...actionBtn, opacity: page >= (pagination.total_pages || 1) ? 0.4 : 1 }}>下一頁</button>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 640, maxHeight: "85vh", overflow: "auto" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>{editing ? "編輯產品" : "新增產品"}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={sfl}>產品編碼</div>
                  <input style={sfi} value={form.product_code || ""} onChange={e => setForm({ ...form, product_code: e.target.value })} placeholder="PROD- 開頭" />
                </div>
                <div>
                  <div style={sfl}>產品名稱 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={sfi} value={form.product_name || ""} onChange={e => setForm({ ...form, product_name: e.target.value })} />
                </div>
                <div>
                  <div style={sfl}>簡稱</div>
                  <input style={sfi} value={form.product_short_name || ""} onChange={e => setForm({ ...form, product_short_name: e.target.value })} placeholder="簡易名稱" />
                </div>
                <div>
                  <div style={sfl}>類別</div>
                  <select style={sfs} value={form.product_category || form.category || "DEVICE"} onChange={e => setForm({ ...form, product_category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={sfl}>規格</div>
                  <input style={sfi} value={form.product_specification || ""} onChange={e => setForm({ ...form, product_specification: e.target.value })} placeholder="規格說明" />
                </div>
                <div>
                  <div style={sfl}>條碼</div>
                  <input style={sfi} value={form.product_barcode || ""} onChange={e => setForm({ ...form, product_barcode: e.target.value })} placeholder="國際條碼 EAN/UPC" />
                </div>
                <div>
                  <div style={sfl}>UDI碼</div>
                  <input style={sfi} value={form.product_uid_code || ""} onChange={e => setForm({ ...form, product_uid_code: e.target.value })} placeholder="醫療器材唯一識別碼" />
                </div>
                <div>
                  <div style={sfl}>產品系列</div>
                  <input style={sfi} value={form.product_series || ""} onChange={e => setForm({ ...form, product_series: e.target.value })} placeholder="品牌系列名稱" />
                </div>
                <div>
                  <div style={sfl}>牌價 (NT$)</div>
                  <input style={sfi} type="number" min={0} step={1} value={form.base_price || 0} onChange={e => setForm({ ...form, base_price: Number(e.target.value) })} />
                </div>
                <div>
                  <div style={sfl}>最低價 (NT$)</div>
                  <input style={sfi} type="number" min={0} step={1} value={form.minimum_price || 0} onChange={e => setForm({ ...form, minimum_price: Number(e.target.value) })} placeholder="低於此價需審批" />
                </div>
                <div>
                  <div style={sfl}>召回等級</div>
                  <select style={sfs} value={form.recall_level || "R1"} onChange={e => setForm({ ...form, recall_level: e.target.value })}>
                    <option value="R1">R1 觀察</option>
                    <option value="R2">R2 內部限制</option>
                    <option value="R3">R3 正式召回</option>
                    <option value="R4">R4 緊急召回</option>
                  </select>
                </div>
                <div>
                  <div style={sfl}>效期天數</div>
                  <input style={sfi} type="number" min={0} value={form.expiration_days || ""} onChange={e => setForm({ ...form, expiration_days: e.target.value ? Number(e.target.value) : null })} placeholder="適用於無批號產品" />
                </div>
                <div>
                  <div style={sfl}>醫療器材</div>
                  <select style={sfs} value={form.medical_device_flag ? "true" : "false"} onChange={e => setForm({ ...form, medical_device_flag: e.target.value === "true" })}>
                    <option value="false">否</option>
                    <option value="true">是</option>
                  </select>
                </div>
                {form.medical_device_flag && (
                <div>
                  <div style={sfl}>醫療器材分級</div>
                  <select style={sfs} value={form.medical_device_class || ""} onChange={e => setForm({ ...form, medical_device_class: e.target.value })}>
                    <option value="">未設定</option>
                    <option value="CLASS_I">第一級 (Class I)</option>
                    <option value="CLASS_II">第二級 (Class II)</option>
                    <option value="CLASS_III">第三級 (Class III)</option>
                  </select>
                </div>
                )}
                {form.medical_device_flag && (
                <div>
                  <div style={sfl}>許可證字號</div>
                  <input style={sfi} value={form.medical_registration_no || ""} onChange={e => setForm({ ...form, medical_registration_no: e.target.value })} placeholder="衛生福利部許可證字號" />
                </div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowForm(false)} style={bd}>取消</button>
                <button onClick={saveProduct} disabled={saving} style={{ ...bp, opacity: saving ? 0.6 : 1 }}>{saving ? "儲存中..." : "儲存"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}