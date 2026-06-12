"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 16, marginBottom: 12 };
const labelStyle: React.CSSProperties = { fontSize: 12, color: "#888", marginBottom: 4 };

export default function MobileSampleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [sample, setSample] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/sample-requests/" + params.id).then((r: any) => setSample(r.data || r)).catch(() => {}).finally(() => setLoading(false)); }, [params.id]);
  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div>;
  if (!sample) return <div style={{ textAlign: "center", padding: 40, color: "#999" }}>申請不存在</div>;
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <button className="mobile-btn" onClick={() => router.back()} style={{ background: "none", border: "none", padding: 8, cursor: "pointer", minWidth: 44, minHeight: 44 }}><ArrowLeft size={22} color="#333" /></button>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, flex: 1 }}>打板詳情</h1>
      </div>
      <div className="mobile-card" style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={labelStyle}>申請編號</span><span style={{ fontSize: 14, fontWeight: 500 }}>{sample.request_no || "-"}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={labelStyle}>客戶</span><span style={{ fontSize: 14 }}>{sample.customer_name || "-"}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={labelStyle}>狀態</span><span style={{ fontSize: 14 }}>{sample.status || "-"}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={labelStyle}>目的</span><span style={{ fontSize: 14 }}>{sample.purpose || "-"}</span></div>
      </div>
      {sample.items && sample.items.length > 0 && (
        <div className="mobile-card" style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>產品明細</div>
          {sample.items.map((item: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
              <span style={{ flex: 1 }}>{item.product_name || "-"}</span><span>x{item.quantity}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}