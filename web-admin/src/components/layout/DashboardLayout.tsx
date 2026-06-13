"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, api } from "../../lib/api";

function NotificationBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const fetchCount = () => {
      api.get("/notifications/unread-count").then((r: any) => setCount(r.data?.count || 0)).catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);
  if (count === 0) return null;
  return <span style={{ position: "absolute", top: -8, right: -10, background: "#ff4d4f", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{count > 99 ? "99+" : count}</span>;
}

const menuGroups = [
  { title: "總覽", items: [
    { label: "儀表板", path: "/bi", icon: "📊" },
  ]},
  { title: "客戶與業務", items: [
    { label: "客戶管理", path: "/customers", icon: "👥" },
    { label: "業務拜訪", path: "/visits", icon: "🏃" },
    { label: "銷售訂單", path: "/orders", icon: "📝" },
  ]},
  { title: "產品與庫存", items: [
    { label: "產品管理", path: "/products", icon: "📦" },
    { label: "庫存管理", path: "/inventory", icon: "🏭" },
    { label: "收貨管理", path: "/goods-receipt", icon: "📥" },
    { label: "寄庫管理", path: "/consignment", icon: "🔄" },
    { label: "樣品/打板", path: "/samples", icon: "🧪" },
    { label: "召回管理", path: "/recall", icon: "⚠️" },
  ]},
  { title: "供應鏈", items: [
    { label: "供應商管理", path: "/suppliers", icon: "🚚" },
    { label: "採購管理", path: "/purchase", icon: "🛒" },
  ]},
  { title: "財務", items: [
    { label: "財務管理", path: "/finance", icon: "💰" },
    { label: "會計管理", path: "/accounting", icon: "🧾" },
    { label: "預算控制", path: "/budget", icon: "💵" },
    { label: "報銷管理", path: "/expense", icon: "📄" },
    { label: "薪酬管理", path: "/payroll", icon: "💸" },
    { label: "銷售獎金", path: "/commission", icon: "🏆" },
    { label: "介紹人酬謝", path: "/referral", icon: "🤝" },
  ]},
  { title: "系統", items: [
    { label: "通知中心", path: "/notifications", icon: "🔔" },
    { label: "表單中心", path: "/forms", icon: "📋" },
    { label: "打印模板", path: "/print", icon: "🖨️" },
    { label: "SOS安全", path: "/sos", icon: "🆘" },
    { label: "系統設置", path: "/system", icon: "⚙️" },
  ]},
];

const styles = {
  layout: { display: "flex", height: "100vh", overflow: "hidden" } as React.CSSProperties,
  sidebar: {
    width: 240, minWidth: 240, background: "#001529", color: "#fff",
    display: "flex", flexDirection: "column", flexShrink: 0,
  } as React.CSSProperties,
  logo: {
    height: 64, display: "flex", alignItems: "center", padding: "0 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)", gap: 10,
  } as React.CSSProperties,
  logoIcon: {
    width: 32, height: 32, background: "#1890ff", borderRadius: 4,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: "bold", flexShrink: 0, color: "#fff",
  } as React.CSSProperties,
  logoText: { fontSize: 18, fontWeight: 600, whiteSpace: "nowrap" } as React.CSSProperties,
  nav: { flex: 1, overflowY: "auto", padding: "8px 0" } as React.CSSProperties,
  navLinkBase: {
    display: "flex", alignItems: "center", height: 42, margin: "1px 8px",
    padding: "0 16px", borderRadius: 4, textDecoration: "none",
    fontSize: 14, transition: "all 0.2s", whiteSpace: "nowrap",
  } as React.CSSProperties,
  mainArea: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 } as React.CSSProperties,
  topbar: {
    height: 48, background: "#fff", display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "0 24px", flexShrink: 0,
    borderBottom: "1px solid #e8e8e8", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  } as React.CSSProperties,
  topbarTitle: { fontSize: 14, color: "#666" } as React.CSSProperties,
  topbarRight: { display: "flex", alignItems: "center", gap: 16 } as React.CSSProperties,
  avatar: {
    width: 30, height: 30, background: "#1890ff", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontSize: 14, fontWeight: 500,
  } as React.CSSProperties,
  content: { flex: 1, overflowY: "auto", background: "#f0f2f5" } as React.CSSProperties,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/login"); return; }
    api.get("/auth/permissions").catch(() => {});
  }, []);

  // Mobile redirect: if on small screen and on desktop page, redirect to mobile equivalent
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 640) return;
    // Map of desktop → mobile paths
    var mobileMap: Record<string, string> = {
      "/bi": "/mobile",
      "/dashboard": "/mobile",
      "/orders": "/mobile/orders",
      "/customers": "/mobile/customers",
      "/products": "/mobile/products",
      "/suppliers": "/mobile/suppliers",
      "/samples": "/mobile/samples",
      "/recall": "/mobile/recall",
      "/visits": "/mobile/visits",
      "/inventory": "/mobile/inventory",
      "/finance": "/mobile/finance",
      "/purchase": "/mobile/purchase",
      "/consignment": "/mobile",
      "/accounting": "/mobile/accounting",
      "/system": "/mobile",
      "/notifications": "/notifications",
    };
    // Check exact match first, then prefix match for detail pages
    if (mobileMap[pathname]) {
      router.replace(mobileMap[pathname]);
      return;
    }
    // For detail pages like /orders/xxx, redirect to /mobile/orders/xxx
    for (var key of Object.keys(mobileMap)) {
      if (pathname.startsWith(key + "/")) {
        var mobilePath = mobileMap[key] + pathname.substring(key.length);
        router.replace(mobilePath);
        return;
      }
    }
  }, []);

  const isActive = (p: string) => {
    if (p === "/bi") return pathname === "/bi" || pathname === "/dashboard";
    return pathname?.startsWith(p);
  };
  const allItems = menuGroups.flatMap(g => g.items); const pageTitle = allItems.find(m => isActive(m.path))?.label || "儀表板";

  return (
    <div style={styles.layout}>
      {/* 左側導航欄 */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>EG</div>
          <span style={styles.logoText}>治理作業系統</span>
        </div>
        <nav style={styles.nav}>
          {menuGroups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: gi < menuGroups.length - 1 ? 8 : 0 }}>
              <div style={{ padding: "8px 24px 4px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>{group.title}</div>
              {group.items.map(item => {
                const active = isActive(item.path);
                return (
                  <Link key={item.path + item.label} href={item.path} style={{
                    ...styles.navLinkBase,
                    color: active ? "#fff" : "rgba(255,255,255,0.65)",
                    background: active ? "#1890ff" : "transparent",
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 15, width: 20, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* 右側主區域 */}
      <div style={styles.mainArea}>
        <div style={styles.topbar}>
          <span style={styles.topbarTitle}>{pageTitle}</span>
          <div style={styles.topbarRight}>
            <Link href="/notifications" style={{ position: "relative", textDecoration: "none", display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 18 }}>🔔</span>
              <NotificationBadge />
            </Link>
            <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", cursor: "pointer" }}>
              <div style={styles.avatar}>{user?.full_name?.charAt(0) || "U"}</div>
              <span style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{user?.full_name || "管理員"}</span>
            </Link>
            <span
              onClick={() => { logout(); router.push("/login"); }}
              style={{ fontSize: 13, color: "#999", cursor: "pointer" }}
            >登出</span>
          </div>
        </div>
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}