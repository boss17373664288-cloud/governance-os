"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";

const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const si: React.CSSProperties = { width: "100%", height: 36, padding: "0 12px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" };
const sl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 };
const bp: React.CSSProperties = { height: 36, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const ts = (bg: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color, whiteSpace: "nowrap" });

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Change password
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const fetchProfile = async () => {
    try { const r = await api.get("/system/profile"); const p = r.data; setProfile(p); setEditName(p.full_name || ""); setEditEmail(p.email || ""); setEditPhone(p.phone || ""); }
    catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { fetchProfile(); }, []);

  const saveProfile = async () => {
    setSaving(true);
    try { await api.put("/system/profile", { full_name: editName, email: editEmail, phone: editPhone }); alert("個人資料已更新"); fetchProfile(); }
    catch(e:any){ alert(e?.response?.data?.message || "儲存失敗"); }
    finally { setSaving(false); }
  };

  const changePw = async () => {
    if (!oldPw || !newPw) { alert("請填寫舊密碼和新密碼"); return; }
    if (newPw.length < 6) { alert("新密碼至少6位"); return; }
    setPwSaving(true);
    try { await api.put("/system/profile/password", { old_password: oldPw, new_password: newPw }); alert("密碼修改成功，請重新登入"); setOldPw(""); setNewPw(""); }
    catch(e:any){ alert(e?.response?.data?.message || "修改失敗"); }
    finally { setPwSaving(false); }
  };

  const unbindMyDevice = async (deviceId: string) => {
    if (!confirm("確定要解綁此設備？")) return;
    try { await api.delete("/system/profile/devices/" + deviceId); fetchProfile(); } catch(e:any){ alert(e?.response?.data?.message || "解綁失敗"); }
  };

  if (loading) return <DashboardLayout><div style={{ textAlign: "center", padding: 60, color: "#999" }}>載入中...</div></DashboardLayout>;
  if (!profile) return <DashboardLayout><div style={{ textAlign: "center", padding: 60, color: "#999" }}>無法載入個人資料</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 28px", background: "#f5f7fa", minHeight: "100vh" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600, color: "#1a1a2e" }}>個人中心</h2>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#999" }}>管理您的個人資料、密碼與綁定設備</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* 個人資料卡片 */}
          <div style={{ ...cb, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1890ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, fontWeight: 600 }}>
                {(profile.full_name || "U").charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#333" }}>{profile.full_name}</div>
                <div style={{ fontSize: 13, color: "#888" }}>{profile.employee_no} · <span style={ts("#e6f7ff", "#1890ff")}>{profile.role_code}</span></div>
              </div>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={sl}>姓名</div>
                <input style={si} value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div>
                <div style={sl}>Email</div>
                <input style={si} value={editEmail} onChange={e => setEditEmail(e.target.value)} />
              </div>
              <div>
                <div style={sl}>電話</div>
                <input style={si} value={editPhone} onChange={e => setEditPhone(e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={sl}>區域</div>
                  <div style={{ ...si, display: "flex", alignItems: "center", color: "#999", background: "#fafafa" }}>{profile.region_code || "未設定"}</div>
                </div>
                <div>
                  <div style={sl}>最後登入</div>
                  <div style={{ ...si, display: "flex", alignItems: "center", color: "#999", background: "#fafafa", fontSize: 12 }}>
                    {profile.last_login_at ? profile.last_login_at.slice(0, 16).replace("T", " ") : "從未登入"}
                  </div>
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving} style={{ ...bp, width: "fit-content", marginTop: 4 }}>{saving ? "儲存中..." : "更新個人資料"}</button>
            </div>
          </div>

          {/* 右側：密碼 + 設備 */}
          <div style={{ display: "grid", gap: 20, alignContent: "start" }}>
            {/* 修改密碼 */}
            <div style={{ ...cb, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#333", margin: "0 0 16px" }}>修改密碼</h3>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={sl}>舊密碼</div>
                  <input style={si} type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} />
                </div>
                <div>
                  <div style={sl}>新密碼</div>
                  <input style={si} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="至少6位" />
                </div>
                <button onClick={changePw} disabled={pwSaving} style={{ ...bp, width: "fit-content" }}>{pwSaving ? "處理中..." : "修改密碼"}</button>
              </div>
            </div>

            {/* 綁定設備 */}
            <div style={{ ...cb, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#333", margin: "0 0 16px" }}>已綁定設備</h3>
              {(profile.devices || []).length === 0 ? (
                <div style={{ color: "#999", fontSize: 13, textAlign: "center", padding: 20 }}>尚無綁定設備</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {(profile.devices || []).map((d: any) => (
                    <div key={d.device_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#fafafa", borderRadius: 4 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{d.device_model || "未知設備"}</div>
                        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                          {d.os_version || "-"} · {d.bind_ip || "-"} · {d.created_at ? d.created_at.slice(0, 10) : "-"}
                        </div>
                      </div>
                      <button onClick={() => unbindMyDevice(d.device_id)} style={{ height: 28, padding: "0 12px", borderRadius: 3, border: "1px solid #ff4d4f", background: "#fff", color: "#ff4d4f", fontSize: 12, cursor: "pointer" }}>解綁</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}