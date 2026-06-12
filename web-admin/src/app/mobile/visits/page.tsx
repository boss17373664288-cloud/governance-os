﻿﻿﻿﻿"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Search, Plus } from "lucide-react";
import { api } from "@/lib/api";

const VISIT_TYPES: Record<string, string> = {
  ROUTINE: "例行拜訪",
  FOLLOW_UP: "追蹤回訪",
  TRAINING: "產品培訓",
  COMPLAINT: "客訴處理",
  NEW_DEV: "新客戶開發",
  CONTRACT: "簽約洽談",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "已預排", color: "#1890ff" },
  CHECKED_IN: { label: "已簽到", color: "#fa8c16" },
  COMPLETED: { label: "已完成", color: "#52c41a" },
};

const FILTER_TABS = [
  { key: "", label: "全部" },
  { key: "PLANNED", label: "已預排" },
  { key: "CHECKED_IN", label: "已簽到" },
  { key: "COMPLETED", label: "已完成" },
];

export default function MobileVisitsPage() {
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 15;

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/visits");
      const arr = Array.isArray(res) ? res : (res?.data || res?.items || []);
      
      let filtered = arr;
      if (activeStatus) {
        filtered = filtered.filter((v: any) => v.status === activeStatus);
      }
      if (search.trim()) {
        var s = search.trim().toLowerCase();
        filtered = filtered.filter((v: any) =>
          (v.customer_name || "").toLowerCase().includes(s)
        );
      }
      
      setTotal(filtered.length);
      var start = (page - 1) * pageSize;
      setVisits(filtered.slice(start, start + pageSize));
    } catch (e) {
      setVisits([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, activeStatus, search]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  // GPS 簽到打卡
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
      fetchVisits();
    } catch (e: any) { alert(e?.response?.data?.message || "簽到失敗"); }
  };

  // 簽退
  const doCheckout = async (visitId: string) => {
    try {
      await api.put("/visits/" + visitId + "/checkout");
      alert("簽退成功");
      fetchVisits();
    } catch (e: any) { alert(e?.response?.data?.message || "簽退失敗"); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <button
          className="mobile-btn"
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            padding: 8,
            cursor: "pointer",
            minWidth: 44,
            minHeight: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={22} color="#333" />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#333", margin: 0, flex: 1 }}>
          業務拜訪
        </h1>
        <button
          className="mobile-btn"
          onClick={() => router.push("/mobile/visits/new")}
          style={{
            minWidth: 44,
            minHeight: 44,
            padding: "6px 14px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            background: "#1890ff",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 4,
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={16} />
          新增拜訪
        </button>
      </div>

      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#f5f5f5",
          borderRadius: 12,
          padding: "6px 12px",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <Search size={16} color="#999" />
        <input
          type="text"
          placeholder="搜尋客戶名稱..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: 14,
            color: "#333",
            minHeight: 44,
          }}
        />
      </div>

      {/* Status Filters */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 12,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            className="mobile-btn"
            onClick={() => {
              setActiveStatus(tab.key);
              setPage(1);
            }}
            style={{
              minWidth: 44,
              minHeight: 36,
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              background: activeStatus === tab.key ? "#1890ff" : "#f5f5f5",
              color: activeStatus === tab.key ? "#fff" : "#666",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Visit Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 14 }}>
          載入中...
        </div>
      ) : visits.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 14 }}>
          暫無拜訪記錄
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {visits.map((visit: any, i: number) => {
            const visitTypeLabel = VISIT_TYPES[visit.visit_type] || visit.visit_type || "-";
            const status = STATUS_MAP[visit.status] || { label: visit.status || "-", color: "#999" };
            return (
              <div
                key={visit.id || visit.visit_id || i}
                className="mobile-card"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPin size={16} color="#1890ff" />
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>
                      {visit.customer_name || "-"}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "3px 10px",
                      borderRadius: 10,
                      background: status.color + "18",
                      color: status.color,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {status.label}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "#f0f0f0",
                      color: "#555",
                    }}
                  >
                    {visitTypeLabel}
                  </span>
                  <span style={{ fontSize: 11, color: "#999" }}>
                    {(function() { if (visit.checkin_time) return visit.checkin_time.slice(0, 16).replace("T", " "); if (visit.scheduled_time) return visit.visit_date + " " + visit.scheduled_time; return visit.visit_date || "-"; })()}
                  </span>
                </div>
                {/* GPS 簽到 / 簽退 按鈕 */}
                <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                  {visit.status === "PLANNED" && (
                    <button className="mobile-btn" onClick={() => doCheckin(visit.visit_id)}
                      style={{ minWidth: 44, minHeight: 36, padding: "6px 14px", borderRadius: 8, border: "1px solid #1890ff", background: "#e6f7ff", color: "#1890ff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                      📍 簽到打卡
                    </button>
                  )}
                  {visit.status === "CHECKED_IN" && (
                    <button className="mobile-btn" onClick={() => doCheckout(visit.visit_id)}
                      style={{ minWidth: 44, minHeight: 36, padding: "6px 14px", borderRadius: 8, border: "none", background: "#52c41a", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                      ✅ 簽退
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            padding: "12px 0",
          }}
        >
          <button
            className="mobile-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              minWidth: 44,
              minHeight: 36,
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid #d9d9d9",
              background: page <= 1 ? "#f5f5f5" : "#fff",
              color: page <= 1 ? "#bbb" : "#333",
              cursor: page <= 1 ? "default" : "pointer",
              fontSize: 13,
            }}
          >
            上一頁
          </button>
          <span style={{ fontSize: 13, color: "#666" }}>
            {page} / {totalPages}
          </span>
          <button
            className="mobile-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{
              minWidth: 44,
              minHeight: 36,
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid #d9d9d9",
              background: page >= totalPages ? "#f5f5f5" : "#fff",
              color: page >= totalPages ? "#bbb" : "#333",
              cursor: page >= totalPages ? "default" : "pointer",
              fontSize: 13,
            }}
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
}
