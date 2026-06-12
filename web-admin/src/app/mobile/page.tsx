"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, Users, Package, FileText, MapPin, ClipboardList, Building2, Bell } from "lucide-react";
import { api } from "@/lib/api";

export default function MobileHomePage() {
  const [stats, setStats] = useState({ customers: 0, products: 0, orders: 0 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const [biRes, notifRes] = await Promise.all([
          api.get("/bi/dashboard/ceo"),
          api.get("/notifications?page_size=5"),
        ]);
        const bi = (biRes as any).data || (biRes as any);
        setStats({ customers: bi?.stats?.total_customers || 0, products: bi?.stats?.total_products || 0, orders: bi?.stats?.total_orders || 0 });
        const items = (notifRes as any).data?.items || (notifRes as any).items || [];
        setNotifications(items.slice(0, 5));
      } catch (e) {} finally { setLoading(false); }
    }
    load();
  }, []);

  var mods = [
    { label: "客戶管理", icon: Users, color: "#1890ff", path: "/mobile/customers", count: stats.customers },
    { label: "業務拜訪", icon: MapPin, color: "#fa8c16", path: "/mobile/visits", count: null },
    { label: "銷售訂單", icon: FileText, color: "#13c2c2", path: "/mobile/orders", count: stats.orders },
    { label: "樣品/打板", icon: Package, color: "#722ed1", path: "/mobile/samples", count: null },
    { label: "寄庫出庫", icon: ClipboardList, color: "#eb2f96", path: "/mobile/consignment/release", count: null },
    { label: "寄庫換貨出庫", icon: Building2, color: "#2f54eb", path: "/mobile/consignment/exchange", count: null },
  ];

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 24, padding: "10px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <Search size={18} color="#999" />
          <input placeholder="搜尋..." style={{ flex: 1, border: "none", outline: "none", fontSize: 15, marginLeft: 8, background: "transparent" }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[{ label: "客戶", val: stats.customers, c: "#1890ff" }, { label: "產品", val: stats.products, c: "#52c41a" }, { label: "訂單", val: stats.orders, c: "#fa8c16" }].map((s, i) => (
          <div key={i} className="mobile-card" style={{ textAlign: "center", padding: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{loading ? "-" : s.val}</div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Module Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {mods.map((m, i) => (
          <div key={i} className="mobile-card mobile-btn" onClick={() => router.push(m.path)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: m.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <m.icon size={24} color={m.color} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{m.label}</span>
            {m.count !== null && <span style={{ fontSize: 11, color: m.color }}>{loading ? "..." : m.count + " 筆"}</span>}
          </div>
        ))}
      </div>

      {/* Notifications */}
      <div className="mobile-card" onClick={() => router.push("/notifications")} style={{ cursor: "pointer", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>📋 最新通知</span>
          <ChevronRight size={18} color="#999" />
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 20, color: "#999", fontSize: 13 }}>載入中...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: "#999", fontSize: 13 }}>尚無通知</div>
        ) : (
          notifications.map((item: any, i: number) => (
            <div key={item.notification_id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < notifications.length - 1 ? "1px solid #f0f0f0" : "none" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.is_read ? "#ccc" : "#1890ff", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: item.is_read ? "#999" : "#333", fontWeight: item.is_read ? 400 : 500 }}>{item.title || item.content || "通知"}</div>
                {item.created_at && <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{item.created_at.slice(0, 16).replace("T", " ")}</div>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "1px solid #e8e8e8", display: "flex", justifyContent: "space-around", padding: "8px 0", margin: "0 -16px", zIndex: 100 }}>
        {[
          { icon: "🏠", label: "首頁", path: "/mobile" },
          { icon: "👥", label: "客戶", path: "/mobile/customers" },
          { icon: "📝", label: "訂單", path: "/mobile/orders" },
          { icon: "⚠️", label: "召回", path: "/mobile/recall" },
        ].map((item, i) => (
          <button key={i} className="mobile-btn" onClick={() => router.push(item.path)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: 11 }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span><span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
