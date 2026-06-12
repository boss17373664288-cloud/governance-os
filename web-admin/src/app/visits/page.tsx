"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const ts = (bg: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color, whiteSpace: "nowrap" });
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" };
const ss: React.CSSProperties = { ...si, cursor: "pointer" };
const bp: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const bd: React.CSSProperties = { height: 36, padding: "0 20px", borderRadius: 4, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 14, cursor: "pointer" };
const cardBox: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", padding: 20, marginBottom: 16 };

const VISIT_TYPES = [
  { value: "ROUTINE", label: "例行拜訪" },
  { value: "FOLLOW_UP", label: "追蹤回訪" },
  { value: "TRAINING", label: "產品培訓" },
  { value: "COMPLAINT", label: "客訴處理" },
  { value: "NEW_DEV", label: "新客戶開發" },
  { value: "CONTRACT", label: "簽約洽談" },
];

const RESULT_OPTIONS = [
  { value: "INTERESTED", label: "客戶有興趣" },
  { value: "NOT_INTERESTED", label: "客戶無興趣" },
  { value: "NEED_FOLLOWUP", label: "客戶需追蹤" },
  { value: "READY_TO_ORDER", label: "客戶準備下單" },
  { value: "NEED_SAMPLE", label: "客戶需樣品" },
  { value: "NEED_QUOTE", label: "客戶需報價" },
  { value: "PRICE_ISSUE", label: "客戶有價格問題" },
  { value: "PAYMENT_ISSUE", label: "客戶有回款問題" },
  { value: "CONSIGN_ISSUE", label: "客戶有寄庫問題" },
  { value: "NEED_ACADEMIC", label: "客戶需學術支持" },
];

const NEXT_ACTIONS = [
  { value: "SEND_SAMPLE", label: "寄送樣品" },
  { value: "SEND_QUOTE", label: "寄送報價" },
  { value: "FOLLOW_UP_CALL", label: "電話追蹤" },
  { value: "SCHEDULE_NEXT", label: "預約下次拜訪" },
  { value: "PROMOTE_PRODUCT", label: "產品推進" },
  { value: "COLLECT_PAYMENT", label: "催收回款" },
  { value: "ACADEMIC_SUPPORT", label: "安排學術支持" },
  { value: "NO_ACTION", label: "無需後續" },
];

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  PLANNED: { label: "已預排", bg: "#e6f7ff", color: "#1890ff" },
  CHECKED_IN: { label: "已簽到", bg: "#fff7e6", color: "#fa8c16" },
  COMPLETED: { label: "已完成", bg: "#f6ffed", color: "#52c41a" },
  CANCELLED: { label: "已取消", bg: "#f5f5f5", color: "#999" },
};

