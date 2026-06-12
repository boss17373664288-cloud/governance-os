"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { api } from "../../../lib/api";

const PURPOSE_MAP: Record<string, string> = {
  PRODUCT_TEST: "產品測試", CLINICAL_TRIAL: "臨床試驗",
  PROMOTION: "推廣活動", COMPETITOR_ANALYSIS: "競品分析",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "草稿", SUBMITTED: "已提交", MANAGER_APPROVED: "主管已審",
  QA_RELEASED: "QA已放行", SHIPPED: "已出貨", FEEDBACK_DONE: "已完成", REJECTED: "已退回",
};

const cardBox: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 20, marginBottom: 16 };
const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const fieldValue: React.CSSProperties = { fontSize: 14, color: "#333", fontWeight: 500 };
const btnPrimary: React.CSSProperties = { height: 32, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const btnSuccess: React.CSSProperties = { ...btnPrimary, background: "#52c41a" };
const btnWarning: React.CSSProperties = { ...btnPrimary, background: "#fa8c16" };
const btnDanger: React.CSSProperties = { ...btnPrimary, background: "#ff4d4f" };
const btnDefault: React.CSSProperties = { height: 32, padding: "0 16px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" };

export default function SampleDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [sample, setSample] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ feedback_result: "", notes: "" });

  const fetchSample = () => {
    setLoading(true);
    api.get("/sample-requests/" + id).then((res: any) => setSample(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { if (id) fetchSample(); }, [id]);

  const doAction = async (action: string, body?: any) => {
    setActing(true);
    try {
      const url = "/sample-requests/" + id + (action === "feedback" ? "/feedback" : "/" + action);
      const method = action === "feedback" ? "post" : "put";
      await (api as any)[method](url, body || {});
      alert("操作成功");
      fetchSample();
    } catch (e: any) {
      alert(e?.response?.data?.message || "操作失敗");
    } finally { setActing(false); }
  };

  if (loading) return <DashboardLayout><div style={{ textAlign: "center", padding: 48, color: "#999" }}>載入中...</div></DashboardLayout>;
  if (!sample) return <DashboardLayout><div style={{ textAlign: "center", padding: 48, color: "#999" }}>打板申請不存在</div></DashboardLayout>;

  const status = sample.status;
  const isDraft = status === "DRAFT";
  const isSubmitted = status === "SUBMITTED";
  const isManagerApproved = status === "MANAGER_APPROVED";
  const isQaReleased = status === "QA_RELEASED";
  const isShipped = status === "SHIPPED";
  const isDone = status === "FEEDBACK_DONE";

  return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push("/samples")} style={{ ...btnDefault, width: 36, padding: 0, fontSize: 18 }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#333", margin: 0, flex: 1 }}>打板申請詳情</h1>
      </div>

      {/* Action Bar */}
      <div style={{ ...cardBox, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#333", marginRight: 16 }}>{sample.sample_no}</span>
        <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 2, background: "#e6f7ff", color: "#1890ff" }}>{STATUS_LABEL[status] || status}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {isDraft && <button onClick={() => doAction("submit")} disabled={acting} style={btnPrimary}>提交審批</button>}
          {isSubmitted && <>
            <button onClick={() => doAction("approve-manager")} disabled={acting} style={btnSuccess}>主管審批通過</button>
            <button onClick={() => doAction("reject")} disabled={acting} style={btnDanger}>退回</button>
          </>}
          {isManagerApproved && <>
            <button onClick={() => doAction("qa-release")} disabled={acting} style={btnWarning}>QA放行</button>
            <button onClick={() => doAction("reject")} disabled={acting} style={btnDanger}>退回</button>
          </>}
          {isQaReleased && <>
            <button onClick={() => doAction("ship")} disabled={acting} style={btnSuccess}>確認出貨</button>
          </>}
          {isShipped && <span style={{ fontSize: 12, color: "#888" }}>等待客戶反饋...</span>}
          {isDone && <span style={{ fontSize: 12, color: "#52c41a" }}>✓ 已完成</span>}
        </div>
      </div>

      {/* Basic Info */}
      <div style={cardBox}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>基本資訊</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          <div><div style={fieldLabel}>打板編號</div><div style={fieldValue}>{sample.sample_no}</div></div>
          <div><div style={fieldLabel}>客戶名稱</div><div style={fieldValue}>{sample.customer_name || "-"}</div></div>
          <div><div style={fieldLabel}>用途</div><div style={fieldValue}>{PURPOSE_MAP[sample.purpose] || sample.purpose || "-"}</div></div>
          <div><div style={fieldLabel}>產品名稱</div><div style={fieldValue}>{sample.product_name || "-"}</div></div>
          <div><div style={fieldLabel}>數量</div><div style={fieldValue}>{sample.quantity || "-"}</div></div>
          <div><div style={fieldLabel}>建立時間</div><div style={{ ...fieldValue, fontSize: 13 }}>{sample.created_at ? new Date(sample.created_at).toLocaleString("zh-TW") : "-"}</div></div>
          {sample.submitted_at && <div><div style={fieldLabel}>提交時間</div><div style={{ ...fieldValue, fontSize: 13 }}>{new Date(sample.submitted_at).toLocaleString("zh-TW")}</div></div>}
          {sample.shipped_at && <div><div style={fieldLabel}>出庫時間</div><div style={{ ...fieldValue, fontSize: 13 }}>{new Date(sample.shipped_at).toLocaleString("zh-TW")}</div></div>}
        </div>
      </div>

      {/* Governance Flow */}
      <div style={cardBox}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>審批流程</h3>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto" }}>
          {["DRAFT", "SUBMITTED", "MANAGER_APPROVED", "QA_RELEASED", "SHIPPED", "FEEDBACK_DONE"].map((step, i) => {
            const done = ["DRAFT", "SUBMITTED", "MANAGER_APPROVED", "QA_RELEASED", "SHIPPED", "FEEDBACK_DONE"].indexOf(status) >= i && status !== "REJECTED";
            const isCurrent = status === step;
            return (
              <div key={step} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? "#52c41a" : "#f0f0f0", color: done ? "#fff" : "#bbb", fontSize: 12, fontWeight: 600,
                  border: isCurrent ? "2px solid #1890ff" : "2px solid transparent",
                }}>
                  {done ? "\u2713" : i + 1}
                </div>
                <div style={{ marginLeft: 6, fontSize: 11, color: done ? "#333" : "#bbb", fontWeight: isCurrent ? 600 : 400, whiteSpace: "nowrap" }}>
                  {STATUS_LABEL[step]}
                </div>
                {i < 5 && <div style={{ width: 40, height: 2, background: done ? "#52c41a" : "#f0f0f0", margin: "0 4px" }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback Form */}
      {isShipped && (
        <div style={cardBox}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>填寫客戶反饋</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div style={fieldLabel}>反饋結果 <span style={{ color: "#ff4d4f" }}>*</span></div>
              <select style={{ width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", background: "#fff" }}
                value={feedbackForm.feedback_result} onChange={e => setFeedbackForm({ ...feedbackForm, feedback_result: e.target.value })}>
                <option value="">請選擇</option>
                <option value="INTERESTED">有興趣</option>
                <option value="NOT_INTERESTED">無興趣</option>
                <option value="NEED_FOLLOWUP">需要追蹤</option>
                <option value="READY_TO_ORDER">準備下單</option>
              </select>
            </div>
            <div>
              <div style={fieldLabel}>備註</div>
              <textarea style={{ width: "100%", height: 80, padding: 8, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", resize: "vertical" }}
                value={feedbackForm.notes} onChange={e => setFeedbackForm({ ...feedbackForm, notes: e.target.value })} />
            </div>
            <button onClick={() => doAction("feedback", feedbackForm)} disabled={acting || !feedbackForm.feedback_result}
              style={{ ...btnPrimary, width: "fit-content" }}>
              {acting ? "提交中..." : "提交反饋"}
            </button>
          </div>
        </div>
      )}

      {/* Feedback Result */}
      {isDone && sample.feedback_result && (
        <div style={cardBox}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>客戶反饋</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            <div><div style={fieldLabel}>反饋結果</div><div style={fieldValue}>{sample.feedback_result}</div></div>
            <div><div style={fieldLabel}>反饋日期</div><div style={fieldValue}>{sample.feedback_date ? new Date(sample.feedback_date).toLocaleDateString("zh-TW") : "-"}</div></div>
            {sample.feedback_notes && <div><div style={fieldLabel}>備註</div><div style={fieldValue}>{sample.feedback_notes}</div></div>}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}