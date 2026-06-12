"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { api } from "../../../lib/api";

const LEVEL_MAP: Record<string, { label: string; color: string }> = {
  R1: { label: "觀察 R1", color: "#52c41a" },
  R2: { label: "內部限制 R2", color: "#fa8c16" },
  R3: { label: "正式召回 R3", color: "#ff4d4f" },
  R4: { label: "緊急召回 R4", color: "#cf1322" },
};

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: "草稿", bg: "#f5f5f5", color: "#999" },
  PENDING_APPROVAL: { label: "待審批", bg: "#e6f7ff", color: "#1890ff" },
  REJECTED: { label: "已退回", bg: "#fff1f0", color: "#ff4d4f" },
  APPROVED: { label: "已批准", bg: "#fff7e6", color: "#fa8c16" },
  IN_PROGRESS: { label: "執行中", bg: "#f6ffed", color: "#52c41a" },
  RESOLVED: { label: "已解決", bg: "#f0f5ff", color: "#2f54eb" },
  CLOSED: { label: "已關閉", bg: "#fafafa", color: "#8c8c8c" },
};

const LEVEL_WORKFLOW: Record<string, string[]> = {
  R1: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "RESOLVED", "CLOSED"],
  R2: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "IN_PROGRESS", "RESOLVED", "CLOSED"],
  R3: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "IN_PROGRESS", "RESOLVED", "CLOSED"],
  R4: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "IN_PROGRESS", "RESOLVED", "CLOSED"],
};

