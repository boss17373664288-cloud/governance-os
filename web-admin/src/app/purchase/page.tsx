"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const ts = (bg: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color, whiteSpace: "nowrap" });
const bp: React.CSSProperties = { height: 36, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const bg: React.CSSProperties = { ...bp, background: "#52c41a" };
const bo: React.CSSProperties = { ...bp, background: "#fa8c16" };
const br: React.CSSProperties = { ...bp, background: "#ff4d4f" };
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" };
const sl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const modalBg: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalCard: React.CSSProperties = { background: "#fff", borderRadius: 8, padding: 24, width: 640, maxHeight: "85vh", overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" };
const actionBtn: React.CSSProperties = { height: 28, padding: "0 10px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer", marginRight: 4 };

const statusMap: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: "草稿", bg: "#f0f0f0", color: "#666" },
  EMERGENCY_PENDING: { label: "緊急待審", bg: "#fff2e8", color: "#fa8c16" },
  PENDING_APPROVAL: { label: "待審批", bg: "#fff7e6", color: "#fa8c16" },
  APPROVED: { label: "已核准", bg: "#e6f7ff", color: "#1890ff" },
  RECEIVING: { label: "收貨中", bg: "#f6ffed", color: "#52c41a" },
  COMPLETED: { label: "已完成", bg: "#f6ffed", color: "#52c41a" },
  REJECTED: { label: "已駁回", bg: "#fff1f0", color: "#ff4d4f" },
  CANCELLED: { label: "已取消", bg: "#f0f0f0", color: "#999" },
};

