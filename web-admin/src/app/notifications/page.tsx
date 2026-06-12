"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const bp: React.CSSProperties = { height: 36, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" };
const sl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const modalBg: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalCard: React.CSSProperties = { background: "#fff", borderRadius: 8, padding: 24, width: 520, maxHeight: "80vh", overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" };
const ts = (bg: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color, whiteSpace: "nowrap" });

const typeLabels: Record<string, { label: string; bg: string; color: string }> = {
  SYSTEM: { label: "系統公告", bg: "#e6f7ff", color: "#1890ff" },
  APPROVAL: { label: "審批通知", bg: "#fff7e6", color: "#fa8c16" },
  ORDER: { label: "訂單通知", bg: "#f6ffed", color: "#52c41a" },
  RECALL: { label: "召回通知", bg: "#fff1f0", color: "#ff4d4f" },
  SOS: { label: "SOS緊急", bg: "#fff1f0", color: "#ff4d4f" },
  FINANCE: { label: "財務通知", bg: "#fff7e6", color: "#fa8c16" },
  SAMPLE: { label: "打板通知", bg: "#f9f0ff", color: "#722ed1" },
  CONSIGNMENT: { label: "寄庫通知", bg: "#e6fffb", color: "#13c2c2" },
  PURCHASE: { label: "採購通知", bg: "#f0f5ff", color: "#2f54eb" },
  BUDGET: { label: "預算通知", bg: "#f9f0ff", color: "#722ed1" },
};

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  // Send announcement modal
  const [showSend, setShowSend] = useState(false);
  const [sendTitle, setSendTitle] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendSaving, setSendSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params: any = {};
    if (filter === "unread") params.unread = "true";
    api.get("/notifications", { params })
      .then((r: any) => {
        let data = r.data?.items || [];
        if (filter === "approval") data = data.filter((n: any) => n.notification_type === "APPROVAL");
        setItems(data);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markRead = async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    fetchData();
  };

  const markAllRead = async () => {
    await api.put("/notifications/read-all");
    fetchData();
  };

  const sendAnnouncement = async () => {
    if (!sendTitle || !sendBody) { alert("請填寫標題和內容"); return; }
    setSendSaving(true);
    try {
      await api.post("/notifications", { title: sendTitle, body: sendBody, notification_type: "SYSTEM" });
      alert("公告已發送給所有使用者"); setShowSend(false); setSendTitle(""); setSendBody("");
    } catch (e: any) { alert(e?.response?.data?.message || "發送失敗"); }
    finally { setSendSaving(false); }
  };

  const filterTabs = [
    { key: "all", label: "全部通知" },
    { key: "unread", label: "未讀通知" },
    { key: "approval", label: "審批通知" },
  ];

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a2e" }}>通知中心</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#999" }}>系統通知、審批提醒與業務公告 — 訂單/採購/召回/打板審批自動推送</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowSend(true)} style={bp}>+ 發送公告</button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 0 }}>
            {filterTabs.map((t) => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                style={{
                  height: 34, padding: "0 16px", fontSize: 13, fontWeight: filter === t.key ? 600 : 400,
                  border: "none", cursor: "pointer", borderRadius: "4px 4px 0 0",
                  background: filter === t.key ? "#fff" : "transparent",
                  color: filter === t.key ? "#1890ff" : "#666",
                  borderBottom: filter === t.key ? "2px solid #1890ff" : "2px solid transparent",
                }}>{t.label}</button>
            ))}
          </div>
          <button onClick={markAllRead} style={{ height: 30, padding: "0 12px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer" }}>全部標為已讀</button>
        </div>

        {/* Notification list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>
            {filter === "approval" ? "尚無審批通知" : filter === "unread" ? "所有通知已讀" : "尚無通知"}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((n: any) => (
              <div key={n.notification_id}
                onClick={() => { if (!n.is_read) markRead(n.notification_id); }}
                style={{ ...cb, padding: "16px 20px", display: "flex", gap: 16, cursor: n.is_read ? "default" : "pointer",
                  borderLeft: "3px solid " + (n.is_read ? "transparent" : (n.notification_type === "APPROVAL" ? "#fa8c16" : "#1890ff")),
                  background: n.is_read ? "#fff" : "#fafcff", }}>
                {/* Unread dot */}
                <div style={{ paddingTop: 3 }}>
                  {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.notification_type === "APPROVAL" ? "#fa8c16" : "#1890ff" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: n.is_read ? 400 : 600, color: n.is_read ? "#555" : "#1a1a2e" }}>{n.title}</span>
                      <span style={ts(typeLabels[n.notification_type]?.bg || "#f0f0f0", typeLabels[n.notification_type]?.color || "#999")}>
                        {typeLabels[n.notification_type]?.label || n.notification_type}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "#bbb" }}>{n.created_at ? n.created_at.slice(0, 16).replace("T", " ") : ""}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{n.body}</div>
                  {n.link_url && (
                    <a href={n.link_url} style={{ fontSize: 12, color: "#1890ff", marginTop: 6, display: "inline-block", textDecoration: "none" }}
                      onClick={e => e.stopPropagation()}>
                      查看詳情 →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ====== Send Announcement Modal ====== */}
        {showSend && (
          <div style={modalBg} onClick={e => { if (e.target === e.currentTarget) setShowSend(false); }}>
            <div style={modalCard}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px" }}>發送系統公告</h3>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={sl}>公告標題 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={si} value={sendTitle} onChange={e => setSendTitle(e.target.value)} placeholder="公告標題" />
                </div>
                <div>
                  <div style={sl}>公告內容 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <textarea style={{ ...si, height: 120, padding: "10px 12px", resize: "vertical" }} value={sendBody} onChange={e => setSendBody(e.target.value)} placeholder="輸入公告內容..." />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowSend(false)} style={{ height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" }}>取消</button>
                <button onClick={sendAnnouncement} disabled={sendSaving} style={{ ...bp, opacity: sendSaving ? 0.6 : 1 }}>{sendSaving ? "發送中..." : "發送給全體"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}