const cardBox: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const cardPad: React.CSSProperties = { ...cardBox, padding: 20, marginBottom: 16 };
const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const tagStyle = (bg: string, color: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500,
  padding: "2px 8px", borderRadius: 2, background: bg, color, whiteSpace: "nowrap",
});
const btnPrimary: React.CSSProperties = { height: 32, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const btnDefault: React.CSSProperties = { height: 32, padding: "0 16px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" };
const btnDanger: React.CSSProperties = { height: 32, padding: "0 16px", borderRadius: 4, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 13, fontWeight: 500, cursor: "pointer" };

export default function RecallDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [recall, setRecall] = useState<any>(null);
  const [trace, setTrace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [replaceTargetBatch, setReplaceTargetBatch] = useState("");
  const [showReplaceForm, setShowReplaceForm] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [showReopenForm, setShowReopenForm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
  }, []);

  const fetchData = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.get("/recall/" + id).catch(() => null)])
      .then(([recallRes]) => {
        const r = (recallRes as any)?.data;
        setRecall(r || null);
        if (r?.product_id) {
          api.get("/products/" + r.product_id)
            .then((pRes: any) => {
              const pd = pRes?.data;
              setRecall((prev: any) => prev ? { ...prev, product_name: pd?.product_name, product_code: prev.product_code || pd?.product_code } : prev);
            })
            .catch(() => {});
        }
        if (r?.batch_no) {
          api.get("/recall/trace/" + r.batch_no)
            .then((tRes: any) => setTrace(tRes?.data || null))
            .catch(() => setTrace(null));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!confirm("確定要提交此召回案件進行審批？")) return;
    setActionLoading(true);
    try { await api.put("/recall/" + id + "/submit"); alert("提交成功"); fetchData(); }
    catch (e: any) { alert(e?.response?.data?.message || "提交失敗"); }
    finally { setActionLoading(false); }
  };

  const handleApprove = async () => {
    if (!confirm("確定批准此召回案件？")) return;
    setActionLoading(true);
    try { await api.put("/recall/" + id + "/approve"); alert("審批成功"); fetchData(); }
    catch (e: any) { alert(e?.response?.data?.message || "審批失敗"); }
    finally { setActionLoading(false); }
  };

  const handleStart = async () => {
    if (!confirm("確定啟動召回執行？庫存將被凍結。")) return;
    setActionLoading(true);
    try { await api.put("/recall/" + id + "/start"); alert("召回已啟動"); fetchData(); }
    catch (e: any) { alert(e?.response?.data?.message || "啟動失敗"); }
    finally { setActionLoading(false); }
  };

  const handleResolve = async () => {
    if (!confirm("確定標記此召回案件為已解決？")) return;
    setActionLoading(true);
    try { await api.put("/recall/" + id + "/resolve"); alert("案件已標記為已解決"); fetchData(); }
    catch (e: any) { alert(e?.response?.data?.message || "解決失敗"); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!confirm("確定退回此召回案件？")) return;
    setActionLoading(true);
    try { await api.put("/recall/" + id + "/reject"); alert("案件已退回"); fetchData(); }
    catch (e: any) { alert(e?.response?.data?.message || "退回失敗"); }
    finally { setActionLoading(false); }
  };

  const handleClose = async () => {
    if (!confirm("確定關閉此召回案件？")) return;
    setActionLoading(true);
    try { await api.put("/recall/" + id + "/close"); alert("案件已關閉"); fetchData(); }
    catch (e: any) { alert(e?.response?.data?.message || "關閉失敗"); }
    finally { setActionLoading(false); }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) { alert("請輸入重新開啟原因"); return; }
    setActionLoading(true);
    try { await api.put("/recall/" + id + "/reopen", { reason: reopenReason }); alert("案件已重新開啟"); setShowReopenForm(false); setReopenReason(""); fetchData(); }
    catch (e: any) { alert(e?.response?.data?.message || "重新開啟失敗"); }
    finally { setActionLoading(false); }
  };

  const handleReplaceBatch = async () => {
    if (!replaceTargetBatch.trim()) { alert("請輸入目標替換批號"); return; }
    if (!confirm("確定要將訂單中的 " + recall?.batch_no + " 批次替換為 " + replaceTargetBatch.trim() + "？（僅影響未出貨部分）")) return;
    setActionLoading(true);
    try {
      const res: any = await api.put("/recall/" + id + "/replace-batch", { target_batch_no: replaceTargetBatch.trim() });
      alert("批次替換完成，共替換 " + (res?.data?.replaced_items || 0) + " 筆");
      setShowReplaceForm(false); setReplaceTargetBatch(""); fetchData();
    }
    catch (e: any) { alert(e?.response?.data?.message || "替換失敗"); }
    finally { setActionLoading(false); }
  };

  if (loading) {
    return <DashboardLayout><div style={{ textAlign: "center", padding: 60, color: "#999", fontSize: 14 }}>載入中...</div></DashboardLayout>;
  }

  if (!recall) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: "center", padding: 60, color: "#999" }}>
          <p>召回案件不存在</p>
          <button onClick={() => router.push("/recall")} style={{ ...btnPrimary, marginTop: 12 }}>返回列表</button>
        </div>
      </DashboardLayout>
    );
  }

  const lv = LEVEL_MAP[recall.recall_level] || { label: recall.recall_level, color: "#999" };
  const st = STATUS_MAP[recall.status] || { label: recall.status, bg: "#f5f5f5", color: "#999" };
  const canSubmit = recall.status === "DRAFT";
  const canApprove = recall.status === "PENDING_APPROVAL";
  const canReject = recall.status === "PENDING_APPROVAL";
  const canStart = recall.status === "APPROVED";
  const canResolve = recall.status === "IN_PROGRESS";
  const canReplace = recall.status === "APPROVED" || recall.status === "IN_PROGRESS";
  const canClose = recall.status === "APPROVED" || recall.status === "IN_PROGRESS" || recall.status === "RESOLVED";
  const canReopen = recall.status === "CLOSED";
  const workflow = LEVEL_WORKFLOW[recall.recall_level] || LEVEL_WORKFLOW["R1"];
  const currentStep = workflow.indexOf(recall.status);

  return (
    <DashboardLayout>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push("/recall")} style={{ ...btnDefault, width: 36, padding: 0, fontSize: 18 }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#333", margin: 0, flex: 1 }}>{recall.recall_no}</h1>
        {canSubmit && <button onClick={handleSubmit} disabled={actionLoading} style={btnPrimary}>提交審批</button>}
        {canApprove && <button onClick={handleApprove} disabled={actionLoading} style={btnPrimary}>批准案件</button>}
        {canReject && <button onClick={handleReject} disabled={actionLoading} style={btnDanger}>退回案件</button>}
        {canStart && <button onClick={handleStart} disabled={actionLoading} style={btnPrimary}>啟動召回</button>}
        {canResolve && <button onClick={handleResolve} disabled={actionLoading} style={btnPrimary}>標記已解決</button>}
        {canClose && <button onClick={handleClose} disabled={actionLoading} style={btnDanger}>關閉案件</button>}
        {canReopen && <button onClick={() => setShowReopenForm(true)} disabled={actionLoading} style={btnPrimary}>重新開啟</button>}
      </div>

      {/* Stepper */}
      <div style={cardPad}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 12 }}>案件進度</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {workflow.map((step, i) => {
            const stepSt = STATUS_MAP[step];
            const isPassed = i <= currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={step} style={{ display: "flex", alignItems: "center", flex: i < workflow.length - 1 ? 1 : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: isPassed ? stepSt.color : "#f0f0f0",
                    color: isPassed ? "#fff" : "#bbb",
                    fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center",
                    border: isCurrent ? "2px solid " + stepSt.color : "none",
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 10, color: isPassed ? stepSt.color : "#ccc", whiteSpace: "nowrap", fontWeight: isCurrent ? 600 : 400 }}>
                    {stepSt.label}
                  </span>
                </div>
                {i < workflow.length - 1 && (
                  <div style={{ flex: 1, height: 2, margin: "0 4px", marginBottom: 18, background: i < currentStep ? stepSt.color : "#f0f0f0" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Info Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Case Info Card */}
        <div style={cardPad}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f0f0f0" }}>案件資訊</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><div style={fieldLabel}>召回編號</div><div style={{ fontSize: 14, fontWeight: 500, fontFamily: "monospace" }}>{recall.recall_no}</div></div>
            <div><div style={fieldLabel}>召回等級</div><span style={tagStyle("#fff", lv.color)}>{lv.label}</span></div>
            <div><div style={fieldLabel}>狀態</div><span style={tagStyle(st.bg, st.color)}>{st.label}</span></div>
            <div><div style={fieldLabel}>產品編碼</div><div style={{ fontSize: 13, color: "#333" }}>{recall?.product_code || trace?.batch?.product_code || recall.product_id}</div></div>
            <div><div style={fieldLabel}>產品名稱</div><div style={{ fontSize: 13, color: "#333" }}>{recall?.product_name || trace?.batch?.product_name || "-"}</div></div>
            <div><div style={fieldLabel}>問題批號</div><div style={{ fontSize: 13, fontFamily: "monospace", color: "#ff4d4f", fontWeight: 500 }}>{recall.batch_no}</div></div>
            <div><div style={fieldLabel}>發現日期</div><div style={{ fontSize: 13, color: "#333" }}>{recall.discovery_date ? new Date(recall.discovery_date).toLocaleDateString("zh-TW") : "-"}</div></div>
            <div><div style={fieldLabel}>建立時間</div><div style={{ fontSize: 13, color: "#666" }}>{recall.created_at ? new Date(recall.created_at).toLocaleString("zh-TW") : "-"}</div></div>
            {recall.closed_at && <div><div style={fieldLabel}>關閉時間</div><div style={{ fontSize: 13, color: "#666" }}>{new Date(recall.closed_at).toLocaleString("zh-TW")}</div></div>}
          </div>
          {recall.description && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
              <div style={fieldLabel}>召回說明</div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{recall.description}</div>
            </div>
          )}
        </div>

        {/* Batch Trace Card */}
        <div style={cardPad}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f0f0f0" }}>批號追溯</h3>
          {trace ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={fieldLabel}>批號</div><div style={{ fontSize: 13, fontFamily: "monospace" }}>{trace.batch?.batch_no}</div></div>
              <div><div style={fieldLabel}>當前庫存</div><div style={{ fontSize: 14, fontWeight: 600, color: "#1890ff" }}>{trace.batch?.current_quantity || 0}</div></div>
              <div><div style={fieldLabel}>QA狀態</div><div style={{ fontSize: 13 }}>{trace.batch?.qa_status || "-"}</div></div>
              <div>
                <div style={fieldLabel}>召回狀態</div>
                <div style={{ fontSize: 13, color: trace.batch?.recall_status === "FROZEN" ? "#ff4d4f" : "#52c41a", fontWeight: 500 }}>
                  {trace.batch?.recall_status === "FROZEN" ? "已凍結" : trace.batch?.recall_status || "正常"}
                </div>
              </div>
              <div><div style={fieldLabel}>到期日</div><div style={{ fontSize: 13 }}>{trace.batch?.expiry_date ? new Date(trace.batch.expiry_date).toLocaleDateString("zh-TW") : "-"}</div></div>
              <div><div style={fieldLabel}>製造商</div><div style={{ fontSize: 13 }}>{trace.batch?.manufacturer || "-"}</div></div>
              <div><div style={fieldLabel}>涉及訂單數</div><div style={{ fontSize: 14, fontWeight: 600, color: "#fa8c16" }}>{trace.order_count || 0}</div></div>
            </div>
          ) : <div style={{ color: "#999", fontSize: 13, textAlign: "center", padding: 24 }}>暫無追溯資料</div>}
        </div>
      </div>

      {/* Batch Replace Action */}
      {canReplace && !showReplaceForm && (
        <div style={cardPad}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#666" }}>需要替換受影響訂單中的批次？</span>
            <button onClick={() => setShowReplaceForm(true)} style={btnPrimary}>替換批次</button>
          </div>
        </div>
      )}
      {showReplaceForm && (
        <div style={cardPad}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 12 }}>批次替換</h3>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>僅替換未出貨部分，已出貨部分記錄影響。最多遞迴3層。</p>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <div style={fieldLabel}>目標替換批號</div>
              <input style={{ width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                placeholder="輸入替換批號" value={replaceTargetBatch} onChange={e => setReplaceTargetBatch(e.target.value)} />
            </div>
            <button onClick={handleReplaceBatch} disabled={actionLoading} style={btnPrimary}>確認替換</button>
            <button onClick={() => { setShowReplaceForm(false); setReplaceTargetBatch(""); }} style={btnDefault}>取消</button>
          </div>
        </div>
      )}

      {/* Reopen Form */}
      {showReopenForm && (
        <div style={cardPad}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 12 }}>重新開啟案件</h3>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>需品保總監權限</p>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <div style={fieldLabel}>重新開啟原因</div>
              <input style={{ width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                placeholder="請輸入重新開啟原因" value={reopenReason} onChange={e => setReopenReason(e.target.value)} />
            </div>
            <button onClick={handleReopen} disabled={actionLoading} style={btnPrimary}>確認重新開啟</button>
            <button onClick={() => { setShowReopenForm(false); setReopenReason(""); }} style={btnDefault}>取消</button>
          </div>
        </div>
      )}

      {/* History Recall Cases */}
      {trace?.recall_cases?.length > 1 && (
        <div style={cardPad}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f0f0f0" }}>該批號歷史召回案件</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, color: "#888", borderBottom: "1px solid #f0f0f0" }}>召回編號</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, color: "#888", borderBottom: "1px solid #f0f0f0" }}>等級</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, color: "#888", borderBottom: "1px solid #f0f0f0" }}>狀態</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, color: "#888", borderBottom: "1px solid #f0f0f0" }}>說明</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, color: "#888", borderBottom: "1px solid #f0f0f0" }}>建立時間</th>
              </tr>
            </thead>
            <tbody>
              {trace.recall_cases.map((rc: any) => {
                const rclv = LEVEL_MAP[rc.level] || { label: rc.level, color: "#999" };
                const rcst = STATUS_MAP[rc.status] || { label: rc.status, bg: "#f5f5f5", color: "#999" };
                return (
                  <tr key={rc.recall_no}>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontFamily: "monospace" }}>{rc.recall_no}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13 }}><span style={tagStyle("#fff", rclv.color)}>{rclv.label}</span></td>
                    <td style={{ padding: "8px 12px", fontSize: 13 }}><span style={tagStyle(rcst.bg, rcst.color)}>{rcst.label}</span></td>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "#666", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rc.description || "-"}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "#888" }}>{rc.created_at ? new Date(rc.created_at).toLocaleDateString("zh-TW") : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Ledger */}
      {trace?.recent_ledger?.length > 0 && (
        <div style={cardPad}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f0f0f0" }}>最近庫存異動</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, color: "#888", borderBottom: "1px solid #f0f0f0" }}>時間</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, color: "#888", borderBottom: "1px solid #f0f0f0" }}>事件類型</th>
                <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: "#888", borderBottom: "1px solid #f0f0f0" }}>數量變動</th>
                <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: "#888", borderBottom: "1px solid #f0f0f0" }}>異動後庫存</th>
              </tr>
            </thead>
            <tbody>
              {trace.recent_ledger.slice(0, 10).map((le: any, i: number) => (
                <tr key={le.ledger_id || i}>
                  <td style={{ padding: "8px 12px", fontSize: 12, color: "#888" }}>{le.created_at ? new Date(le.created_at).toLocaleString("zh-TW") : "-"}</td>
                  <td style={{ padding: "8px 12px", fontSize: 13 }}>{le.event_type}</td>
                  <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right", color: le.quantity_delta < 0 ? "#ff4d4f" : "#52c41a" }}>
                    {le.quantity_delta > 0 ? "+" : ""}{le.quantity_delta}
                  </td>
                  <td style={{ padding: "8px 12px", fontSize: 13, textAlign: "right", fontWeight: 500 }}>{le.balance_after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
