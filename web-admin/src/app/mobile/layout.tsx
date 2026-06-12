"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Home, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "首頁", path: "/mobile", icon: "🏠" },
  { label: "客戶管理", path: "/mobile/customers", icon: "👥" },
  { label: "產品管理", path: "/mobile/products", icon: "📦" },
  { label: "銷售訂單", path: "/mobile/orders", icon: "📝" },
  { label: "庫存管理", path: "/mobile/inventory", icon: "🏭" },
  { label: "供應商", path: "/mobile/suppliers", icon: "🏢" },
  { label: "業務拜訪", path: "/mobile/visits", icon: "🚶" },
  { label: "召回管理", path: "/mobile/recall", icon: "⚠️" },
  { label: "樣品/打板", path: "/mobile/samples", icon: "🧪" },
  { label: "財務管理", path: "/mobile/finance", icon: "💳" },
  { label: "採購管理", path: "/mobile/purchase", icon: "🛒" },
];

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/mobile";

  return (
    <>
      <style>{`
        .mobile-shell { max-width: 480px; margin: 0 auto; min-height: 100vh; background: #f5f7fa; position: relative; }
        .mobile-card { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .mobile-btn { min-height: 44px; min-width: 44px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @media (min-width: 768px) { .mobile-shell { border-left: 1px solid #e8e8e8; border-right: 1px solid #e8e8e8; } }
      `}</style>

      <div className="mobile-shell">
        {/* Mobile Header */}
        <header style={{
          background: "#001529", color: "#fff", padding: "0 12px",
          display: "flex", alignItems: "center", height: 48,
          position: "sticky", top: 0, zIndex: 100, gap: 8
        }}>
          {isHome ? (
            <button className="mobile-btn" onClick={() => setMenuOpen(true)}
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}>
              <Menu size={22} />
            </button>
          ) : (
            <button className="mobile-btn" onClick={() => router.back()}
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}>
              <ChevronLeft size={22} />
            </button>
          )}
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: 1, flex: 1 }}>EG 治理</span>
          <button className="mobile-btn" onClick={() => router.push("/mobile")}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}>
            <Home size={20} />
          </button>
        </header>

        {/* Page Content */}
        <div style={{ padding: "12px 16px" }}>
          {children}
        </div>

        {/* Side Menu */}
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200
            }} />
            <aside style={{
              position: "fixed", top: 0, left: 0, bottom: 0, width: 270,
              background: "#001529", zIndex: 300, padding: "16px 0",
              animation: "slideIn 0.2s ease", overflow: "auto"
            }}>
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 12px 12px" }}>
                <button onClick={() => setMenuOpen(false)}
                  style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ padding: "0 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 8 }}>
                <div style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>EG 企業治理</div>
                <div style={{ color: "#999", fontSize: 11, marginTop: 2 }}>醫藥業 CRM 作業系統</div>
              </div>
              {NAV_LINKS.map((item) => (
                <div key={item.path} onClick={() => { setMenuOpen(false); router.push(item.path); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 20px", cursor: "pointer",
                    color: pathname === item.path ? "#fff" : "#bbb",
                    fontSize: 15,
                    background: pathname === item.path ? "rgba(24,144,255,0.2)" : "transparent",
                    borderLeft: pathname === item.path ? "3px solid #1890ff" : "3px solid transparent",
                  }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </aside>
          </>
        )}
      </div>
    </>
  );
}
