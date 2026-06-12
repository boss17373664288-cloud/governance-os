"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/api";

export default function MobileLoginPage() {
  const [no, setNo] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!no.trim() || !pw.trim()) { setError("請輸入帳號和密碼"); return; }
    setLoading(true); setError("");
    try {
      await login(no, pw);
      router.push("/mobile");
    } catch (e: any) {
      setError(e?.response?.data?.message || "登入失敗，請檢查帳號密碼");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "linear-gradient(135deg, #001529 0%, #003a70 100%)" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 28 }}>🏥</div>
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>企業治理作業系統</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 4 }}>移動端管理平台</p>
      </div>
      <div style={{ width: "100%", maxWidth: 360, background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
        {error && <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fff1f0", color: "#ff4d4f", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{error}</div>}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>員工編號</div>
          <input style={{ width: "100%", height: 48, padding: "0 14px", borderRadius: 12, border: "1px solid #d9d9d9", fontSize: 16, outline: "none", boxSizing: "border-box" }} value={no} onChange={e => setNo(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()} placeholder="請輸入員工編號" autoFocus />
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>密碼</div>
          <input type="password" style={{ width: "100%", height: 48, padding: "0 14px", borderRadius: 12, border: "1px solid #d9d9d9", fontSize: 16, outline: "none", boxSizing: "border-box" }} value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()} placeholder="請輸入密碼" />
        </div>
        <button onClick={handleLogin} disabled={loading} style={{ width: "100%", height: 48, borderRadius: 12, border: "none", background: loading ? "#91caff" : "#1890ff", color: "#fff", fontSize: 16, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "登入中..." : "登入"}
        </button>
      </div>
    </div>
  );
}