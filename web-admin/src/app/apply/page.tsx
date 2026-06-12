"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

export default function ApplyPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({
    applicant_name: "",
    applicant_email: "",
    applicant_phone: "",
    company_name: "",
    department: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => { axios.get("/api/v1/companies").then(r => setCompanies(r.data?.data || r.data || [])).catch(() => {});
    axios.get("/api/v1/departments").then(r => setDepartments(r.data?.data || r.data || [])).catch(() => {}); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.applicant_name.trim()) { setResult({ success: false, message: "請填寫申請人姓名" }); return; }
    if (!form.applicant_email.trim()) { setResult({ success: false, message: "請填寫英文名（登錄帳號）" }); return; }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await axios.post("/api/v1/auth/apply-account", form);
      setResult({ success: true, message: res.data.message || "申請已提交，審批通過後將以英文名作為登錄帳號" });
    } catch (err: any) {
      setResult({ success: false, message: err?.response?.data?.message || "提交失敗，請稍後再試" });
    } finally { setSubmitting(false); }
  };

  const si: React.CSSProperties = { width: "100%", height: 40, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" };
  const sl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "#555", marginBottom: 4 };

  if (result?.success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0f2f5 0%, #e6f0fa 100%)" }}>
        <div style={{ background: "#fff", borderRadius: 8, padding: "48px 40px", width: 420, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#333", marginBottom: 8 }}>申請已提交</h2>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>{result.message}</p>
          <Link href="/login" style={{ fontSize: 14, color: "#1890ff", textDecoration: "none" }}>
            ← 返回登錄
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0f2f5 0%, #e6f0fa 100%)" }}>
      <div style={{ background: "#fff", borderRadius: 8, padding: "40px", width: 480, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#333", margin: "0 0 4px" }}>申請開通帳號</h2>
          <p style={{ fontSize: 13, color: "#999", margin: 0 }}>填寫以下資料，管理員審批後將為您開通帳號</p>
        </div>

        {result && !result.success && (
          <div style={{ fontSize: 13, color: "#ff4d4f", background: "#fff2f0", padding: "10px 14px", borderRadius: 4, border: "1px solid #ffccc7", marginBottom: 16 }}>
            {result.message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={sl}>申請人姓名 <span style={{ color: "#ff4d4f" }}>*</span></div>
            <input style={si} value={form.applicant_name} onChange={e => setForm({ ...form, applicant_name: e.target.value })} placeholder="請輸入姓名" />
          </div>
          <div>
            <div style={sl}>英文名（登錄帳號） <span style={{ color: "#ff4d4f" }}>*</span></div>
            <input style={si} type="email" value={form.applicant_email} onChange={e => setForm({ ...form, applicant_email: e.target.value })} placeholder="請輸入英文名，審批通過後將作為登錄帳號" />
          </div>
          <div>
            <div style={sl}>聯絡電話</div>
            <input style={si} value={form.applicant_phone} onChange={e => setForm({ ...form, applicant_phone: e.target.value })} placeholder="請輸入手機或電話" />
          </div>
          <div>
            <div style={sl}>所屬公司</div>
            <select style={si} value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })}>
              <option value="">請選擇公司</option>
              {companies.map((c: any) => <option key={c.company_id} value={c.company_name}>{c.company_name}</option>)}
            </select>
          </div>
          <div>
            <div style={sl}>部門</div>
            <select style={si} value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
              <option value="">請選擇部門</option>
              {departments.map((d: any) => <option key={d.department_id} value={d.department_name}>{d.department_name}</option>)}
            </select>
          </div>
          <div>
            <div style={sl}>申請原因 / 備註</div>
            <textarea style={{ ...si, height: 80, padding: "8px 12px", resize: "vertical" }} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="請簡述申請原因（選填）" />
          </div>
          <button type="submit" disabled={submitting}
            style={{ height: 42, borderRadius: 4, border: "none", background: submitting ? "#91caff" : "#1890ff", color: "#fff", fontSize: 15, fontWeight: 500, cursor: submitting ? "not-allowed" : "pointer", width: "100%", marginTop: 4 }}>
            {submitting ? "提交中..." : "提交申請"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link href="/login" style={{ fontSize: 13, color: "#999", textDecoration: "none" }}>
            ← 返回登錄
          </Link>
        </div>
      </div>
    </div>
  );
}
