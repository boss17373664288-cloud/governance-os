"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";
import { downloadCsv } from "../../lib/download";

type Batch = {
  batch_id: string; batch_no: string; product_id: string; product_code: string;
  product_name: string; production_date: string; expiry_date: string;
  manufacturer: string; qa_status: string; recall_status: string;
  total_quantity: number; created_at: string;
};

type Warehouse = {
  warehouse_id: string; warehouse_code: string; warehouse_name: string;
  warehouse_type: string; address: string; is_active: boolean;
};

type Product = { product_id: string; product_code: string; product_name: string };

const RC: Record<string, { bg: string; border: string; color: string }> = {
  HIGH: { bg: "#fff2f0", border: "#ff4d4f", color: "#ff4d4f" },
  WARN: { bg: "#fffbe6", border: "#faad14", color: "#d48806" },
  RECALL: { bg: "#e6f7ff", border: "#1890ff", color: "#096dd9" },
  NORMAL: { bg: "#f6ffed", border: "#52c41a", color: "#389e0d" },
  FROZEN: { bg: "#f5f5f5", border: "#d9d9d9", color: "#8c8c8c" },
};

const QA_MAP: Record<string, { l: string; c: typeof RC.NORMAL }> = {
  PASSED: { l: "已通過", c: RC.NORMAL }, PENDING: { l: "待檢驗", c: RC.WARN }, FAILED: { l: "未通過", c: RC.HIGH },
};
const RECALL_MAP: Record<string, { l: string; c: typeof RC.NORMAL }> = {
  NORMAL: { l: "正常", c: RC.NORMAL }, R2: { l: "R2 內部限制", c: RC.RECALL },
  R3: { l: "R3 正式召回", c: RC.WARN }, R4: { l: "R4 緊急召回", c: RC.HIGH },
};
const WH_TYPE_MAP: Record<string, string> = {
  MAIN: "總倉", BRANCH: "分倉", CONSIGNMENT_ZONE: "寄庫區",
  RECALL_ZONE: "召回隔離區", QA_ZONE: "QA待驗區", DEFECTIVE_ZONE: "不良品區",
};