export default function PurchasePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, page_size: 20, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Detail modal
  const [detail, setDetail] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ supplier_id: "", is_emergency: false });
  const [createItems, setCreateItems] = useState<any[]>([{ product_id: "", quantity: 1, unit_price: 0 }]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [createSaving, setCreateSaving] = useState(false);

  // Receive modal
  const [showReceive, setShowReceive] = useState(false);
  const [receivePoId, setReceivePoId] = useState("");
  const [receiveItems, setReceiveItems] = useState<any[]>([]);
  const [receiveForm, setReceiveForm] = useState<Record<string, number>>({});
  const [receiveSaving, setReceiveSaving] = useState(false);

  // Return modal
  const [showReturn, setShowReturn] = useState(false);
  const [returnPoId, setReturnPoId] = useState("");
  const [returnPoItems, setReturnPoItems] = useState<any[]>([]);
  const [returnForm, setReturnForm] = useState({ product_id: "", quantity: 1, reason: "" });
  const [returnSaving, setReturnSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params: any = { page, page_size: 20 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.get("/purchase", { params })
      .then((r: any) => { setOrders(r.data?.items || []); setPagination(r.data?.pagination || {}); })
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadRefData = async () => {
    const [s, p] = await Promise.all([
      api.get("/suppliers", { params: { page_size: 200 } }),
      api.get("/products", { params: { page_size: 500 } }),
    ]);
    setSuppliers(s.data?.items || []);
    setProducts(p.data?.items || []);
  };

  // ====== Create ======
  const openCreate = async () => {
    await loadRefData();
    setCreateForm({ supplier_id: "", is_emergency: false });
    setCreateItems([{ product_id: "", quantity: 1, unit_price: 0 }]);
    setShowCreate(true);
  };

  const addItemRow = () => setCreateItems([...createItems, { product_id: "", quantity: 1, unit_price: 0 }]);
  const removeItemRow = (i: number) => { if (createItems.length > 1) setCreateItems(createItems.filter((_, idx) => idx !== i)); };
  const updateItem = (i: number, field: string, value: any) => {
    const items = [...createItems];
    items[i] = { ...items[i], [field]: value };
    setCreateItems(items);
  };

  const doCreate = async () => {
    if (!createForm.supplier_id) { alert("請選擇供應商"); return; }
    const validItems = createItems.filter(it => it.product_id && it.quantity > 0);
    if (validItems.length === 0) { alert("請至少填寫一項產品明細"); return; }
    setCreateSaving(true);
    try {
      await api.post("/purchase", { ...createForm, items: validItems });
      alert("採購單建立成功"); setShowCreate(false); fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "建立失敗"); }
    finally { setCreateSaving(false); }
  };

  // ====== Detail ======
  const openDetail = async (poId: string) => {
    try {
      const r = await api.get(`/purchase/${poId}`);
      setDetail(r.data);
      setShowDetail(true);
    } catch { alert("載入詳情失敗"); }
  };

  // ====== Receive ======
  const openReceive = async (poId: string) => {
    try {
      const r = await api.get(`/purchase/${poId}`);
      const detail = r.data;
      setReceivePoId(poId);
      const items = (detail.items || []).filter((it: any) => (it.quantity || 0) > (it.received_quantity || 0));
      if (items.length === 0) { alert("所有明細已收貨完畢"); return; }
      setReceiveItems(items);
      const form: Record<string, number> = {};
      items.forEach((it: any) => { form[it.product_id] = (it.quantity || 0) - (it.received_quantity || 0); });
      setReceiveForm(form);
      setShowReceive(true);
    } catch { alert("載入失敗"); }
  };

  const doReceive = async () => {
    const items = Object.entries(receiveForm)
      .filter(([_, qty]) => qty > 0)
      .map(([product_id, quantity]) => ({ product_id, quantity }));
    if (items.length === 0) { alert("請填寫收貨數量"); return; }
    setReceiveSaving(true);
    try {
      await api.post(`/purchase/${receivePoId}/receive`, { items });
      alert("收貨完成"); setShowReceive(false); fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "收貨失敗"); }
    finally { setReceiveSaving(false); }
  };

  // ====== Return ======
  const openReturn = async (poId: string) => {
    try {
      const r = await api.get(`/purchase/${poId}`);
      const detail = r.data;
      setReturnPoId(poId);
      const items = (detail.items || []).filter((it: any) => (it.received_quantity || 0) > (it.return_quantity || 0));
      if (items.length === 0) { alert("無已收貨可退的明細"); return; }
      setReturnPoItems(items);
      setReturnForm({ product_id: "", quantity: 1, reason: "" });
      setShowReturn(true);
    } catch { alert("載入失敗"); }
  };

  const doReturn = async () => {
    if (!returnForm.product_id || returnForm.quantity < 1) { alert("請填寫完整退貨資訊"); return; }
    setReturnSaving(true);
    try {
      await api.post(`/purchase/${returnPoId}/return`, returnForm);
      alert("退貨完成"); setShowReturn(false); fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "退貨失敗"); }
    finally { setReturnSaving(false); }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a2e" }}>採購管理</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#999" }}>管理採購訂單、收貨驗收與退貨作業</p>
          </div>
          <button onClick={openCreate} style={bp}>+ 新增採購單</button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          {[
            { label: "全部採購單", value: pagination.total, color: "#1890ff" },
            { label: "待審批", value: orders.filter((o: any) => ["DRAFT", "PENDING_APPROVAL", "EMERGENCY_PENDING"].includes(o.status)).length, color: "#fa8c16" },
            { label: "已核准", value: orders.filter((o: any) => o.status === "APPROVED").length, color: "#52c41a" },
            { label: "緊急採購", value: orders.filter((o: any) => o.is_emergency).length, color: "#ff4d4f" },
          ].map((s, i) => (
            <div key={i} style={{ ...cb, padding: "16px 20px", borderLeft: "3px solid " + s.color }}>
              <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <input style={{ ...si, width: 280 }} placeholder="搜尋採購單號/供應商..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select style={{ ...si, width: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">全部狀態</option>
            {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無採購單</div>
        ) : (
          <div style={cb}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>採購單號</th>
                    <th style={th}>供應商</th>
                    <th style={th}>採購日期</th>
                    <th style={th}>總金額</th>
                    <th style={th}>明細數</th>
                    <th style={th}>狀態</th>
                    <th style={th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((po: any, i: number) => (
                    <tr key={po.po_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ ...td, fontWeight: 500, color: "#1890ff", cursor: "pointer" }} onClick={() => openDetail(po.po_id)}>
                        {po.po_no} {po.is_emergency ? <span style={ts("#fff1f0", "#ff4d4f")}>緊急</span> : null}
                      </td>
                      <td style={td}>{po.supplier_code} - {po.supplier_name}</td>
                      <td style={td}>{po.order_date ? po.order_date.slice(0, 10) : "-"}</td>
                      <td style={{ ...td, fontWeight: 600 }}>NT$ {(Number(po.total_amount) || 0).toLocaleString()}</td>
                      <td style={td}>{po.item_count || 0} 項</td>
                      <td style={td}>
                        <span style={ts(statusMap[po.status]?.bg || "#f0f0f0", statusMap[po.status]?.color || "#666")}>
                          {statusMap[po.status]?.label || po.status}
                        </span>
                      </td>
                      <td style={td}>
                        <button onClick={() => openDetail(po.po_id)} style={actionBtn}>詳情</button>
                        {["APPROVED", "RECEIVING"].includes(po.status) && (po.total_received || 0) < (po.item_count > 0 ? 999 : 0) && (
                          <button onClick={() => openReceive(po.po_id)} style={{ ...actionBtn, color: "#52c41a", borderColor: "#52c41a" }}>收貨</button>
                        )}
                        {(po.total_received || 0) > 0 && (
                          <button onClick={() => openReturn(po.po_id)} style={{ ...actionBtn, color: "#fa8c16", borderColor: "#fa8c16" }}>退貨</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 12, color: "#999" }}>共 {pagination.total} 筆，第 {pagination.page}/{pagination.total_pages || 1} 頁</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ ...actionBtn, opacity: page <= 1 ? 0.4 : 1 }}>上一頁</button>
                <button disabled={page >= pagination.total_pages} onClick={() => setPage(page + 1)} style={{ ...actionBtn, opacity: page >= pagination.total_pages ? 0.4 : 1 }}>下一頁</button>
              </div>
            </div>
          </div>
        )}

        {/* ====== Create Modal ====== */}
        {showCreate && (
          <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
            <div style={{ ...modalCard, width: 720 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>新增採購單</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={sl}>供應商 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <select style={si} value={createForm.supplier_id} onChange={e => setCreateForm({ ...createForm, supplier_id: e.target.value })}>
                    <option value="">請選擇供應商</option>
                    {suppliers.map((s: any) => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_code} - {s.supplier_name}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 0 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                    <input type="checkbox" checked={createForm.is_emergency} onChange={e => setCreateForm({ ...createForm, is_emergency: e.target.checked })} />
                    緊急採購
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#555" }}>採購明細</span>
                  <button onClick={addItemRow} style={{ ...actionBtn, color: "#1890ff", borderColor: "#1890ff" }}>+ 新增明細</button>
                </div>
                {createItems.map((item, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 40px", gap: 8, marginBottom: 8, alignItems: "end" }}>
                    <div>
                      {i === 0 && <div style={sl}>產品 <span style={{ color: "#ff4d4f" }}>*</span></div>}
                      <select style={si} value={item.product_id} onChange={e => updateItem(i, "product_id", e.target.value)}>
                        <option value="">請選擇產品</option>
                        {products.map((p: any) => <option key={p.product_id} value={p.product_id}>{p.product_code} - {p.product_name}</option>)}
                      </select>
                    </div>
                    <div>
                      {i === 0 && <div style={sl}>數量 <span style={{ color: "#ff4d4f" }}>*</span></div>}
                      <input style={si} type="number" min={1} value={item.quantity} onChange={e => updateItem(i, "quantity", parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      {i === 0 && <div style={sl}>單價 <span style={{ color: "#ff4d4f" }}>*</span></div>}
                      <input style={si} type="number" min={0} step="0.01" value={item.unit_price} onChange={e => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div style={{ paddingTop: i === 0 ? 20 : 0 }}>
                      <button onClick={() => removeItemRow(i)} style={{ height: 36, width: 36, borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#ff4d4f", fontSize: 16, cursor: "pointer", lineHeight: "36px", textAlign: "center", padding: 0 }} title="刪除">✕</button>
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: "right", fontSize: 13, color: "#888", marginTop: 4 }}>
                  總金額：NT$ {createItems.reduce((s, it) => s + (it.quantity || 0) * (it.unit_price || 0), 0).toLocaleString()}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowCreate(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={doCreate} disabled={createSaving} style={{ ...bp, opacity: createSaving ? 0.6 : 1 }}>{createSaving ? "處理中..." : "建立採購單"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ====== Detail Modal ====== */}
        {showDetail && detail && (
          <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowDetail(false); }}>
            <div style={{ ...modalCard, width: 720 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: 0 }}>
                  採購單詳情 - {detail.po_no}
                  {detail.is_emergency && <span style={{ ...ts("#fff1f0", "#ff4d4f"), marginLeft: 8 }}>緊急</span>}
                </h3>
                <span style={ts(statusMap[detail.status]?.bg || "#f0f0f0", statusMap[detail.status]?.color || "#666")}>{statusMap[detail.status]?.label || detail.status}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20, padding: "12px 16px", background: "#fafafa", borderRadius: 6 }}>
                <div><span style={{ fontSize: 12, color: "#999" }}>供應商：</span><span style={{ fontSize: 13, color: "#333" }}>{detail.supplier_code} - {detail.supplier_name}</span></div>
                <div><span style={{ fontSize: 12, color: "#999" }}>採購日期：</span><span style={{ fontSize: 13, color: "#333" }}>{detail.order_date ? detail.order_date.slice(0, 10) : "-"}</span></div>
                <div><span style={{ fontSize: 12, color: "#999" }}>總金額：</span><span style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>NT$ {(Number(detail.total_amount) || 0).toLocaleString()}</span></div>
                <div><span style={{ fontSize: 12, color: "#999" }}>建立時間：</span><span style={{ fontSize: 13, color: "#333" }}>{detail.created_at ? detail.created_at.slice(0, 19).replace("T", " ") : "-"}</span></div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 8 }}>採購明細</div>
                <div style={cb}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>產品編碼</th>
                        <th style={th}>產品名稱</th>
                        <th style={th}>數量</th>
                        <th style={th}>單價</th>
                        <th style={th}>小計</th>
                        <th style={th}>已收貨</th>
                        <th style={th}>已退貨</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.items || []).map((it: any, i: number) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={td}>{it.product_code}</td>
                          <td style={td}>{it.product_name}</td>
                          <td style={td}>{it.quantity}</td>
                          <td style={td}>NT$ {(Number(it.unit_price) || 0).toLocaleString()}</td>
                          <td style={{ ...td, fontWeight: 500 }}>NT$ {((it.quantity || 0) * (it.unit_price || 0)).toLocaleString()}</td>
                          <td style={{ ...td, color: "#52c41a" }}>{it.received_quantity || 0}</td>
                          <td style={{ ...td, color: "#ff4d4f" }}>{it.return_quantity || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {(detail.receipts || []).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 8 }}>收貨記錄</div>
                  <div style={cb}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr><th style={th}>收貨單號</th><th style={th}>收貨日期</th><th style={th}>狀態</th></tr>
                      </thead>
                      <tbody>
                        {(detail.receipts || []).map((r: any, i: number) => (
                          <tr key={i}>
                            <td style={td}>{r.receipt_no}</td>
                            <td style={td}>{r.receipt_date ? r.receipt_date.slice(0, 10) : "-"}</td>
                            <td style={td}><span style={ts("#f6ffed", "#52c41a")}>{r.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(detail.returns || []).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 8 }}>退貨記錄</div>
                  <div style={cb}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr><th style={th}>退貨單號</th><th style={th}>產品</th><th style={th}>數量</th><th style={th}>原因</th><th style={th}>狀態</th></tr>
                      </thead>
                      <tbody>
                        {(detail.returns || []).map((r: any, i: number) => (
                          <tr key={i}>
                            <td style={td}>{r.return_no}</td>
                            <td style={td}>{r.product_code} - {r.product_name}</td>
                            <td style={{ ...td, color: "#ff4d4f", fontWeight: 500 }}>{r.quantity}</td>
                            <td style={td}>{r.reason || "-"}</td>
                            <td style={td}><span style={ts("#fff1f0", "#ff4d4f")}>{r.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowDetail(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>關閉</button>
                {["APPROVED", "RECEIVING"].includes(detail.status) && (
                  <button onClick={() => { setShowDetail(false); openReceive(detail.po_id); }} style={bg}>收貨</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====== Receive Modal ====== */}
        {showReceive && (
          <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowReceive(false); }}>
            <div style={{ ...modalCard, width: 560 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>到貨驗收</h3>
              {receiveItems.map((it: any) => (
                <div key={it.product_id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 12, alignItems: "end" }}>
                  <div>
                    <div style={sl}>{it.product_code} - {it.product_name}</div>
                    <div style={{ fontSize: 11, color: "#bbb" }}>採購數量：{it.quantity}，已收：{it.received_quantity || 0}，剩餘：{(it.quantity || 0) - (it.received_quantity || 0)}</div>
                  </div>
                  <div>
                    <input style={si} type="number" min={0} max={(it.quantity || 0) - (it.received_quantity || 0)}
                      value={receiveForm[it.product_id] || 0}
                      onChange={e => setReceiveForm({ ...receiveForm, [it.product_id]: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowReceive(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={doReceive} disabled={receiveSaving} style={{ ...bg, opacity: receiveSaving ? 0.6 : 1 }}>{receiveSaving ? "處理中..." : "確認收貨"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ====== Return Modal ====== */}
        {showReturn && (
          <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowReturn(false); }}>
            <div style={{ ...modalCard, width: 520 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>採購退貨</h3>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={sl}>退貨產品 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <select style={si} value={returnForm.product_id} onChange={e => setReturnForm({ ...returnForm, product_id: e.target.value })}>
                    <option value="">請選擇產品</option>
                    {returnPoItems.map((it: any) => (
                      <option key={it.product_id} value={it.product_id}>
                        {it.product_code} - {it.product_name}（可退：{(it.received_quantity || 0) - (it.return_quantity || 0)}）
                      </option>
                    ))}
                  </select>
                </div>
                {returnForm.product_id && (
                  <div>
                    <div style={sl}>退貨數量 <span style={{ color: "#ff4d4f" }}>*</span></div>
                    <input style={si} type="number" min={1}
                      max={(() => { const item = returnPoItems.find(it => it.product_id === returnForm.product_id); return item ? (item.received_quantity || 0) - (item.return_quantity || 0) : 0; })()}
                      value={returnForm.quantity}
                      onChange={e => setReturnForm({ ...returnForm, quantity: parseInt(e.target.value) || 0 })} />
                  </div>
                )}
                <div>
                  <div style={sl}>退貨原因</div>
                  <select style={si} value={returnForm.reason} onChange={e => setReturnForm({ ...returnForm, reason: e.target.value })}>
                    <option value="">請選擇</option>
                    <option value="品質異常">品質異常</option>
                    <option value="數量不符">數量不符</option>
                    <option value="規格不符">規格不符</option>
                    <option value="效期過短">效期過短</option>
                    <option value="包裝破損">包裝破損</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowReturn(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={doReturn} disabled={returnSaving} style={{ ...br, opacity: returnSaving ? 0.6 : 1 }}>{returnSaving ? "處理中..." : "確認退貨"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}