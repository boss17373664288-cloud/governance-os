"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { api } from "../../../lib/api";

import dynamic from "next/dynamic";
const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });
import EnumManager from "../../../components/EnumManager";

type Customer = any;
type Contact = { contact_id: string; contact_name: string; title: string; phone: string; email: string; sort_order: number };

const STATUS_MAP: Record<string, { l: string; bg: string; c: string }> = {
  LEAD: { l: "潛在", bg: "#f5f5f5", c: "#999" }, ACTIVE: { l: "活躍", bg: "#f6ffed", c: "#52c41a" },
  SAMPLING: { l: "打板中", bg: "#e6f7ff", c: "#1890ff" }, INACTIVE: { l: "非活躍", bg: "#fff7e6", c: "#fa8c16" },
  FROZEN: { l: "已凍結", bg: "#fff1f0", c: "#ff4d4f" },
};
const CREDIT_MAP: Record<string, { l: string; bg: string; c: string }> = {
  NORMAL: { l: "正常", bg: "#f6ffed", c: "#52c41a" }, WARNING: { l: "警示", bg: "#fff7e6", c: "#fa8c16" },
  FROZEN: { l: "凍結", bg: "#fff1f0", c: "#ff4d4f" },
};
let TYPE_MAP: Record<string, string> = { HOSPITAL: "醫院", CLINIC: "診所", DISTRIBUTOR: "經銷商", PERSONAL: "個人", CHAIN: "連鎖", GOV: "政府機構" };
const REGION_MAP: Record<string, string> = { NORTH: "北區", CENTRAL: "中區", SOUTH: "南區", EAST: "東區" };
let PMT_MAP: Record<string, string> = { CASH: "現金", NET_30: "月結30天", NET_60: "月結60天", NET_90: "月結90天" };
const SOURCE_MAP: Record<string, string> = { SELF_DEV: "自主開發", EXHIBITION: "展會獲取", REFERRAL: "客戶轉介紹", ONLINE: "線上諮詢", AGENT: "代理商", OTHER: "其他" };
const INDUSTRY_MAP: Record<string, string> = { HOSPITAL: "醫院", CLINIC: "診所", BEAUTY_SALON: "美容院", PHARMACY: "藥房", DISTRIBUTOR: "經銷商", ONLINE_SHOP: "電商", OTHER: "其他" };

const tag = (bg: string, c: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 2, background: bg, color: c });

/* Styles */
const leftCard: React.CSSProperties = { width: 260, flexShrink: 0, background: "#fff", borderRadius: 8, padding: "20px 20px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", position: "sticky", top: 20, alignSelf: "flex-start" };
const cb: React.CSSProperties = { background: "#fff", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: "#333", borderBottom: "1px solid #f0f0f0" };
const fl: React.CSSProperties = { fontSize: 12, color: "#888", marginBottom: 2 };
const fv: React.CSSProperties = { fontSize: 14, color: "#333", fontWeight: 500, wordBreak: "break-all" };
const ro: React.CSSProperties = { ...fv, background: "#f8fafc", padding: "6px 10px", borderRadius: 4 };
const btnSm: React.CSSProperties = { height: 28, padding: "0 10px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer" };
const btnPrimary: React.CSSProperties = { height: 32, padding: "0 16px", borderRadius: 4, border: "none", background: "#1890ff", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500 };
const inputS: React.CSSProperties = { width: "100%", height: 34, padding: "0 10px", borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, boxSizing: "border-box", outline: "none" };
const selectS: React.CSSProperties = { width: "100%", height: 34, borderRadius: 4, border: "1px solid #d9d9d9", fontSize: 13, padding: "0 8px", background: "#fff", outline: "none" };
const modalBg: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalBox: React.CSSProperties = { background: "#fff", borderRadius: 8, padding: 24, width: 480, maxHeight: "80vh", overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" };

const WEEKDAYS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];

