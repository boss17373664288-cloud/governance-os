"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/api";

export default function LoginPage() {
  const [no, setNo] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    var check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  var handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!no.trim()) { setError("請輸入員工編號"); return; }
    if (!pw) { setError("請輸入密碼"); return; }
    setLoading(true);
    try {
      await login(no.trim(), pw);
      router.push(isMobile ? "/mobile" : "/bi");
    } catch (err: any) {
      var msg = err?.response?.data?.message;
      var code = err?.response?.data?.error_code;
      if (code === "AUTH_002") setError("員工編號或密碼錯誤");
      else if (code === "AUTH_004") setError("帳號已被鎖定，請聯繫管理員");
      else if (code === "AUTH_006") setError("設備綁定數量超限，請聯繫管理員");
      else if (err?.response?.status === 401) setError("員工編號或密碼錯誤");
      else if (err?.response?.status === 403) setError("帳號已被鎖定");
      else if (!err?.response) setError("無法連接伺服器，請檢查網絡");
      else setError(msg || "登錄失敗，請稍後再試");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0f2f5 0%, #e6f0fa 100%)", padding: isMobile ? 16 : 0 }}>
      {isMobile ? (
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: "bold", color: "#fff", background: "#1890ff", marginBottom: 12 }}>EG</div>
            <h1 style={{ fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 4 }}>企業治理作業系統</h1>
            <p style={{ fontSize: 12, color: "#999" }}>Enterprise Governance OS</p>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#333", marginBottom: 20, textAlign: "center" }}>用戶登錄</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>員工編號</div>
                <input type="text" value={no} onChange={e => { setNo(e.target.value); setError(""); }}
                  style={{ height: 48, padding: "0 14px", borderRadius: 12, border: error ? "1px solid #ff4d4f" : "1px solid #d9d9d9", fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" }}
                  placeholder="請輸入員工編號" autoComplete="username" />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>密碼</div>
                <input type="password" value={pw} onChange={e => { setPw(e.target.value); setError(""); }}
                  style={{ height: 48, padding: "0 14px", borderRadius: 12, border: error ? "1px solid #ff4d4f" : "1px solid #d9d9d9", fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" }}
                  placeholder="請輸入密碼" autoComplete="current-password" />
              </div>
              {error && (
                <div style={{ fontSize: 13, color: "#ff4d4f", background: "#fff2f0", padding: "10px 14px", borderRadius: 10, border: "1px solid #ffccc7" }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading}
                style={{ height: 48, borderRadius: 12, border: "none", background: loading ? "#91caff" : "#1890ff", color: "#fff", fontSize: 16, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", width: "100%", marginTop: 4 }}>
                {loading ? "登錄中..." : "登 錄"}
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: 18 }}>
              <Link href="/apply" style={{ fontSize: 13, color: "#1890ff", textDecoration: "none" }}>
                申請開通帳號
              </Link>
            </div>
          </div>
          <p style={{ textAlign: "center", fontSize: 11, color: "#bbb" }}>預設帳號 ADMIN001 / admin123</p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", display: "flex", width: 800, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ width: 360, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 40px", background: "linear-gradient(160deg, #001529 0%, #002140 100%)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: "bold", color: "#fff", background: "#1890ff", marginBottom: 24 }}>EG</div>
            <h1 style={{ fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 4 }}>企業治理作業系統</h1>
            <p style={{ fontSize: 13, color: "#999", marginBottom: 24 }}>Enterprise Governance OS</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["全模組業務覆蓋", "即時 BI 數據駕駛艙", "醫藥合規安全管理"].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#bbb" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1890ff", flexShrink: 0 }} />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 40px" }}>
            <div style={{ width: "100%", maxWidth: 300 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#333", marginBottom: 24 }}>用戶登錄</h2>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <input type="text" value={no} onChange={e => { setNo(e.target.value); setError(""); }}
                    style={{ height: 40, padding: "0 12px", borderRadius: 4, border: error ? "1px solid #ff4d4f" : "1px solid #d9d9d9", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }}
                    placeholder="員工編號" autoComplete="username" />
                </div>
                <div>
                  <input type="password" value={pw} onChange={e => { setPw(e.target.value); setError(""); }}
                    style={{ height: 40, padding: "0 12px", borderRadius: 4, border: error ? "1px solid #ff4d4f" : "1px solid #d9d9d9", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }}
                    placeholder="密碼" autoComplete="current-password" />
                </div>
                {error && (
                  <div style={{ fontSize: 12, color: "#ff4d4f", background: "#fff2f0", padding: "8px 12px", borderRadius: 4, border: "1px solid #ffccc7" }}>
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  style={{ height: 40, borderRadius: 4, border: "none", background: loading ? "#91caff" : "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", width: "100%" }}>
                  {loading ? "登錄中..." : "登 錄"}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <Link href="/apply" style={{ fontSize: 13, color: "#1890ff", textDecoration: "none" }}>
                  申請開通帳號
                </Link>
              </div>
              <p style={{ textAlign: "center", fontSize: 12, color: "#999", marginTop: 12 }}>預設帳號 ADMIN001 / admin123</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
