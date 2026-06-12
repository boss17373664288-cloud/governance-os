"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";
import { downloadCsv } from "../../lib/download";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const ts = (bg: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color, whiteSpace: "nowrap" });
const si: React.CSSProperties = { width: 260, height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", background: "#fff" };
const actionBtn: React.CSSProperties = { height: 28, padding: "0 10px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer", marginRight: 4 };

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: "草稿", bg: "#f5f5f5", color: "#999" },
  PENDING_LOW_PRICE_APPROVAL: { label: "低價待審", bg: "#fff7e6", color: "#fa8c16" },
  PENDING_APPROVAL: { label: "待審批", bg: "#e6f7ff", color: "#1890ff" },
  APPROVED: { label: "已核准", bg: "#f6ffed", color: "#52c41a" },
  REJECTED: { label: "已駁回", bg: "#fff1f0", color: "#ff4d4f" },
  SHIPPED: { label: "已出貨", bg: "#e6fffb", color: "#13c2c2" },
  COMPLETED: { label: "已完成", bg: "#f6ffed", color: "#52c41a" },
  CANCELLED: { label: "已取消", bg: "#f5f5f5", color: "#999" },
  REJECTED_LOCKED: { label: "駁回鎖定", bg: "#fff1f0", color: "#ff4d4f" },
  STOCK_ALLOCATED: { label: "已分配庫存", bg: "#e6fffb", color: "#13c2c2" },
  ON_HOLD_RECALL: { label: "召回暫緩", bg: "#fff7e6", color: "#fa8c16" },
  PARTIAL_SHIPPED: { label: "部分出貨", bg: "#e6f7ff", color: "#1890ff" },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params: any = { page, page_size: 20 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.get("/sales-orders", { params })
      .then((r: any) => { setOrders(r.data?.items || []); setPagination(r.data?.pagination || {}); })
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (orderId: string, orderNo: string) => {
    if (!confirm("確定要刪除訂單 " + orderNo + " 嗎？此操作無法復原。")) return;
    try {
      await api.delete("/sales-orders/" + orderId);
      alert("訂單已刪除");
      fetchData();
    } catch (e: any) { alert(e?.response?.data?.message || "刪除失敗"); }
  };

  const handleSubmit = async (orderId: string) => { try { await api.put("/sales-orders/" + orderId + "/submit"); alert("已提交審批"); fetchData(); } catch (e: any) { alert(e?.response?.data?.message || "提交失敗"); } };
  const handleApprove = async (orderId: string) => { try { await api.put("/sales-orders/" + orderId + "/approve"); alert("已核准"); fetchData(); } catch (e: any) { alert(e?.response?.data?.message || "核准失敗"); } };
  const handleReject = async (orderId: string) => { const reason = prompt("請輸入駁回原因："); if (reason === null) return; try { await api.put("/sales-orders/" + orderId + "/reject", { reason }); alert("已駁回"); fetchData(); } catch (e: any) { alert(e?.response?.data?.message || "駁回失敗"); } };
  const handleShip = async (orderId: string) => { if (!confirm("確認出貨？")) return; try { await api.put("/sales-orders/" + orderId + "/ship"); alert("已出貨"); fetchData(); } catch (e: any) { alert(e?.response?.data?.message || "出貨失敗"); } };
  const handleComplete = async (orderId: string) => { if (!confirm("確認結案？")) return; try { await api.put("/sales-orders/" + orderId + "/complete"); alert("已結案"); fetchData(); } catch (e: any) { alert(e?.response?.data?.message || "結案失敗"); } };
  const handleCancel = async (orderId: string) => { if (!confirm("確認取消此訂單？")) return; try { await api.put("/sales-orders/" + orderId + "/cancel"); alert("已取消"); fetchData(); } catch (e: any) { alert(e?.response?.data?.message || "取消失敗"); } };
  const handleUnlock = async (orderId: string) => { if (!confirm("確認解鎖此訂單？")) return; try { await api.put("/sales-orders/" + orderId + "/unlock"); alert("已解鎖"); fetchData(); } catch (e: any) { alert(e?.response?.data?.message || "解鎖失敗"); } };
  const handlePrint = async (orderId: string) => {
    try {
      const r = await api.post("/print/generate", { entity_type: "sales_order", entity_id: orderId });
      if (r.data?.pdf_base64) {
        const byteChars = atob(r.data.pdf_base64);
        const byteNums = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
        const byteArr = new Uint8Array(byteNums);
        const blob = new Blob([byteArr], { type: "application/pdf" });
        window.open(URL.createObjectURL(blob), "_blank");
      }
    } catch (e: any) { alert(e?.response?.data?.message || "打印失敗"); }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a2e" }}>銷售訂單</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#999" }}>管理所有銷售訂單與審批流程</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/orders/new")} style={{ height: 32, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ 新增銷售訂單</button>
          <button onClick={() => downloadCsv("/api/v1/system/export/orders", "銷售訂單.csv")} style={{ height: 32, padding: "0 14px", borderRadius: 4, border: "1px solid #52c41a", background: "#fff", color: "#52c41a", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>📥 導出 CSV</button>
        </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <input style={si} placeholder="搜尋訂單編號..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select style={{ ...si, width: 140 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">全部狀態</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {loading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : orders.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>尚無訂單</div> : (
          <div style={cb}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>訂單編號</th><th style={th}>客戶</th><th style={th}>產品</th><th style={{ ...th, textAlign: "center" }}>數量</th><th style={{ ...th, textAlign: "center" }}>寄庫數</th><th style={th}>日期</th><th style={th}>金額</th><th style={th}>狀態</th><th style={{ ...th, textAlign: "center" }}>操作</th></tr></thead>
                <tbody>
                  {orders.map((o: any, i: number) => (
                    <tr key={o.order_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ ...td, fontWeight: 500, color: "#1890ff" }}>{o.order_no}</td>
                      <td style={td}>{o.customer_name || o.customer_code || "-"}</td>
                      <td style={{ ...td, fontSize: 12, maxWidth: 180, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }} title={o.product_summary}>{o.product_summary || "-"}</td>
                      <td style={{ ...td, textAlign: "center" }}>{o.total_quantity || 0}</td><td style={{ ...td, textAlign: "center", color: o.total_consignment > 0 ? "#1890ff" : "#999" }}>{o.total_consignment || 0}</td>
                      <td style={td}>{o.order_date ? o.order_date.slice(0, 10) : "-"}</td>
                      <td style={{ ...td, fontWeight: 600 }}>NT$ {(Number(o.total_amount) || 0).toLocaleString()}</td>
                      <td style={td}><span style={ts(STATUS_MAP[o.status]?.bg || "#f0f0f0", STATUS_MAP[o.status]?.color || "#666")}>{STATUS_MAP[o.status]?.label || o.status}</span></td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <button onClick={(e) => { e.stopPropagation(); handlePrint(o.order_id); }} style={{ height: 26, padding: "0 8px", borderRadius: 3, border: "1px solid #52c41a", background: "#fff", color: "#52c41a", fontSize: 11, cursor: "pointer", marginRight: 4 }}>列印</button>                        <button onClick={(e) => { e.stopPropagation(); router.push("/orders/" + o.order_id); }} style={{ height: 26, padding: "0 8px", borderRadius: 3, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 11, cursor: "pointer", marginRight: 4 }}>檢視</button>                        {(o.status === "DRAFT" || o.status === "REJECTED") && (                          <button onClick={(e) => { e.stopPropagation(); handleSubmit(o.order_id); }} style={{ height: 26, padding: "0 8px", borderRadius: 3, border: "1px solid #fa8c16", background: "#fff", color: "#fa8c16", fontSize: 11, cursor: "pointer", marginRight: 4 }}>提交</button>                        )}                        {o.status === "PENDING_APPROVAL" && (                          <><button onClick={(e) => { e.stopPropagation(); handleApprove(o.order_id); }} style={{ height: 26, padding: "0 8px", borderRadius: 3, border: "1px solid #52c41a", background: "#fff", color: "#52c41a", fontSize: 11, cursor: "pointer", marginRight: 4 }}>核准</button>                          <button onClick={(e) => { e.stopPropagation(); handleReject(o.order_id); }} style={{ height: 26, padding: "0 8px", borderRadius: 3, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 11, cursor: "pointer", marginRight: 4 }}>駁回</button></>                        )}                        {o.status === "APPROVED" && (                          <button onClick={(e) => { e.stopPropagation(); handleShip(o.order_id); }} style={{ height: 26, padding: "0 8px", borderRadius: 3, border: "1px solid #13c2c2", background: "#fff", color: "#13c2c2", fontSize: 11, cursor: "pointer", marginRight: 4 }}>出貨</button>                        )}                        {o.status === "SHIPPED" && (                          <button onClick={(e) => { e.stopPropagation(); handleComplete(o.order_id); }} style={{ height: 26, padding: "0 8px", borderRadius: 3, border: "1px solid #52c41a", background: "#fff", color: "#52c41a", fontSize: 11, cursor: "pointer", marginRight: 4 }}>結案</button>                        )}                        {(o.status === "DRAFT" || o.status === "APPROVED") && (                          <button onClick={(e) => { e.stopPropagation(); handleCancel(o.order_id); }} style={{ height: 26, padding: "0 8px", borderRadius: 3, border: "1px solid #999", background: "#fff", color: "#999", fontSize: 11, cursor: "pointer", marginRight: 4 }}>取消</button>                        )}                        {o.status === "REJECTED_LOCKED" && (                          <button onClick={(e) => { e.stopPropagation(); handleUnlock(o.order_id); }} style={{ height: 26, padding: "0 8px", borderRadius: 3, border: "1px solid #fa8c16", background: "#fff", color: "#fa8c16", fontSize: 11, cursor: "pointer", marginRight: 4 }}>解鎖</button>                        )}                        {(o.status === "DRAFT" || o.status === "CANCELLED") && (                          <button onClick={(e) => { e.stopPropagation(); handleDelete(o.order_id, o.order_no); }} style={{ height: 26, padding: "0 8px", borderRadius: 3, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 11, cursor: "pointer" }}>刪除</button>                        )}
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
      </div>
    </DashboardLayout>
  );
}