export default function CustomerDetailPage() {
  const params = useParams(); const router = useRouter(); const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [consignment, setConsignment] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [pmtMap, setPmtMap] = useState<Record<string,string>>({ CASH:"現金",NET_30:"月結30天",NET_60:"月結60天",NET_90:"月結90天" });
  const employeeNameMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    employees.forEach((emp: any) => { map[emp.employee_id] = emp.full_name; });
    return map;
  }, [employees]);

  const [tab, setTab] = useState("main");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const [contactModal, setContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState({ contact_name: "", title: "", phone: "", email: "", sort_order: 0 });
  const [contactSaving, setContactSaving] = useState(false);

  const [workingDays, setWorkingDays] = useState<boolean[]>([true,true,true,true,true,false,false]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState("");

  const [shippingAddress, setShippingAddress] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingRecipient, setShippingRecipient] = useState("");
  const [shippingRecipientPhone, setShippingRecipientPhone] = useState("");
  const [billingRecipient, setBillingRecipient] = useState("");
  const [billingRecipientPhone, setBillingRecipientPhone] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [billingZip, setBillingZip] = useState("");

  const fetchAll = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api.get('/employees').then((r: any) => setEmployees(r.data?.items || [])).catch(() => {});
    Promise.all([
      api.get(`/customers/${id}`),
      api.get(`/customers/${id}/contacts`),
      api.get(`/sales-orders`, { params: { customer_id: id, page_size: 50 } }),
      api.get(`/visits`, { params: { customer_id: id, page_size: 50 } }),
      api.get(`/customers/${id}/consignment`),
      api.get(`/customers/${id}/timeline`),
    ]).then(([c, ct, ord, vis, cs, tl]: any[]) => {
      const cust = c.data;
      setCustomer(cust);
      setContacts(ct.data || []);
      setOrders(ord.data?.items || []);
      setVisits(vis.data?.items || []);
      setConsignment(cs.data || []);
      setTimeline(tl.data || []);
      try { if (cust.working_days) setWorkingDays(JSON.parse(cust.working_days)); } catch {}
      try { if (cust.holidays) setHolidays(JSON.parse(cust.holidays)); } catch {}
      if (cust.shipping_address) setShippingAddress(cust.shipping_address);
      if (cust.billing_address) setBillingAddress(cust.billing_address);
      if (cust.shipping_recipient) setShippingRecipient(cust.shipping_recipient);
      if (cust.shipping_recipient_phone) setShippingRecipientPhone(cust.shipping_recipient_phone);
      if (cust.billing_recipient) setBillingRecipient(cust.billing_recipient);
      if (cust.billing_recipient_phone) setBillingRecipientPhone(cust.billing_recipient_phone);
      if (cust.shipping_zip) setShippingZip(cust.shipping_zip);
      if (cust.billing_zip) setBillingZip(cust.billing_zip);
      if (cust.shipping_zip) setShippingZip(cust.shipping_zip);
      if (cust.billing_zip) setBillingZip(cust.billing_zip);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { PMT_MAP = pmtMap; }, [pmtMap]);
  const refreshPmtMap = useCallback(() => { api.get("/system/enum-options/payment_terms").then((r:any)=>{ const opts = r.data||r||[]; const m:Record<string,string>={}; opts.forEach((o:any)=>m[o.code]=o.label); setPmtMap(m); }).catch(()=>{}); }, []);
  useEffect(() => { refreshPmtMap(); }, [refreshPmtMap]);

  const startEdit = () => { setEditForm({ ...customer }); setEditMode(true); };
  const cancelEdit = () => { setEditMode(false); };
  const saveEdit = async () => {
    if (!editForm.customer_name?.trim()) return alert("請輸入客戶名稱");
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        shipping_address: shippingAddress,
        shipping_recipient: shippingRecipient,
        shipping_recipient_phone: shippingRecipientPhone,
        billing_address: billingAddress,
        billing_recipient: billingRecipient,
        billing_recipient_phone: billingRecipientPhone,
        shipping_zip: shippingZip,
        billing_zip: billingZip,
        shipping_zip: shippingZip,
        billing_zip: billingZip,
        working_days: JSON.stringify(workingDays),
        holidays: JSON.stringify(holidays),
      };
      await api.put(`/customers/${id}`, payload);
      const updated = await api.get(`/customers/${id}`);
      setCustomer(updated.data || updated);
      setEditMode(false);
      alert("已更新");
    } catch (e: any) { alert(e?.response?.data?.message || "儲存失敗"); }
    finally { setSaving(false); }
  };

  const openContactAdd = () => { setEditingContact(null); setContactForm({ contact_name: "", title: "", phone: "", email: "", sort_order: contacts.length + 1 }); setContactModal(true); };
  const openContactEdit = (c: Contact) => { setEditingContact(c); setContactForm({ contact_name: c.contact_name, title: c.title || "", phone: c.phone || "", email: c.email || "", sort_order: c.sort_order || 0 }); setContactModal(true); };
  const saveContact = async () => {
    if (!contactForm.contact_name.trim()) return alert("請輸入聯絡人姓名");
    setContactSaving(true);
    try {
      if (editingContact) { await api.put(`/customers/${id}/contacts/${editingContact.contact_id}`, contactForm); }
      else { await api.post(`/customers/${id}/contacts`, contactForm); }
      setContactModal(false);
      const r = await api.get(`/customers/${id}/contacts`);
      setContacts(r.data || []);
    } catch (e: any) { alert(e?.response?.data?.message || "操作失敗"); }
    finally { setContactSaving(false); }
  };
  const deleteContact = async (c: Contact) => {
    if (!confirm(`確定刪除聯絡人 "${c.contact_name}"？`)) return;
    try { await api.delete(`/customers/${id}/contacts/${c.contact_id}`); const r = await api.get(`/customers/${id}/contacts`); setContacts(r.data || []); }
    catch (e: any) { alert(e?.response?.data?.message || "刪除失敗"); }
  };

  const addHoliday = () => { if (newHoliday && !holidays.includes(newHoliday)) { setHolidays([...holidays, newHoliday].sort()); setNewHoliday(""); } };
  const removeHoliday = (d: string) => { setHolidays(holidays.filter(h => h !== d)); };

  if (loading) return <DashboardLayout><div style={{ padding: 60, textAlign: "center", color: "#999", fontSize: 14 }}>載入中...</div></DashboardLayout>;
  if (!customer) return <DashboardLayout><div style={{ padding: 60, textAlign: "center", color: "#999", fontSize: 14 }}>客戶不存在</div></DashboardLayout>;

  const st = STATUS_MAP[customer.customer_status] || { l: customer.customer_status, bg: "#f5f5f5", c: "#999" };
  const cr = CREDIT_MAP[customer.credit_status] || { l: customer.credit_status, bg: "#f5f5f5", c: "#999" };
  const tabs = [
    { key: "main", label: "客戶主資料" },
    { key: "ar", label: "應收帳款" }, { key: "consignment", label: "寄庫台帳" },
    { key: "visits", label: "拜訪記錄 (" + visits.length + ")" }, { key: "orders", label: "歷史成交 (" + orders.length + ")" },
    { key: "timeline", label: "時間軸" },
    { key: "enumTypes", label: "下拉選項管理" },
  ];

  const f = editMode ? editForm : customer;

  return (
    <DashboardLayout>
      <div style={{ padding: "20px 24px", background: "#eef2f5", minHeight: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={() => router.back()} style={{ height: 30, padding: "0 12px", borderRadius: 3, border: "1px solid #d9d9d9", background: "#fff", color: "#666", fontSize: 12, cursor: "pointer" }}>← 返回</button>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a2e", margin: 0 }}>客戶主資料</h2>
          <div style={{ flex: 1 }} />
          {tab === "main" && (editMode ? (<><button onClick={cancelEdit} style={btnSm}>取消</button><button onClick={saveEdit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>{saving ? "儲存中..." : "儲存"}</button></>) : (<button onClick={startEdit} style={btnPrimary}>編輯</button>))}
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <div style={leftCard}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#333", marginBottom: 6 }}>{f.customer_name}</div>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>{f.customer_code}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}><span style={tag(st.bg, st.c)}>{st.l}</span><span style={tag(cr.bg, cr.c)}>{cr.l}</span></div>
            {tabs.map(t => <div key={t.key} onClick={() => setTab(t.key)} style={{ padding: "8px 0", cursor: "pointer", fontSize: 13, color: tab === t.key ? "#1890ff" : "#666", fontWeight: tab === t.key ? 600 : 400, borderBottom: tab === t.key ? "2px solid #1890ff" : "2px solid transparent" }}>{t.label}</div>)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {tab === "main" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={cb}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", margin: 0 }}>基本資料</h3>
                    <div style={{ display: "grid", gap: 0 }}>
                      {[["客戶舊編碼","old_erp_customer_code"],["客戶名稱","customer_name",true],["客戶簡稱","customer_short_name",true],["客戶類型","customer_type",true,"select",TYPE_MAP],["客戶來源","customer_source",false,"select",SOURCE_MAP],["行業類型","industry_type",false,"select",INDUSTRY_MAP],["統一編號","unified_business_no"],["醫事機構代碼","medical_institution_code"],["負責業務","owning_employee_id",false,"emp",employeeNameMap],["應收帳款","outstanding_ar",false,"ro"],["合約已簽","contract_signed",false,"bool"],["允許交易","allow_transaction",false,"bool"],["建檔日期","created_at",false,"ro"]].map(([label,field,req,type,map]:any,i)=>(<div key={i} style={{padding:"12px 16px",borderBottom:"1px solid #f5f5f5"}}><div style={fl}>{label}{req&&<span style={{color:"#ff4d4f"}}> *</span>}</div>{editMode?(type==="select"?<select value={editForm[field]||""} onChange={e=>setEditForm({...editForm,[field]:e.target.value})} style={selectS}><option value="">請選擇</option>{Object.entries(map||{}).map(([k,v])=><option key={k} value={k}>{v as string}</option>)}</select>:type==="bool"?<select value={editForm[field]?"true":"false"} onChange={e=>setEditForm({...editForm,[field]:e.target.value==="true"})} style={selectS}><option value="true">是</option><option value="false">否</option></select>:type==="emp"?<input style={inputS} value={f.owning_employee?.full_name||""} disabled />:<input style={inputS} value={editForm[field]||""} onChange={e=>setEditForm({...editForm,[field]:e.target.value})}/>):type==="ro"?<div style={ro}>{f[field]?.slice(0,10)||"-"}</div>:type==="emp"?<div style={fv}>{f.owning_employee?.full_name||"-"}</div>:type==="select"?<div style={fv}>{map?.[f[field]]||f[field]||"-"}</div>:<div style={fv}>{f[field]||"-"}</div>}</div>))}
                    </div>
                  </div>
                  <div>
                    <div style={{ ...cb, marginBottom: 16 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", margin: 0 }}>聯絡資訊</h3>
                      <div style={{ display: "grid", gap: 0 }}>
                        {[["公司郵遞","company_zip_code"],["電話","phone"],["公司地址","company_address"],["Email","email"],["公司網址","website"],["聯絡人","contact_person"],["聯絡人電話","contact_phone"]].map(([label,field],i)=>(<div key={i} style={{padding:"12px 16px",borderBottom:"1px solid #f5f5f5"}}><div style={fl}>{label}</div>{editMode?<input style={inputS} value={editForm[field]||""} onChange={e=>setEditForm({...editForm,[field]:e.target.value})}/>:<div style={fv}>{f[field]||"-"}</div>}</div>))}
                      </div>
                    </div>
                    <div style={cb}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", margin: 0 }}>財務/信用</h3>
                      <div style={{ display: "grid", gap: 0 }}>
                        {[["付款條件","payment_terms",false,"select",PMT_MAP],["信用額度","credit_limit"],["開票統編","invoice_tax_id"],["開票備註","invoice_remark"]] .map(([label,field,req,type,map]:any,i)=>(<div key={i} style={{padding:"12px 16px",borderBottom:"1px solid #f5f5f5"}}><div style={{...fl,color:field==="invoice_tax_id"||field==="invoice_remark"?"#ff4d4f":void 0}}>{label}</div>{editMode?(type==="select"?<select value={editForm[field]||""} onChange={e=>setEditForm({...editForm,[field]:e.target.value})} style={selectS}><option value="">請選擇</option>{Object.entries(map||{}).map(([k,v])=><option key={k} value={k}>{v as string}</option>)}</select>:<input style={inputS} value={editForm[field]||""} onChange={e=>setEditForm({...editForm,[field]:e.target.value})}/>):<div style={{...fv,color:field==="invoice_tax_id"||field==="invoice_remark"?"#ff4d4f":void 0}}>{type==="ro"&&!f[field]?"-":map?.[f[field]]||f[field]||"-"}</div>}</div>))}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ ...cb, marginBottom: 16 }}>
                <div style={{ ...cb, marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", margin: 0 }}>銀行資訊</h3>
                  <div style={{ display: "grid", gap: 0 }}>
                    {[["公司銀行","bank_name"],["銀行帳號","bank_account"],["抬頭/戶名","bank_account_name"]].map(([label,field],i)=>(<div key={i} style={{padding:"12px 16px",borderBottom:"1px solid #f5f5f5"}}><div style={fl}>{label}</div>{editMode?<input style={inputS} value={editForm[field]||""} onChange={e=>setEditForm({...editForm,[field]:e.target.value})}/>:<div style={fv}>{f[field]||"-"}</div>}</div>))}
                  </div>
                </div>

                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", margin: 0 }}>地址</h3>
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 500 }}>送貨資訊</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                        <div><div style={fl}>送貨郵遞</div>{editMode?<input style={inputS} value={shippingZip} onChange={e=>setShippingZip(e.target.value)}/>:<div style={fv}>{shippingZip||"-"}</div>}</div>
                      <div><div style={fl}>送貨地址</div>{editMode?<input style={inputS} value={shippingAddress} onChange={e=>setShippingAddress(e.target.value)}/>:<div style={fv}>{shippingAddress||"-"}</div>}</div>
                      <div><div style={fl}>收貨人</div>{editMode?<input style={inputS} value={shippingRecipient} onChange={e=>setShippingRecipient(e.target.value)}/>:<div style={fv}>{shippingRecipient||"-"}</div>}</div>
                      <div><div style={fl}>收貨人電話</div>{editMode?<input style={inputS} value={shippingRecipientPhone} onChange={e=>setShippingRecipientPhone(e.target.value)}/>:<div style={fv}>{shippingRecipientPhone||"-"}</div>}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 500 }}>發票資訊</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr 1fr", gap: 12 }}>
                        <div><div style={fl}>發票郵遞</div>{editMode?<input style={inputS} value={billingZip} onChange={e=>setBillingZip(e.target.value)}/>:<div style={fv}>{billingZip||"-"}</div>}</div>
                      <div><div style={fl}>發票地址</div>{editMode?<input style={inputS} value={billingAddress} onChange={e=>setBillingAddress(e.target.value)}/>:<div style={fv}>{billingAddress||"-"}</div>}</div>
                      <div><div style={fl}>收票人</div>{editMode?<input style={inputS} value={billingRecipient} onChange={e=>setBillingRecipient(e.target.value)}/>:<div style={fv}>{billingRecipient||"-"}</div>}</div>
                      <div><div style={fl}>收票人電話</div>{editMode?<input style={inputS} value={billingRecipientPhone} onChange={e=>setBillingRecipientPhone(e.target.value)}/>:<div style={fv}>{billingRecipientPhone||"-"}</div>}</div>
                    
                {editMode && (<div style={{gridColumn: "1 / -1"}}><div style={{...cb, marginBottom: 16}}><h3 style={{fontSize:14,fontWeight:600,color:"#333",padding:"12px 16px",borderBottom:"1px solid #f0f0f0",margin:0}}>GPS 座標 (地圖選點)</h3><div style={{padding:16}}><MapPicker lat={editForm.latitude} lng={editForm.longitude} address={editForm.company_address} autoLocateAddress={editForm.company_address} onChange={(lat,lng)=>{setEditForm({...editForm,latitude:lat,longitude:lng})}}/><div style={{display:"flex",gap:16,marginTop:12}}><div style={{flex:1}}><div style={fl}>緯度 Latitude</div><input style={inputS} value={editForm.latitude||""} onChange={e=>setEditForm({...editForm,latitude:parseFloat(e.target.value)||undefined})} placeholder="25.034"/></div><div style={{flex:1}}><div style={fl}>經度 Longitude</div><input style={inputS} value={editForm.longitude||""} onChange={e=>setEditForm({...editForm,longitude:parseFloat(e.target.value)||undefined})} placeholder="121.565"/></div></div></div></div></div>)}</div>
                  </div>
                </div>
                <div style={{ ...cb, marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", margin: 0 }}>營業排程</h3>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>{WEEKDAYS.map((d,i)=><label key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:13,cursor:"pointer"}}><input type="checkbox" checked={workingDays[i]} onChange={e=>{const w=[...workingDays];w[i]=e.target.checked;setWorkingDays(w)}} disabled={!editMode}/>{d}</label>)}</div>
                    <div><div style={fl}>假日</div><div style={{display:"flex",gap:8}}>{holidays.map(d=><span key={d} style={{fontSize:12,background:"#fff1f0",color:"#ff4d4f",padding:"2px 6px",borderRadius:3}}>{d}{editMode&&<span onClick={()=>removeHoliday(d)} style={{cursor:"pointer",marginLeft:4}}>✕</span>}</span>)}</div>{editMode&&<div style={{display:"flex",gap:8,marginTop:8}}><input style={{...inputS,width:140}} value={newHoliday} onChange={e=>setNewHoliday(e.target.value)} placeholder="YYYY-MM-DD"/><button onClick={addHoliday} style={btnSm}>新增</button></div>}</div>
                  </div>
                </div>
                <div style={cb}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: 0 }}>聯絡人管理</h3>
                    {editMode && <button onClick={openContactAdd} style={btnSm}>+ 新增聯絡人</button>}
                  </div>
                  {contacts.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: "#999" }}>尚無聯絡人</div> : contacts.map(c=><div key={c.contact_id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",borderBottom:"1px solid #f5f5f5"}}><div><div style={{fontSize:13,fontWeight:500}}>{c.contact_name}{c.title&&<span style={{fontSize:11,color:"#999",marginLeft:6}}>({c.title})</span>}</div><div style={{fontSize:12,color:"#888"}}>{c.phone||"-"} / {c.email||"-"}</div></div>{editMode&&<div><button onClick={()=>openContactEdit(c)} style={btnSm}>編輯</button><button onClick={()=>deleteContact(c)} style={{...btnSm,color:"#ff4d4f",borderColor:"#ffccc7",marginLeft:4}}>刪除</button></div>}</div>)}
                </div>
              </div>
            )}
            {tab === "ar" && (<div style={cb}><div style={{ padding: 30, textAlign: "center", color: "#999" }}>尚無應收帳款記錄</div></div>)}
            {tab === "consignment" && (<div style={cb}><div style={{ padding: 30, textAlign: "center", color: "#999" }}>尚無寄庫記錄</div></div>)}
            {tab === "visits" && (<div style={cb}>{visits.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: "#999" }}>尚無拜訪記錄</div> : visits.map((v:any,i:number)=><div key={i} style={{padding:"10px 16px",borderBottom:"1px solid #f5f5f5"}}><div style={{fontSize:13,fontWeight:500}}>{v.visit_date?.slice(0,10)||"-"}</div><div style={{fontSize:12,color:"#888"}}>{v.visit_type||"-"}</div></div>)}</div>)}
            {tab === "orders" && (<div style={cb}>{orders.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: "#999" }}>尚無歷史訂單</div> : orders.map((o:any,i:number)=><div key={i} style={{padding:"10px 16px",borderBottom:"1px solid #f5f5f5"}}><div style={{fontSize:13,fontWeight:500}}>{o.order_no||o.order_id}</div><div style={{fontSize:12,color:"#888"}}>{o.created_at?.slice(0,10)||"-"} / NT$ {o.total_amount||0}</div></div>)}</div>)}
            {tab === "timeline" && (<div style={cb}>{timeline.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: "#999" }}>尚無時間軸記錄</div> : <div style={{ padding: 16 }}>{timeline.map((t:any,i:number)=><div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid #f5f5f5"}}><div style={{fontSize:12,color:"#999",minWidth:100}}>{t.event_date?.slice(0,10)||t.created_at?.slice(0,10)||"-"}</div><div><div style={{fontSize:13,color:"#333"}}>{t.event_type||t.description||"-"}</div></div></div>)}</div>}</div>)}
            {tab === "enumTypes" && <EnumManager onChange={refreshPmtMap} />}
          </div>
        </div>
      </div>
      {contactModal && (<div style={modalBg} onClick={()=>setContactModal(false)}><div style={modalBox} onClick={e=>e.stopPropagation()}>
        <h3 style={{margin:"0 0 16px",fontSize:16}}>{editingContact?"修改聯絡人":"新增聯絡人"}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div><div style={fl}>姓名 <span style={{color:"#ff4d4f"}}>*</span></div><input style={inputS} value={contactForm.contact_name} onChange={e=>setContactForm({...contactForm,contact_name:e.target.value})}/></div>
          <div><div style={fl}>職稱</div><input style={inputS} value={contactForm.title} onChange={e=>setContactForm({...contactForm,title:e.target.value})}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><div style={fl}>電話</div><input style={inputS} value={contactForm.phone} onChange={e=>setContactForm({...contactForm,phone:e.target.value})}/></div><div><div style={fl}>Email</div><input style={inputS} value={contactForm.email} onChange={e=>setContactForm({...contactForm,email:e.target.value})}/></div></div>
          <div><div style={fl}>排序</div><input type="number" style={inputS} value={contactForm.sort_order} onChange={e=>setContactForm({...contactForm,sort_order:parseInt(e.target.value)||0})}/></div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:20}}>
          <button onClick={()=>setContactModal(false)} style={btnSm}>取消</button>
          <button onClick={saveContact} disabled={contactSaving} style={{...btnPrimary,opacity:contactSaving?0.6:1}}>{contactSaving?"儲存中...":editingContact?"更新":"建立"}</button>
        </div>
      </div></div>)}
    </DashboardLayout>
  );
}