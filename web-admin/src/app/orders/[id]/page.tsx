"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { api } from "../../../lib/api";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "草稿", PENDING_LOW_PRICE_APPROVAL: "低價待審", PENDING_APPROVAL: "待審批",
  APPROVED: "已核准", REJECTED: "已駁回", SHIPPED: "已出庫", COMPLETED: "已完成",
};
const sc: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 20, marginBottom: 16 };
const sl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const sv: React.CSSProperties = { fontSize: 14, color: "#333", fontWeight: 500 };
const bp: React.CSSProperties = { height: 32, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const bs: React.CSSProperties = { ...bp, background: "#52c41a" };
const br: React.CSSProperties = { ...bp, background: "#ff4d4f" };
const bdf: React.CSSProperties = { height: 32, padding: "0 16px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" };
const th: React.CSSProperties = { padding: "8px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0" };
const td: React.CSSProperties = { padding: "8px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get("/sales-orders/" + id), api.get("/sales-orders/" + id + "/items")])
      .then(([or, ir]: any[]) => { setOrder(or.data); setItems(ir.data || []); }).finally(() => setLoading(false));
  };
  useEffect(() => { if (id) fetchData(); }, [id]);

  const doAction = async (action: string) => {
    setActing(true);
    try { await api.put("/sales-orders/" + id + "/" + action); fetchData(); }
    catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); } finally { setActing(false); }
  };

  const doDelete = async () => {
    if (!confirm("確定刪除此訂單？")) return;
    setActing(true);
    try { await api.delete("/sales-orders/" + id); alert("已刪除"); router.push("/orders"); }
    catch (e: any) { alert(e?.response?.data?.message || "刪除失敗"); } finally { setActing(false); }
  };

  if (loading) return <DashboardLayout><div style={{ textAlign: "center", padding: 48, color: "#999" }}>載入中...</div></DashboardLayout>;
  if (!order) return <DashboardLayout><div style={{ textAlign: "center", padding: 48, color: "#999" }}>訂單不存在</div></DashboardLayout>;

  const status = order.status;
  const isDraft = status === "DRAFT" || status === "PENDING_LOW_PRICE_APPROVAL";
  const isPendingApproval = status === "PENDING_APPROVAL";

  return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push("/orders")} style={{ ...bdf, width: 36, padding: 0, fontSize: 18 }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#333", margin: 0, flex: 1 }}>訂單詳情</h1>
        <button onClick={doDelete} disabled={acting} style={br}>刪除訂單</button>
      </div>
      <div style={{ ...sc, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#333", marginRight: 16 }}>{order.order_no}</span>
        <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 2, background: "#e6f7ff", color: "#1890ff", fontWeight: 500 }}>{STATUS_LABEL[status] || status}</span>
        {order.reject_count > 0 && <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 2, background: "#fff1f0", color: "#ff4d4f", fontWeight: 500 }}>已駁回 {order.reject_count} 次</span>}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {isDraft && <button onClick={() => doAction("submit")} disabled={acting} style={bp}>提交審批</button>}
          {isPendingApproval && <><button onClick={() => doAction("approve")} disabled={acting} style={bs}>核准</button><button onClick={() => doAction("reject")} disabled={acting} style={br}>駁回</button></>}
        </div>
      </div>
      <div style={sc}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>基本資訊</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          <div><div style={sl}>訂單編號</div><div style={{ ...sv, fontFamily: "monospace" }}>{order.order_no}</div></div>
          <div><div style={sl}>客戶</div><div style={sv}>{order.customer?.customer_name || "-"}</div></div>
          <div><div style={sl}>狀態</div><div style={sv}>{STATUS_LABEL[status] || status}</div></div>
          <div><div style={sl}>訂單日期</div><div style={{ ...sv, fontSize: 13 }}>{order.order_date ? order.order_date.slice(0, 10) : "-"}</div></div>
          <div><div style={sl}>總金額</div><div style={{ ...sv, color: "#1890ff" }}>NT$ {Number(order.total_amount || 0).toLocaleString("zh-TW")}</div></div>
          <div><div style={sl}>總成本</div><div style={sv}>NT$ {Number(order.total_cost || 0).toLocaleString("zh-TW")}</div></div>
        </div>
      </div>
      <div style={{ ...sc, overflow: "auto" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>訂單明細</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={th}>產品編碼</th><th style={th}>產品名稱</th><th style={{ ...th, textAlign: "center" }}>數量</th>
            <th style={{ ...th, textAlign: "center" }}>立即出貨</th><th style={{ ...th, textAlign: "center" }}>寄庫</th>
            <th style={{ ...th, textAlign: "right" }}>單價</th><th style={{ ...th, textAlign: "right" }}>小計</th>
          </tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan={7} style={{ ...td, textAlign: "center", padding: 32, color: "#999" }}>暫無明細</td></tr> :
              items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 12 }}>{item.product_code || "-"}</td>
                  <td style={{ ...td, fontWeight: 500 }}>{item.product_name || "-"}</td>
                  <td style={{ ...td, textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ ...td, textAlign: "center" }}>{item.immediate_ship_quantity || 0}</td>
                  <td style={{ ...td, textAlign: "center" }}>{item.consignment_quantity || 0}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "monospace" }}>NT$ {Number(item.unit_price || 0).toLocaleString("zh-TW")}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontWeight: 500 }}>NT$ {Number((item.quantity * item.unit_price) || 0).toLocaleString("zh-TW")}</td>
                </tr>))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