export default function VisitsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"schedule" | "records" | "today">("schedule");
  const [visits, setVisits] = useState<any[]>([]);
  const [todayVisits, setTodayVisits] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [custSearch, setCustSearch] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const filteredCustomers = customers.filter(c => 
    !custSearch || c.customer_name?.toLowerCase().includes(custSearch.toLowerCase()) || c.customer_code?.toLowerCase().includes(custSearch.toLowerCase())
  );

  // Schedule form
  const [schedForm, setSchedForm] = useState({ customer_id: "", scheduled_time: "", visit_type: "ROUTINE" });
  // Record form
  const [recForm, setRecForm] = useState({ customer_id: "", visit_date: new Date().toISOString().slice(0, 10), visit_type: "ROUTINE", visit_purpose: "ROUTINE", result_code: "", notes: "", next_action: "", next_followup_date: "" });

  const fetchVisits = useCallback(() => {
    setLoading(true);
    api.get("/visits").then((r: any) => setVisits(r.data || [])).finally(() => setLoading(false));
  }, []);

  const fetchToday = useCallback(() => {
    api.get("/visits/today").then((r: any) => setTodayVisits(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => { fetchVisits(); fetchToday(); }, [fetchVisits, fetchToday]);
  useEffect(() => {
    api.get("/customers", { params: { page_size: 200 } }).then((r: any) => setCustomers(r.data?.items || [])).catch(() => {});
  }, []);

  const doSchedule = async () => {
    if (!schedForm.customer_id || !schedForm.scheduled_time) { alert("請填寫客戶與預排時間"); return; }
    setSaving(true);
    try { await api.post("/visits/schedule", schedForm); alert("行程預排成功"); fetchVisits(); fetchToday(); setSchedForm({ customer_id: "", scheduled_time: "", visit_type: "ROUTINE" }); }
    catch (e: any) { alert(e?.response?.data?.message || "預排失敗"); }
    finally { setSaving(false); }
  };

  const doCheckin = async (visitId: string) => {
    const getPosition = (): Promise<{ lat: number; lng: number }> => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error("瀏覽器不支援GPS")); return; }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(new Error(err.message || "無法取得位置")),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      });
    };

    try {
      let lat: number, lng: number;
      try {
        const pos = await getPosition();
        lat = pos.lat; lng = pos.lng;
      } catch (geoErr: any) {
        const manualLat = prompt("無法自動取得GPS位置（" + geoErr.message + "）\n請手動輸入緯度：", "25.0330");
        if (!manualLat) return;
        const manualLng = prompt("請手動輸入經度：", "121.5654");
        if (!manualLng) return;
        lat = parseFloat(manualLat); lng = parseFloat(manualLng);
        if (isNaN(lat) || isNaN(lng)) { alert("坐標格式錯誤"); return; }
      }

      await api.post("/visits/checkin", { visit_id: visitId, gps_latitude: lat, gps_longitude: lng });
      alert("簽到成功（" + lat.toFixed(4) + ", " + lng.toFixed(4) + "）");
      fetchToday(); fetchVisits();
    } catch (e: any) { alert(e?.response?.data?.message || "簽到失敗"); }
  };

  const doCheckout = async (visitId: string) => {
    try {
      await api.put("/visits/" + visitId + "/checkout");
      alert("簽退成功"); fetchToday(); fetchVisits();
    } catch (e: any) { alert(e?.response?.data?.message || "簽退失敗"); }
  };

  const doCreateRecord = async () => {
    if (!recForm.customer_id) { alert("請選擇客戶"); return; }
    setSaving(true);
    try { await api.post("/visits/records", recForm); alert("回訪記錄建立成功"); fetchVisits(); setRecForm({ customer_id: "", visit_date: new Date().toISOString().slice(0, 10), visit_type: "ROUTINE", visit_purpose: "ROUTINE", result_code: "", notes: "", next_action: "", next_followup_date: "" }); }
    catch (e: any) { alert(e?.response?.data?.message || "建立失敗"); }
    finally { setSaving(false); }
  };

  // Filter visits
  const plannedVisits = visits.filter((v: any) => v.status === "PLANNED");
  const completedVisits = visits.filter((v: any) => v.status === "COMPLETED" || v.status === "CHECKED_IN");

  const tabBtn = (tab: string, label: string, count?: number) => {
    const isActive = activeTab === tab;
    return <button onClick={() => setActiveTab(tab as any)} style={{
      height: 36, padding: "0 20px", borderRadius: 4, border: isActive ? "2px solid #1890ff" : "1px solid #d9d9d9",
      background: isActive ? "#e6f7ff" : "#fff", color: isActive ? "#1890ff" : "#666",
      fontSize: 14, fontWeight: isActive ? 600 : 400, cursor: "pointer", marginRight: 8
    }}>{label}{count !== undefined ? ` (${count})` : ""}</button>;
  };

  const renderTable = (rows: any[], showActions: boolean) => (
    <div style={cb}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={th}>日期</th><th style={th}>時間</th><th style={th}>客戶</th><th style={th}>類型</th>
            {showActions && <><th style={th}>本次結果</th><th style={th}>下一步</th><th style={th}>下次追蹤</th></>}
            <th style={th}>狀態</th>
            {!showActions && <th style={th}>操作</th>}
          </tr></thead>
          <tbody>
            {rows.map((v: any, i: number) => (
              <tr key={v.visit_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={td}>{v.visit_date ? new Date(v.visit_date).toLocaleDateString("zh-TW") : "-"}</td>
                <td style={td}>{v.scheduled_time || "-"}</td>
                <td style={{ ...td, fontWeight: 500 }}>{v.customer_name || v.customer_id?.slice(0, 8)}</td>
                <td style={td}>{VISIT_TYPES.find(t => t.value === v.visit_type)?.label || v.visit_type}</td>
                {showActions ? (
                  <>
                    <td style={td}>{RESULT_OPTIONS.find(o => o.value === v.result_code)?.label || v.result_code || "-"}</td>
                    <td style={td}>{NEXT_ACTIONS.find(o => o.value === v.next_action)?.label || v.next_action || "-"}</td>
                    <td style={td}>{v.next_followup_date || "-"}</td>
                  </>
                ) : null}
                <td style={td}><span style={ts(STATUS_MAP[v.status]?.bg || "#f0f0f0", STATUS_MAP[v.status]?.color || "#666")}>{STATUS_MAP[v.status]?.label || v.status}</span></td>
                {!showActions && (
                  <td style={td}>
                    <button onClick={() => doCheckin(v.visit_id)} style={{ height: 26, padding: "0 10px", borderRadius: 3, border: "1px solid #1890ff", background: "#fff", color: "#1890ff", fontSize: 11, cursor: "pointer", marginRight: 4 }}>簽到</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a2e" }}>業務拜訪管理</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#999" }}>行程預排、GPS打卡、回訪記錄與客戶經營追蹤</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {tabBtn("schedule", "行程預排", plannedVisits.length)}
          {tabBtn("today", "今日行程", todayVisits.length)}
          {tabBtn("records", "拜訪記錄", completedVisits.length)}
        </div>

        {/* Tab: Schedule (form + planned list) */}
        {activeTab === "schedule" && (
          <div>
            <div style={cardBox}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>新增行程預排</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>客戶 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <div style={{ position: "relative" }}>
                    <input style={si} placeholder="搜索客戶名稱或編碼..." 
                      value={schedForm.customer_id ? (customers.find(c => c.customer_id === schedForm.customer_id)?.customer_name || "") : custSearch}
                      onChange={e => { setCustSearch(e.target.value); setShowCustDropdown(true); if (!e.target.value) { setSchedForm({ ...schedForm, customer_id: "" }); } }}
                      onFocus={() => setShowCustDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCustDropdown(false), 200)}
                    />
                    {showCustDropdown && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: 200, overflow: "auto", background: "#fff", border: "1px solid #d9d9d9", borderRadius: 4, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                        <div style={{ padding: "6px 12px", fontSize: 12, color: "#999", borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                          onMouseDown={() => { setSchedForm({ ...schedForm, customer_id: "" }); setCustSearch(""); setShowCustDropdown(false); }}>
                          清除選擇
                        </div>
                        {filteredCustomers.length === 0 ? (
                          <div style={{ padding: "12px", textAlign: "center", color: "#999", fontSize: 13 }}>無匹配客戶</div>
                        ) : filteredCustomers.slice(0, 50).map(c => (
                          <div key={c.customer_id} style={{ padding: "6px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f5f5f5" }}
                            onMouseDown={() => { setSchedForm({ ...schedForm, customer_id: c.customer_id }); setCustSearch(""); setShowCustDropdown(false); }}
                            onMouseEnter={e => { (e.target as HTMLElement).style.background = "#e6f7ff"; }}
                            onMouseLeave={e => { (e.target as HTMLElement).style.background = "#fff"; }}>
                            <span style={{ fontWeight: 500 }}>{c.customer_name}</span>
                            <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>{c.customer_code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>預排時間 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <input style={si} type="datetime-local" value={schedForm.scheduled_time} onChange={e => setSchedForm({ ...schedForm, scheduled_time: e.target.value })} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>拜訪類型</div>
                  <select style={ss} value={schedForm.visit_type} onChange={e => setSchedForm({ ...schedForm, visit_type: e.target.value })}>
                    {VISIT_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={doSchedule} disabled={saving} style={{ ...bp, marginTop: 12 }}>{saving ? "預排中..." : "確認預排"}</button>
            </div>

            {/* Scheduled visits list */}
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#333", marginBottom: 12 }}>已預排行程</h3>
            {loading ? <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div> :
             plannedVisits.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: "#999" }}>尚無預排行程</div> :
             renderTable(plannedVisits, false)}
          </div>
        )}

        {/* Tab: Today */}
        {activeTab === "today" && (
          <div>
            {todayVisits.length === 0 ? <div style={{ ...cardBox, textAlign: "center", padding: 40, color: "#999" }}>今日尚無行程</div> : todayVisits.map((v: any) => (
              <div key={v.visit_id} style={{ ...cardBox, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>{v.customer_name || v.customer_id?.slice(0, 8)}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                    預排: {v.visit_date ? new Date(v.visit_date).toLocaleDateString("zh-TW") : "-"} {v.scheduled_time || ""} · {VISIT_TYPES.find(t => t.value === v.visit_type)?.label || v.visit_type}
                    {v.checkin_time && <> · 簽到: {new Date(v.checkin_time).toLocaleTimeString("zh-TW")}</>}
                    {v.checkout_time && <> · 簽退: {new Date(v.checkout_time).toLocaleTimeString("zh-TW")}</>}
                    {v.duration_minutes && <> · 停留: {v.duration_minutes} 分鐘</>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={ts(STATUS_MAP[v.status]?.bg || "#f0f0f0", STATUS_MAP[v.status]?.color || "#666")}>{STATUS_MAP[v.status]?.label || v.status}</span>
                  {v.status === "PLANNED" && <button onClick={() => doCheckin(v.visit_id)} style={{ ...bp, height: 28, fontSize: 12, padding: "0 12px" }}>GPS簽到</button>}
                  {v.status === "CHECKED_IN" && <button onClick={() => doCheckout(v.visit_id)} style={{ ...bp, height: 28, fontSize: 12, padding: "0 12px", background: "#52c41a" }}>簽退</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Records (completed only + new record form) */}
        {activeTab === "records" && (
          <div>
            {/* New Record Form */}
            <div style={cardBox}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>新增回訪記錄</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>客戶 <span style={{ color: "#ff4d4f" }}>*</span></div>
                  <div style={{ position: "relative" }}>
                    <input style={si} placeholder="搜索客戶名稱..." 
                      value={recForm.customer_id ? (customers.find(c => c.customer_id === recForm.customer_id)?.customer_name || "") : ""}
                      onChange={e => { setRecForm({ ...recForm, customer_id: "" }); }}
                      onFocus={() => setShowCustDropdown(true)}
                    />
                    {showCustDropdown && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: 200, overflow: "auto", background: "#fff", border: "1px solid #d9d9d9", borderRadius: 4, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                        <div style={{ padding: "6px 12px", fontSize: 12, color: "#999", borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                          onMouseDown={() => { setRecForm({ ...recForm, customer_id: "" }); setShowCustDropdown(false); }}>
                          清除選擇
                        </div>
                        {filteredCustomers.length === 0 ? (
                          <div style={{ padding: "12px", textAlign: "center", color: "#999", fontSize: 13 }}>無匹配客戶</div>
                        ) : filteredCustomers.slice(0, 50).map(c => (
                          <div key={c.customer_id} style={{ padding: "6px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f5f5f5" }}
                            onMouseDown={() => { setRecForm({ ...recForm, customer_id: c.customer_id }); setShowCustDropdown(false); }}
                            onMouseEnter={e => { (e.target as HTMLElement).style.background = "#e6f7ff"; }}
                            onMouseLeave={e => { (e.target as HTMLElement).style.background = "#fff"; }}>
                            <span style={{ fontWeight: 500 }}>{c.customer_name}</span>
                            <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>{c.customer_code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>拜訪日期</div>
                  <input style={si} type="date" value={recForm.visit_date} onChange={e => setRecForm({ ...recForm, visit_date: e.target.value })} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>拜訪類型</div>
                  <select style={ss} value={recForm.visit_type} onChange={e => setRecForm({ ...recForm, visit_type: e.target.value, visit_purpose: e.target.value })}>
                    {VISIT_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>本次結果</div>
                  <select style={ss} value={recForm.result_code} onChange={e => setRecForm({ ...recForm, result_code: e.target.value })}>
                    <option value="">請選擇</option>
                    {RESULT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>下一步動作</div>
                  <select style={ss} value={recForm.next_action} onChange={e => setRecForm({ ...recForm, next_action: e.target.value })}>
                    <option value="">請選擇</option>
                    {NEXT_ACTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>下次追蹤日期</div>
                  <input style={si} type="date" value={recForm.next_followup_date} onChange={e => setRecForm({ ...recForm, next_followup_date: e.target.value })} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>備註</div>
                  <textarea style={{ ...si, height: 60, resize: "vertical" }} value={recForm.notes} onChange={e => setRecForm({ ...recForm, notes: e.target.value })} />
                </div>
              </div>
              <button onClick={doCreateRecord} disabled={saving} style={{ ...bp, marginTop: 12 }}>{saving ? "建立中..." : "建立回訪記錄"}</button>
            </div>

            {/* Completed Records List */}
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#333", marginBottom: 12 }}>已完成拜訪記錄</h3>
            {loading ? <div style={{ textAlign: "center", padding: 40, color: "#999" }}>載入中...</div> :
             completedVisits.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: "#999" }}>尚無已完成拜訪記錄</div> :
             renderTable(completedVisits, true)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}