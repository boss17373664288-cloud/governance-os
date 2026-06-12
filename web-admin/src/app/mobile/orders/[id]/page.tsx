"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 16, marginBottom: 12 };
const labelStyle: React.CSSProperties = { fontSize: 12, color: "#888", marginBottom: 4 };

export default function MobileOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/sales-orders/" + params.id).then((r: any) => setOrder(r.data || r)).catch(() => {}).finally(() => setLoading(false)); }, [params.id]);
  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div>;
  if (!order) return <div style={{ textAlign: "center", padding: 40, color: "#999" }}>訂單不存在</div>;
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <button className="mobile-btn" onClick={() => router.back()} style={{ background: "none", border: "none", padding: 8, cursor: "pointer", minWidth: 44, minHeight: 44 }}><ArrowLeft size={22} color="#333" /></button>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, flex: 1 }}>訂單詳情</h1>
      </div>
      <div className="mobile-card" style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={labelStyle}>訂單編號</span><span style={{ fontSize: 14, fontWeight: 500 }}>{order.order_no || "-"}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={labelStyle}>客戶</span><span style={{ fontSize: 14 }}>{order.customer_name || "-"}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={labelStyle}>狀態</span><span style={{ fontSize: 14 }}>{order.status || "-"}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={labelStyle}>日期</span><span style={{ fontSize: 14 }}>{order.order_date ? order.order_date.slice(0, 10) : "-"}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={labelStyle}>總金額</span><span style={{ fontSize: 16, fontWeight: 700, color: "#1890ff" }}>NT$ {order.total_amount || 0}</span></div>
      </div>
      {order.items && order.items.length > 0 && (
        <div className="mobile-card" style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>訂單明細</div>
          {order.items.map((item: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
              <span style={{ flex: 1 }}>{item.product_name || "-"}</span><span style={{ width: 50, textAlign: "center" }}>x{item.quantity}</span><span style={{ width: 80, textAlign: "right" }}>NT$ {item.subtotal || item.unit_price * item.quantity || 0}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}