"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Calendar, FileText } from "lucide-react";
import { api } from "@/lib/api";

const inputStyle: React.CSSProperties = { width: "100%", height: 44, padding: "0 14px", borderRadius: 12, border: "1px solid #d9d9d9", fontSize: 15, outline: "none", boxSizing: "border-box", background: "#fff" };
const labelStyle: React.CSSProperties = { fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 };
const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 16, marginBottom: 12 };
const required = { color: "#ff4d4f" };

const VISIT_TYPES = [
  { value: "ROUTINE", label: "例行拜訪" },
  { value: "FOLLOW_UP", label: "追蹤拜訪" },
  { value: "TRAINING", label: "教育訓練" },
  { value: "COMPLAINT", label: "客訴處理" },
  { value: "NEW_DEV", label: "新案開發" },
  { value: "CONTRACT", label: "合約簽訂" }
];

const RESULT_OPTIONS = [
  { value: "", label: "請選擇" },
  { value: "INTERESTED", label: "客戶有興趣" },
  { value: "NOT_INTERESTED", label: "客戶無興趣" },
  { value: "NEED_FOLLOWUP", label: "需要追蹤" },
  { value: "READY_TO_ORDER", label: "準備下單" },
  { value: "NEED_SAMPLE", label: "需要樣品" }
];

const NEXT_ACTIONS = [
  { value: "", label: "請選擇" },
  { value: "SEND_SAMPLE", label: "寄送樣品" },
  { value: "SEND_QUOTE", label: "寄送報價單" },
  { value: "FOLLOW_UP_CALL", label: "電話追蹤" },
  { value: "SCHEDULE_NEXT", label: "安排下次拜訪" },
  { value: "NO_ACTION", label: "無需動作" }
];