const statCard: React.CSSProperties = { background: "#fff", borderRadius: 6, padding: "16px 20px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", borderLeft: "3px solid" };
const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const ts = (bg: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color, whiteSpace: "nowrap" });
const btnSm: React.CSSProperties = { height: 28, padding: "0 10px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer" };
const btnPrimary: React.CSSProperties = { height: 32, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500 };
const inputStyle: React.CSSProperties = { width: "100%", height: 34, padding: "0 10px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", boxSizing: "border-box" };
const selectStyle: React.CSSProperties = { width: "100%", height: 34, padding: "0 8px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, background: "#fff", outline: "none" };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500, color: "#555" };
const modalOverlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalBox: React.CSSProperties = { background: "#fff", borderRadius: 8, padding: 24, width: 560, maxHeight: "80vh", overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" };

export default function InventoryPage() {
  const handleExport = () => downloadCsv("/api/v1/system/export/inventory", "庫存資料.csv");
  const [dashboard, setDashboard] = useState<any>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [qaStatus, setQaStatus] = useState("");
  const [recallStatus, setRecallStatus] = useState("");
  const [selectedWh, setSelectedWh] = useState<Warehouse | null>(null);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [form, setForm] = useState({ product_id: "", batch_no: "", production_date: "", expiry_date: "", manufacturer: "", qa_status: "PENDING", recall_status: "NORMAL", total_quantity: 0 });
  const [saving, setSaving] = useState(false);

  // Warehouse modal
  const [whModalOpen, setWhModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);
  const [whForm, setWhForm] = useState({ warehouse_code: "", warehouse_name: "", warehouse_type: "BRANCH", address: "" });
  const [whSaving, setWhSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const whId = selectedWh?.warehouse_id;
    Promise.all([
      api.get("/inventory/dashboard", { params: { warehouse_id: whId || undefined } }),
      api.get("/inventory/batches", { params: { page, page_size: 15, qa_status: qaStatus || undefined, recall_status: recallStatus || undefined, warehouse_id: whId || undefined, search: search || undefined } }),
      api.get("/inventory/warehouses"),
      api.get("/products", { params: { page_size: 999 } }),
    ]).then(([d, b, w, p]: any[]) => {
      setDashboard(d.data);
      setBatches(b.data.items || []);
      setTotal(b.data.pagination?.total || 0);
      setWarehouses(w.data || []);
      setProducts(p.data?.items || []);
    }).finally(() => setLoading(false));
  }, [page, qaStatus, recallStatus, selectedWh, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingBatch(null);
    setForm({ product_id: "", batch_no: "", production_date: "", expiry_date: "", manufacturer: "", qa_status: "PENDING", recall_status: "NORMAL", total_quantity: 0 });
    setModalOpen(true);
  };

  const openEdit = (b: Batch) => {
    setEditingBatch(b);
    setForm({
      product_id: b.product_id || "",
      batch_no: b.batch_no || "",
      production_date: b.production_date?.slice(0, 10) || "",
      expiry_date: b.expiry_date?.slice(0, 10) || "",
      manufacturer: b.manufacturer || "",
      qa_status: b.qa_status || "PENDING",
      recall_status: b.recall_status || "NORMAL",
      total_quantity: b.total_quantity || 0,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.product_id || !form.expiry_date) return alert("請填寫產品和效期");
    setSaving(true);
    try {
      if (editingBatch) {
        await api.put(`/inventory/batches/${editingBatch.batch_id}`, form);
      } else {
        await api.post("/inventory/batches", form);
      }
      setModalOpen(false);
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (batch: Batch) => {
    if (!confirm(`確定要刪除批次 ${batch.batch_no}？`)) return;
    try {
      await api.delete(`/inventory/batches/${batch.batch_id}`);
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || "刪除失敗");
    }
  };

  // Warehouse handlers
  const openWhCreate = () => {
    setEditingWh(null);
    setWhForm({ warehouse_code: "", warehouse_name: "", warehouse_type: "BRANCH", address: "" });
    setWhModalOpen(true);
  };

  const openWhEdit = (w: Warehouse) => {
    setEditingWh(w);
    setWhForm({ warehouse_code: w.warehouse_code, warehouse_name: w.warehouse_name, warehouse_type: w.warehouse_type, address: w.address || "" });
    setWhModalOpen(true);
  };

  const handleWhSave = async () => {
    if (!whForm.warehouse_name) return alert("請輸入倉庫名稱");
    setWhSaving(true);
    try {
      if (editingWh) {
        await api.put(`/inventory/warehouses/${editingWh.warehouse_id}`, whForm);
      } else {
        await api.post("/inventory/warehouses", whForm);
      }
      setWhModalOpen(false);
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || "儲存失敗");
    } finally {
      setWhSaving(false);
    }
  };

  const handleWhDelete = async (w: Warehouse) => {
    if (!confirm(`確定要停用倉庫 ${w.warehouse_name}？`)) return;
    try {
      await api.delete(`/inventory/warehouses/${w.warehouse_id}`);
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message || "刪除失敗");
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#333", margin: 0 }}>
          庫存管理 {selectedWh && <span style={{ fontSize: 14, color: "#1890ff", fontWeight: 400 }}>- {selectedWh.warehouse_name}</span>}
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={openWhCreate} style={{ ...btnSm, borderColor: "#1890ff", color: "#1890ff" }}>+ 新增倉庫</button>
          <button onClick={openCreate} style={btnPrimary}>+ 新增批次</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div style={{ ...statCard, borderLeftColor: RC.NORMAL.border }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: RC.NORMAL.color, marginBottom: 4 }}>{(dashboard?.total_quantity || 0).toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "#888" }}>正常庫存總量</div>
        </div>
        <div style={{ ...statCard, borderLeftColor: RC.WARN.border }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: RC.WARN.color, marginBottom: 4 }}>{(dashboard?.expiring_quantity || 0).toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "#888" }}>30天內到期</div>
        </div>
        <div style={{ ...statCard, borderLeftColor: RC.RECALL.border }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: RC.RECALL.color, marginBottom: 4 }}>{(dashboard?.recall_quantity || 0).toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "#888" }}>召回庫存</div>
        </div>
        <div style={{ ...statCard, borderLeftColor: RC.FROZEN.border }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: RC.FROZEN.color, marginBottom: 4 }}>{(dashboard?.frozen_quantity || 0).toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "#888" }}>QA未通過</div>
        </div>
      </div>

      {/* Warehouse chips */}
      <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {warehouses.map((w) => (
          <div key={w.warehouse_id} onClick={() => { const isSame = selectedWh?.warehouse_id === w.warehouse_id; if (isSame) { setSelectedWh(null); setQaStatus(""); setRecallStatus(""); } else if (w.warehouse_type === "QA_ZONE") { setSelectedWh(null); setQaStatus("PENDING"); setRecallStatus(""); } else if (w.warehouse_type === "RECALL_ZONE") { setSelectedWh(null); setQaStatus(""); setRecallStatus("R2,R3,R4"); } else { setSelectedWh(w); setQaStatus(""); setRecallStatus(""); } setPage(1); }}
            style={{
              background: selectedWh?.warehouse_id === w.warehouse_id ? "#e6f7ff" : "#fafafa",
              borderRadius: 4, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6,
              border: selectedWh?.warehouse_id === w.warehouse_id ? "1px solid #1890ff" : "1px solid transparent",
              cursor: "pointer", transition: "all 0.15s",
            }}>
            <span style={{ fontSize: 14 }}>🏭</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{w.warehouse_name}</div>
              <div style={{ fontSize: 11, color: "#999" }}>{WH_TYPE_MAP[w.warehouse_type] || w.warehouse_type}</div>
            </div>
            <span onClick={(e) => { e.stopPropagation(); openWhEdit(w); }} style={{ marginLeft: 4, fontSize: 12, cursor: "pointer", color: "#999" }} title="編輯">✎</span><span onClick={(e) => { e.stopPropagation(); handleWhDelete(w); }} style={{ marginLeft: 2, fontSize: 12, cursor: "pointer", color: "#ff4d4f" }} title="停用">✕</span>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div style={{ ...cb, padding: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <input placeholder="搜索批次號/產品" style={{ ...inputStyle, width: 200 }} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select style={{ height: 32, padding: "0 8px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, background: "#fff", outline: "none" }}
          value={qaStatus} onChange={e => { setQaStatus(e.target.value); setPage(1); }}>
          <option value="">全部 QA 狀態</option>
          <option value="PASSED">已通過</option>
          <option value="PENDING">待檢驗</option>
          <option value="FAILED">未通過</option>
        </select>
        <select style={{ height: 32, padding: "0 8px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, background: "#fff", outline: "none" }}
          value={recallStatus} onChange={e => { setRecallStatus(e.target.value); setPage(1); }}>
          <option value="">全部召回狀態</option>
          <option value="NORMAL">正常</option>
          <option value="R2">R2 內部限制</option>
          <option value="R3">R3 正式召回</option>
          <option value="R4">R4 緊急召回</option>
        </select>
        <span style={{ fontSize: 12, color: "#999", whiteSpace: "nowrap" }}>共 {total} 筆</span>
      </div>

      {/* Batch Table */}
      <div style={cb}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={th}>批次號</th><th style={th}>產品編碼</th><th style={th}>產品名稱</th>
            <th style={{ ...th, textAlign: "center" }}>數量</th><th style={th}>生產日期</th><th style={th}>效期</th>
            <th style={{ ...th, textAlign: "center" }}>QA</th><th style={{ ...th, textAlign: "center" }}>召回</th><th style={th}>製造商</th>
            <th style={{ ...th, textAlign: "center", width: 120 }}>操作</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={10} style={{ ...td, textAlign: "center", padding: 48, color: "#999" }}>載入中...</td></tr> :
             batches.length === 0 ? <tr><td colSpan={10} style={{ ...td, textAlign: "center", padding: 48, color: "#999" }}>暫無庫存資料</td></tr> :
             batches.map((b) => {
               const qa = QA_MAP[b.qa_status] || { l: b.qa_status || "-", c: RC.FROZEN };
               const rc = RECALL_MAP[b.recall_status] || { l: b.recall_status || "-", c: RC.NORMAL };
               return (
                 <tr key={b.batch_id}>
                   <td style={{ ...td, fontFamily: "monospace", fontWeight: 500, whiteSpace: "nowrap" }}>{b.batch_no}</td>
                   <td style={{ ...td, fontFamily: "monospace", fontSize: 12 }}>{b.product_code}</td>
                   <td style={{ ...td, fontWeight: 500 }}>{b.product_name}</td>
                   <td style={{ ...td, textAlign: "center", fontWeight: 600 }}>{Number(b.total_quantity).toLocaleString()}</td>
                   <td style={td}>{b.production_date?.slice(0, 10) || "-"}</td>
                   <td style={td}>{b.expiry_date?.slice(0, 10) || "-"}</td>
                   <td style={{ ...td, textAlign: "center" }}><span style={ts(qa.c.bg, qa.c.color)}>{qa.l}</span></td>
                   <td style={{ ...td, textAlign: "center" }}><span style={ts(rc.c.bg, rc.c.color)}>{rc.l}</span></td>
                   <td style={td}>{b.manufacturer || "-"}</td>
                   <td style={{ ...td, textAlign: "center" }}>
                     <button onClick={() => openEdit(b)} style={{ ...btnSm, marginRight: 4, borderColor: "#1890ff", color: "#1890ff" }}>修改</button>
                     <button onClick={() => handleDelete(b)} style={{ ...btnSm, borderColor: "#ff4d4f", color: "#ff4d4f" }}>刪除</button>
                   </td>
                 </tr>);
             })}
          </tbody>
        </table>
      </div>

      {total > 15 && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 16, gap: 4 }}>
          <span style={{ fontSize: 12, color: "#999", marginRight: 8 }}>第 {page} 頁 / 共 {Math.ceil(total / 15)} 頁</span>
          {Array.from({ length: Math.min(Math.ceil(total / 15), 7) }, (_, i) => {
            const p = i + 1;
            return <button key={i} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: 4, border: "1px solid " + (page === p ? "#1890ff" : "#d9d9d9"), background: page === p ? "#1890ff" : "#fff", color: page === p ? "#fff" : "#666", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>{p}</button>;
          })}
        </div>
      )}

      {/* Batch Modal */}
      {modalOpen && (
        <div style={modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, color: "#333" }}>{editingBatch ? "修改批次" : "新增批次"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>產品 *</label>
                <select style={selectStyle} value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                  <option value="">請選擇產品</option>
                  {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_code} {p.product_name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>批次號</label>
                <input style={inputStyle} value={form.batch_no} onChange={e => setForm({ ...form, batch_no: e.target.value })} placeholder="自動生成" />
              </div>
              <div>
                <label style={labelStyle}>生產日期</label>
                <input type="date" style={inputStyle} value={form.production_date} onChange={e => setForm({ ...form, production_date: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>效期 *</label>
                <input type="date" style={inputStyle} value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>數量</label>
                <input type="number" style={inputStyle} value={form.total_quantity} onChange={e => setForm({ ...form, total_quantity: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label style={labelStyle}>製造商</label>
                <input style={inputStyle} value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>QA 狀態</label>
                <select style={selectStyle} value={form.qa_status} onChange={e => setForm({ ...form, qa_status: e.target.value })}>
                  <option value="PENDING">待檢驗</option>
                  <option value="PASSED">已通過</option>
                  <option value="FAILED">未通過</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>召回狀態</label>
                <select style={selectStyle} value={form.recall_status} onChange={e => setForm({ ...form, recall_status: e.target.value })}>
                  <option value="NORMAL">正常</option>
                  <option value="R2">R2 內部限制</option>
                  <option value="R3">R3 正式召回</option>
                  <option value="R4">R4 緊急召回</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button onClick={() => setModalOpen(false)} style={btnSm}>取消</button>
              <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                {saving ? "儲存中..." : editingBatch ? "更新" : "建立"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Modal */}
      {whModalOpen && (
        <div style={modalOverlay} onClick={() => setWhModalOpen(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, color: "#333" }}>{editingWh ? "修改倉庫" : "新增倉庫"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>倉庫編碼</label>
                <input style={inputStyle} value={whForm.warehouse_code} onChange={e => setWhForm({ ...whForm, warehouse_code: e.target.value })} placeholder="自動生成" />
              </div>
              <div>
                <label style={labelStyle}>倉庫名稱 *</label>
                <input style={inputStyle} value={whForm.warehouse_name} onChange={e => setWhForm({ ...whForm, warehouse_name: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>倉庫類型</label>
                <select style={selectStyle} value={whForm.warehouse_type} onChange={e => setWhForm({ ...whForm, warehouse_type: e.target.value })}>
                  <option value="MAIN">總倉</option>
                  <option value="BRANCH">分倉</option>
                  <option value="CONSIGNMENT_ZONE">寄庫區</option>
                  <option value="RECALL_ZONE">召回隔離區</option>
                  <option value="QA_ZONE">QA待驗區</option>
                  <option value="DEFECTIVE_ZONE">不良品區</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>地址</label>
                <input style={inputStyle} value={whForm.address} onChange={e => setWhForm({ ...whForm, address: e.target.value })} />
              </div>
            </div>
            {editingWh && (
              <div style={{ marginTop: 12 }}>
                <button onClick={() => handleWhDelete(editingWh)} style={{ ...btnSm, borderColor: "#ff4d4f", color: "#ff4d4f" }}>停用此倉庫</button>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button onClick={() => setWhModalOpen(false)} style={btnSm}>取消</button>
              <button onClick={handleWhSave} disabled={whSaving} style={{ ...btnPrimary, opacity: whSaving ? 0.6 : 1 }}>
                {whSaving ? "儲存中..." : editingWh ? "更新" : "建立"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}