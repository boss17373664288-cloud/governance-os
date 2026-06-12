"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_RECEIPT: { label: "待收貨", color: "#fa8c16", bg: "#fff7e6" },
  RECEIVED: { label: "已收貨", color: "#1890ff", bg: "#e6f7ff" },
  QA_PENDING: { label: "QA待驗", color: "#722ed1", bg: "#f9f0ff" },
  QA_PASSED: { label: "QA通過", color: "#52c41a", bg: "#f6ffed" },
  QA_FAILED: { label: "QA未過", color: "#ff4d4f", bg: "#fff1f0" },
  WAREHOUSED: { label: "已入倉", color: "#13c2c2", bg: "#e6fffb" },
  RETURNING: { label: "退貨中", color: "#eb2f96", bg: "#fff0f6" },
  RETURNED: { label: "已退貨", color: "#999", bg: "#f5f5f5" },
};

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const bp: React.CSSProperties = { height: 32, padding: "0 14px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, cursor: "pointer" };

export default function GoodsReceiptPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [pos, setPos] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({ po_id: "", warehouse_id: "" });
  const [creating, setCreating] = useState(false);

  // Detail / action modal
  const [detail, setDetail] = useState<any>(null);
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchList = useCallback(() => {
    setLoading(true);
    api.get("/goods-receipts", { params: { page, page_size: 15, status: statusFilter || undefined } })
      .then((r: any) => { setReceipts(r.items || []); setPagination(r.pagination || {}); })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = async () => {
    const [poR, whR] = await Promise.all([
      api.get("/purchase", { params: { status: "APPROVED", page_size: 100 } }),
      api.get("/inventory/warehouses"),
    ]);
    setPos(((poR as any).items || (poR as any).data || []));
    setWarehouses((whR as any).data || whR as any || []);
    setCreateForm({ po_id: "", warehouse_id: "" });
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!createForm.po_id) return alert("請選擇採購單");
    setCreating(true);
    try {
      await api.post("/goods-receipts/from-po", createForm);
      setShowCreate(false);
      fetchList();
    } catch (e: any) { alert(e?.response?.data?.message || "建立失敗"); }
    finally { setCreating(false); }
  };

  const openDetail = async (id: string) => {
    try {
      const r: any = await api.get("/goods-receipts/" + id);
      setDetail(r);
      setDetailItems(r.items?.map((it: any) => ({ ...it, received_qty: it.received_qty || it.expected_qty, qa_result: it.qa_result || "PENDING" })) || []);
    } catch (e) { alert("載入失敗"); }
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await api.put("/goods-receipts/" + detail.receipt_id + "/confirm", { items: detailItems });
      alert("已確認收貨");
      setDetail(null);
      fetchList();
    } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
    finally { setActionLoading(false); }
  };

  const handleSubmitQA = async () => {
    setActionLoading(true);
    try {
      await api.put("/goods-receipts/" + detail.receipt_id + "/submit-qa");
      alert("已送QA");
      setDetail(null);
      fetchList();
    } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
    finally { setActionLoading(false); }
  };

  const handleQAResult = async () => {
    setActionLoading(true);
    try {
      await api.put("/goods-receipts/" + detail.receipt_id + "/qa-result", { items: detailItems });
      alert("QA結果已記錄");
      setDetail(null);
      fetchList();
    } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
    finally { setActionLoading(false); }
  };

  const handleWarehouse = async () => {
    if (!confirm("確認入倉？將自動建立批次記錄。")) return;
    setActionLoading(true);
    try {
      await api.put("/goods-receipts/" + detail.receipt_id + "/warehouse");
      alert("已入倉");
      setDetail(null);
      fetchList();
    } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
    finally { setActionLoading(false); }
  };

  const handleReturn = async () => {
    if (!confirm("確認退貨？")) return;
    setActionLoading(true);
    try {
      await api.put("/goods-receipts/" + detail.receipt_id + "/return");
      alert("已送退貨");
      setDetail(null);
      fetchList();
    } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
    finally { setActionLoading(false); }
  };

  const handleReturnConfirm = async () => {
    if (!confirm("確認退貨完成？")) return;
    setActionLoading(true);
    try {
      await api.put("/goods-receipts/" + detail.receipt_id + "/return-confirm");
      alert("退貨已完成");
      setDetail(null);
      fetchList();
    } catch (e: any) { alert(e?.response?.data?.message || "失敗"); }
    finally { setActionLoading(false); }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "20px 24px", background: "#eef2f5", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a2e", margin: 0 }}>收貨管理</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ height: 32, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px" }}>
              <option value="">全部狀態</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={openCreate} style={bp}>+ 新建收貨單</button>
          </div>
        </div>

        {loading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : receipts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999", background: "#fff", borderRadius: 6 }}>尚無收貨單</div>
        ) : (
          <div style={cb}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#fafafa" }}>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>收貨單號</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>採購單號</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>供應商</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>倉庫</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>狀態</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>收貨日期</th>
              </tr></thead>
              <tbody>
                {receipts.map((r, i) => {
                  const st = STATUS_MAP[r.status] || { label: r.status, color: "#999", bg: "#f5f5f5" };
                  return (
                    <tr key={r.receipt_id} onClick={() => openDetail(r.receipt_id)} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", cursor: "pointer" }}>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#1890ff", borderBottom: "1px solid #f0f0f0", fontFamily: "monospace" }}>{r.receipt_no}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" }}>{r.po_no || "-"}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" }}>{r.supplier_name || "-"}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" }}>{r.warehouse_name || "-"}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                        <span style={{ display: "inline-flex", fontSize: 11, padding: "2px 8px", borderRadius: 2, background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#666", borderBottom: "1px solid #f0f0f0" }}>{r.receipt_date || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.total_pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ ...bp, background: page <= 1 ? "#ccc" : "#1890ff" }}>上一頁</button>
            <span style={{ lineHeight: "32px", fontSize: 13 }}>{page} / {pagination.total_pages}</span>
            <button disabled={page >= pagination.total_pages} onClick={() => setPage(page + 1)} style={{ ...bp, background: page >= pagination.total_pages ? "#ccc" : "#1890ff" }}>下一頁</button>
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 480, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>新建收貨單</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>採購單 *</div>
                  <select style={{ width: "100%", height: 36, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px" }} value={createForm.po_id} onChange={e => setCreateForm({...createForm, po_id: e.target.value})}>
                    <option value="">請選擇</option>
                    {pos.map((po: any) => <option key={po.po_id} value={po.po_id}>{po.po_no} - {po.supplier_name || ""}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>入庫倉庫</div>
                  <select style={{ width: "100%", height: 36, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px" }} value={createForm.warehouse_id} onChange={e => setCreateForm({...createForm, warehouse_id: e.target.value})}>
                    <option value="">請選擇</option>
                    {warehouses.map((w: any) => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowCreate(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={handleCreate} disabled={creating} style={{ ...bp, height: 36, opacity: creating ? 0.6 : 1 }}>{creating ? "建立中..." : "建立"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Detail / Action Modal */}
        {detail && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) { setDetail(null); fetchList(); } }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 720, maxHeight: "85vh", overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>收貨單 {detail.receipt_no}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", marginBottom: 16, fontSize: 13 }}>
                <div>採購單號: <strong>{detail.po_no || "-"}</strong></div>
                <div>狀態: <span style={{ color: (STATUS_MAP[detail.status] || {}).color }}>{(STATUS_MAP[detail.status] || {}).label || detail.status}</span></div>
                <div>供應商: {detail.supplier_name || "-"}</div>
                <div>倉庫: {detail.warehouse_name || "-"}</div>
                <div>收貨日期: {detail.receipt_date || "-"}</div>
              </div>

              <h4 style={{ fontSize: 14, margin: "0 0 8px" }}>收貨明細</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                <thead><tr style={{ background: "#fafafa" }}>
                  <th style={{ padding: "8px", fontSize: 12, color: "#888", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>產品</th>
                  <th style={{ padding: "8px", fontSize: 12, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0", width: 80 }}>預計數量</th>
                  <th style={{ padding: "8px", fontSize: 12, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0", width: 80 }}>實收數量</th>
                  <th style={{ padding: "8px", fontSize: 12, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0", width: 80 }}>批號</th>
                  <th style={{ padding: "8px", fontSize: 12, color: "#888", textAlign: "center", borderBottom: "1px solid #f0f0f0", width: 80 }}>QA</th>
                </tr></thead>
                <tbody>
                  {detailItems.map((it: any, i: number) => (
                    <tr key={it.item_id}>
                      <td style={{ padding: "8px", fontSize: 13, borderBottom: "1px solid #f0f0f0" }}>{it.product_code} {it.product_name}</td>
                      <td style={{ padding: "8px", fontSize: 13, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>{it.expected_qty}</td>
                      <td style={{ padding: "4px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                        {detail.status === "PENDING_RECEIPT" ? (
                          <input style={{ width: 60, height: 28, textAlign: "center", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13 }} type="number" min={0} value={it.received_qty} onChange={e => { const ns = [...detailItems]; ns[i] = {...ns[i], received_qty: parseInt(e.target.value) || 0}; setDetailItems(ns); }} />
                        ) : <span>{it.received_qty}</span>}
                      </td>
                      <td style={{ padding: "4px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                        {detail.status === "PENDING_RECEIPT" ? (
                          <input style={{ width: 100, height: 28, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 11 }} value={it.batch_no || ""} onChange={e => { const ns = [...detailItems]; ns[i] = {...ns[i], batch_no: e.target.value}; setDetailItems(ns); }} placeholder="供應商批號" />
                        ) : <span style={{ fontSize: 11 }}>{it.batch_no || "-"}</span>}
                      </td>
                      <td style={{ padding: "4px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                        {detail.status === "QA_PENDING" ? (
                          <select style={{ height: 28, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 12 }} value={it.qa_result} onChange={e => { const ns = [...detailItems]; ns[i] = {...ns[i], qa_result: e.target.value}; setDetailItems(ns); }}>
                            <option value="PENDING">待驗</option>
                            <option value="PASSED">通過</option>
                            <option value="FAILED">不通過</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: 11, color: it.qa_result === "PASSED" ? "#52c41a" : it.qa_result === "FAILED" ? "#ff4d4f" : "#999" }}>{it.qa_result === "PASSED" ? "✓" : it.qa_result === "FAILED" ? "✕" : "-"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Action buttons based on status */}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                {detail.status === "PENDING_RECEIPT" && (
                  <button onClick={handleConfirm} disabled={actionLoading} style={{ ...bp, background: "#fa8c16" }}>確認收貨</button>
                )}
                {detail.status === "RECEIVED" && (
                  <button onClick={handleSubmitQA} disabled={actionLoading} style={{ ...bp, background: "#722ed1" }}>送QA檢驗</button>
                )}
                {detail.status === "QA_PENDING" && (
                  <button onClick={handleQAResult} disabled={actionLoading} style={{ ...bp, background: "#722ed1" }}>提交QA結果</button>
                )}
                {detail.status === "QA_PASSED" && (
                  <button onClick={handleWarehouse} disabled={actionLoading} style={{ ...bp, background: "#52c41a" }}>確認入倉</button>
                )}
                {detail.status === "QA_FAILED" && (
                  <button onClick={handleReturn} disabled={actionLoading} style={{ ...bp, background: "#ff4d4f" }}>退貨</button>
                )}
                {detail.status === "RETURNING" && (
                  <button onClick={handleReturnConfirm} disabled={actionLoading} style={{ ...bp, background: "#eb2f96" }}>確認退貨完成</button>
                )}
                <button onClick={() => { setDetail(null); fetchList(); }} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" }}>關閉</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