function todayStr(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export default function MobileNewVisitPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"schedule" | "record">("schedule");
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  const [schedCustomerId, setSchedCustomerId] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [schedType, setSchedType] = useState("ROUTINE");

  const [recCustomerId, setRecCustomerId] = useState("");
  const [recDate, setRecDate] = useState(todayStr());
  const [recType, setRecType] = useState("ROUTINE");
  const [recPurpose, setRecPurpose] = useState("ROUTINE");
  const [recResult, setRecResult] = useState("");
  const [recNotes, setRecNotes] = useState("");
  const [recNextAction, setRecNextAction] = useState("");
  const [recNextDate, setRecNextDate] = useState("");

  useEffect(() => {
    api.get("/customers", { params: { page_size: 200 } })
      .then((r: any) => setCustomers(r.data?.items || r.items || []))
      .catch(() => {});
  }, []);

  const filtered = customers.filter(
    (c: any) =>
      !custSearch ||
      (c.customer_name || "").toLowerCase().includes(custSearch.toLowerCase()) ||
      (c.customer_code || "").toLowerCase().includes(custSearch.toLowerCase())
  );

  const doSchedule = async () => {
    if (!schedCustomerId) { alert("請選擇客戶"); return; }
    if (!schedTime) { alert("請選擇預排時間"); return; }
    setSaving(true);
    try {
      await api.post("/visits/schedule", {
        customer_id: schedCustomerId,
        scheduled_time: schedTime,
        visit_type: schedType
      });
      alert("行程預排成功");
      router.push("/mobile/visits");
    } catch (e: any) {
      alert(e?.response?.data?.message || "預排失敗");
    } finally {
      setSaving(false);
    }
  };

  const doCreateRecord = async () => {
    if (!recCustomerId) { alert("請選擇客戶"); return; }
    setSaving(true);
    try {
      // GPS capture
      let lat: number, lng: number;
      try {
        const pos = await new Promise<any>((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error("no gps"));
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch {
        const mlat = prompt("無法自動取得GPS\n請手動輸入緯度：", "25.0330");
        if (!mlat) { setSaving(false); return; }
        const mlng = prompt("請手動輸入經度：", "121.5654");
        if (!mlng) { setSaving(false); return; }
        lat = parseFloat(mlat); lng = parseFloat(mlng);
        if (isNaN(lat) || isNaN(lng)) { alert("坐標格式錯誤"); setSaving(false); return; }
      }
      const payload: any = {
        customer_id: recCustomerId,
        visit_date: recDate,
        visit_type: recType,
        visit_purpose: recPurpose,
        gps_latitude: lat,
        gps_longitude: lng
      };
      if (recResult) payload.result_code = recResult;
      if (recNotes.trim()) payload.notes = recNotes.trim();
      if (recNextAction) payload.next_action = recNextAction;
      if (recNextDate) payload.next_followup_date = recNextDate;
      await api.post("/visits/records", payload);
      alert("拜訪紀錄建立成功");
      router.push("/mobile/visits");
    } catch (e: any) {
      alert(e?.response?.data?.message || "建立失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <button
          className="mobile-btn"
          onClick={() => router.back()}
          style={{
            background: "none", border: "none", padding: 8, cursor: "pointer",
            minWidth: 44, minHeight: 44
          }}
        >
          <ArrowLeft size={22} color="#333" />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, flex: 1 }}>新增拜訪</h1>
      </div>

      {/* Tab Switch */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          className="mobile-btn"
          onClick={() => setActiveTab("schedule")}
          style={{
            flex: 1, height: 40, borderRadius: 10, border: activeTab === "schedule" ? "2px solid #1890ff" : "1px solid #d9d9d9",
            background: activeTab === "schedule" ? "#e6f7ff" : "#fff",
            color: activeTab === "schedule" ? "#1890ff" : "#666",
            fontSize: 14, fontWeight: activeTab === "schedule" ? 600 : 400,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
          }}
        >
          <Calendar size={16} /> 行程預排
        </button>
        <button
          className="mobile-btn"
          onClick={() => setActiveTab("record")}
          style={{
            flex: 1, height: 40, borderRadius: 10, border: activeTab === "record" ? "2px solid #52c41a" : "1px solid #d9d9d9",
            background: activeTab === "record" ? "#f6ffed" : "#fff",
            color: activeTab === "record" ? "#52c41a" : "#666",
            fontSize: 14, fontWeight: activeTab === "record" ? 600 : 400,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
          }}
        >
          <FileText size={16} /> 新增紀錄
        </button>
      </div>

      {/* Customer Search */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <input
          style={inputStyle}
          placeholder="搜尋客戶名稱/編號..."
          value={custSearch}
          onChange={e => { setCustSearch(e.target.value); setShowCustDropdown(true); }}
          onFocus={() => setShowCustDropdown(true)}
        />
        {showCustDropdown && (
          <div style={{
            position: "absolute", top: 44, left: 0, right: 0, maxHeight: 200,
            overflow: "auto", background: "#fff", border: "1px solid #d9d9d9",
            borderRadius: 8, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <div
              style={{
                padding: "8px 12px", fontSize: 12, color: "#999", cursor: "pointer",
                borderBottom: "1px solid #f0f0f0"
              }}
              onMouseDown={() => {
                setSchedCustomerId(""); setRecCustomerId("");
                setShowCustDropdown(false); setCustSearch("");
              }}
            >
              清除選擇
            </div>
            {filtered.slice(0, 50).map((c: any) => (
              <div
                key={c.customer_id}
                style={{
                  padding: "10px 12px", fontSize: 13, cursor: "pointer",
                  borderBottom: "1px solid #f5f5f5"
                }}
                onMouseDown={() => {
                  setSchedCustomerId(c.customer_id);
                  setRecCustomerId(c.customer_id);
                  setShowCustDropdown(false);
                  setCustSearch(c.customer_name);
                }}
              >
                <span style={{ fontWeight: 500 }}>{c.customer_name}</span>
                <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>{c.customer_code}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 16, textAlign: "center", color: "#999", fontSize: 13 }}>
                無匹配客戶
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Tab */}
      {activeTab === "schedule" && (
        <div>
          <div className="mobile-card" style={cardStyle}>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>
                預排時間 <span style={required}>*</span>
              </div>
              <input
                type="datetime-local"
                value={schedTime}
                onChange={e => setSchedTime(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>拜訪類型</div>
              <select
                value={schedType}
                onChange={e => setSchedType(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" } as React.CSSProperties}
              >
                {VISIT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="mobile-btn"
            onClick={doSchedule}
            disabled={saving}
            style={{
              width: "100%", height: 48, borderRadius: 12, border: "none",
              background: saving ? "#91caff" : "#1890ff", color: "#fff",
              fontSize: 16, fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }}
          >
            <Save size={20} />
            {saving ? "預排中..." : "確認預排"}
          </button>
        </div>
      )}

      {/* Record Tab */}
      {activeTab === "record" && (
        <div>
          <div className="mobile-card" style={cardStyle}>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>
                拜訪日期 <span style={required}>*</span>
              </div>
              <input
                type="date"
                value={recDate}
                onChange={e => setRecDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>拜訪類型</div>
              <select
                value={recType}
                onChange={e => setRecType(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" } as React.CSSProperties}
              >
                {VISIT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>拜訪目的</div>
              <select
                value={recPurpose}
                onChange={e => setRecPurpose(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" } as React.CSSProperties}
              >
                {VISIT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>本次結果</div>
              <select
                value={recResult}
                onChange={e => setRecResult(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" } as React.CSSProperties}
              >
                {RESULT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>拜訪備註</div>
              <textarea
                value={recNotes}
                onChange={e => setRecNotes(e.target.value)}
                rows={3}
                style={{
                  ...inputStyle, height: "auto", padding: "12px 14px",
                  resize: "vertical"
                }}
                placeholder="請輸入拜訪備註..."
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>下一步動作</div>
              <select
                value={recNextAction}
                onChange={e => setRecNextAction(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" } as React.CSSProperties}
              >
                {NEXT_ACTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={labelStyle}>下次追蹤日期</div>
              <input
                type="date"
                value={recNextDate}
                onChange={e => setRecNextDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <button
            className="mobile-btn"
            onClick={doCreateRecord}
            disabled={saving}
            style={{
              width: "100%", height: 48, borderRadius: 12, border: "none",
              background: saving ? "#95de64" : "#52c41a", color: "#fff",
              fontSize: 16, fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }}
          >
            <Save size={20} />
            {saving ? "建立中..." : "建立紀錄"}
          </button>
        </div>
      )}
    </div>
  );
}