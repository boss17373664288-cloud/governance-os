"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const bp: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const cardBox: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 20, marginBottom: 16 };
const ts = (bg: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color });

export default function SosPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");

  const fetchEvents = () => {
    setLoading(true);
    api.get("/sos/events").then((r: any) => setEvents(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); const interval = setInterval(fetchEvents, 10000); return () => clearInterval(interval); }, []);

  const doResolve = async (sosId: string) => {
    if (!resolveNote) { alert("請填寫處理備註"); return; }
    setResolving(sosId);
    try {
      await api.put("/sos/events/" + sosId + "/resolve", { resolution_note: resolveNote });
      alert("SOS事件已解除");
      setResolveNote("");
      fetchEvents();
    } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
    finally { setResolving(null); }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a2e" }}>🆘 SOS安全管理</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#999" }}>靜默指紋警報、緊急事件監控與處理</p>
          </div>
        </div>

        {/* Active SOS Alert */}
        {events.length > 0 && (
          <div style={{ ...cardBox, background: "#fff1f0", border: "1px solid #ffa39e", marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ff4d4f", marginBottom: 8 }}>⚠ 有 {events.length} 個活躍的 SOS 警報！</div>
            <p style={{ fontSize: 13, color: "#ff4d4f", margin: 0 }}>請立即檢查並採取行動。系統已自動凍結相關帳號權限。</p>
          </div>
        )}

        {loading ? <div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div> : events.length === 0 ? (
          <div style={{ ...cardBox, textAlign: "center", padding: 60, color: "#52c41a" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>目前無活躍的 SOS 警報</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>系統每 10 秒自動刷新</div>
          </div>
        ) : (
          <div>
            {events.map((e: any) => (
              <div key={e.sos_id} style={{ ...cardBox, border: "1px solid #ffa39e" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#ff4d4f" }}>SOS #{e.sos_id}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, marginTop: 12 }}>
                      <div><div style={{ fontSize: 11, color: "#888" }}>觸發人員</div><div style={{ fontSize: 13, fontWeight: 500 }}>{e.employee_id?.slice(0, 8) || "-"}</div></div>
                      <div><div style={{ fontSize: 11, color: "#888" }}>觸發方式</div><div style={{ fontSize: 13, fontWeight: 500 }}>{e.trigger_method || "-"}</div></div>
                      <div><div style={{ fontSize: 11, color: "#888" }}>GPS位置</div><div style={{ fontSize: 13, fontWeight: 500 }}>{e.gps_latitude?.toFixed(4)}, {e.gps_longitude?.toFixed(4)}</div></div>
                      <div><div style={{ fontSize: 11, color: "#888" }}>設備資訊</div><div style={{ fontSize: 13, fontWeight: 500 }}>{e.device_info || "-"}</div></div>
                      <div><div style={{ fontSize: 11, color: "#888" }}>觸發時間</div><div style={{ fontSize: 13, fontWeight: 500 }}>{e.triggered_at ? new Date(e.triggered_at).toLocaleString("zh-TW") : "-"}</div></div>
                      <div><div style={{ fontSize: 11, color: "#888" }}>狀態</div><span style={ts("#fff1f0", "#ff4d4f")}>{e.status}</span></div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f0f0f0", display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <input style={{ flex: 1, height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none" }}
                    placeholder="處理備註..." value={resolving === e.sos_id ? resolveNote : ""}
                    onChange={ve => { if (resolving === e.sos_id) setResolveNote(ve.target.value); }}
                    onFocus={() => setResolving(e.sos_id)} />
                  <button onClick={() => doResolve(e.sos_id)} disabled={resolving === e.sos_id && !resolveNote}
                    style={{ ...bp, background: "#52c41a", opacity: resolving === e.sos_id && !resolveNote ? 0.6 : 1 }}>
                    {resolving === e.sos_id ? "處理中..." : "標記已處理"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}