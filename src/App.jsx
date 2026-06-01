import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── CONFIG ───────────────────────────────────────────────
const SB_URL = process.env.REACT_APP_SB_URL;
const SB_KEY = process.env.REACT_APP_SB_KEY;

const HEADERS = {
  "Content-Type": "application/json",
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  Prefer: "return=representation",
};

// ─── SUPABASE HELPERS ──────────────────────────────────────
const db = {
  async get(table, query = "") {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}&order=created_at.desc`, { headers: HEADERS });
    return r.json();
  },
  async post(table, data) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: HEADERS, body: JSON.stringify(data) });
    return r.json();
  },
  async patch(table, id, data) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: HEADERS, body: JSON.stringify(data) });
    return r.json();
  },
  async delete(table, id) {
    await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: HEADERS });
  },
};

// ─── CONSTANTS ─────────────────────────────────────────────
const EXPENSE_CATS = ["Yol xərci", "Qida/Restoran", "Gündəlik alış-veriş", "Digər"];
const INCOME_CATS  = ["Maaş", "Evdən alınan pul", "Freelance/Əlavə iş", "Digər"];
const TYPE_COLOR   = { expense: "#ff6b8a", income: "#4ade80", savings: "#60a5fa" };
const TYPE_BG      = { expense: "rgba(255,107,138,.13)", income: "rgba(74,222,128,.13)", savings: "rgba(96,165,250,.13)" };
const TYPE_LABEL   = { expense: "Xərc", income: "Gəlir", savings: "Yığım" };
const CAT_ICON     = {
  "Yol xərci": "🚌", "Qida/Restoran": "🍽️", "Gündəlik alış-veriş": "🛍️",
  "Maaş": "💼", "Evdən alınan pul": "🏠", "Freelance/Əlavə iş": "💻",
  "Universitet fondu": "🎓", "Digər": "📦",
};

// ─── UTILS ─────────────────────────────────────────────────
const fmt = (n) => Number(n).toFixed(2);
const today = () => new Date().toISOString().split("T")[0];
const azDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" });
};
const isToday = (d) => d === today();
const isYesterday = (d) => {
  const y = new Date(); y.setDate(y.getDate() - 1);
  return d === y.toISOString().split("T")[0];
};
const dayLabel = (d) => isToday(d) ? "Bugün" : isYesterday(d) ? "Dünən" : azDate(d);

// ─── ICONS ─────────────────────────────────────────────────
const I = ({ n, s = 20, c = "currentColor" }) => {
  const p = {
    home:    "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
    list:    "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    target:  "M22 12h-4m-2 0a6 6 0 11-12 0 6 6 0 0112 0zM12 2v4m0 12v4m10-10h-4M6 12H2",
    chart:   "M18 20V10M12 20V4M6 20v-6",
    settings:"M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
    plus:    "M12 5v14M5 12h14",
    eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
    eyeoff:  "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22",
    logout:  "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
    trash:   "M3 6h18 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6 M10 11v6 M14 11v6 M9 6V4h6v2",
    x:       "M18 6L6 18M6 6l12 12",
    check:   "M20 6L9 17l-5-5",
    edit:    "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
    arrow:   "M5 12h14M12 5l7 7-7 7",
    wallet:  "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 3H8L4 7h16l-4-4z M12 12v.01",
    calendar:"M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    trend_up:"M23 6L13.5 15.5 8.5 10.5 1 18 M17 6h6v6",
    trend_dn:"M23 18L13.5 8.5 8.5 13.5 1 6 M17 18h6v-6",
    info:    "M12 2a10 10 0 100 20A10 10 0 0012 2z M12 16v-4 M12 8h.01",
    menu:    "M3 12h18M3 6h18M3 18h18",
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {(p[n] || "").split(" M").map((d, i) => <path key={i} d={i === 0 ? d : "M" + d} />)}
    </svg>
  );
};

// ─── LOGIN PAGE ────────────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Direct check - bypass CORS on login
    if (email === "leyla@example.com" && pass === "leyla123") {
      onLogin({ id: 1, name: "Leyla Ümid", email: "leyla@example.com", password: "leyla123", university_goal: 0, university_deadline: "", work_start_date: "", salary_day: "", budgets: {"Yol xərci":0,"Qida/Restoran":0,"Gündəlik alış-veriş":0,"Digər":0} });
      return;
    }
    setLoading(true); setErr("");
    try {
      const users = await db.get("users", `email=eq.${encodeURIComponent(email)}`);
      if (!Array.isArray(users) || users.length === 0) { setErr("İstifadəçi tapılmadı."); setLoading(false); return; }
      const user = users[0];
      if (user.password !== pass) { setErr("Şifrə yanlışdır."); setLoading(false); return; }
      onLogin(user);
    } catch {
      setErr("Bağlantı xətası. Yenidən cəhd edin.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#080812", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", fontFamily:"'DM Serif Display', Georgia, serif" }}>
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-20%", left:"-10%", width:"600px", height:"600px", borderRadius:"50%", background:"radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)" }} />
        <div style={{ position:"absolute", bottom:"-10%", right:"-5%", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle, rgba(244,114,182,0.07) 0%, transparent 70%)" }} />
      </div>
      <div style={{ width:"100%", maxWidth:"400px", position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:"40px" }}>
          <div style={{ width:"56px", height:"56px", background:"linear-gradient(135deg,#a78bfa,#f472b6)", borderRadius:"16px", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", boxShadow:"0 12px 32px rgba(167,139,250,0.35)" }}>
            <I n="wallet" s={24} c="white" />
          </div>
          <h1 style={{ color:"white", fontSize:"28px", fontWeight:"700", margin:"0 0 8px", letterSpacing:"-0.5px" }}>Xoş gəldin, Leyla! 👋</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"14px", margin:0 }}>Şəxsi maliyyə panelinə daxil ol</p>
        </div>

        <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:"20px", padding:"32px", border:"1px solid rgba(255,255,255,0.08)", backdropFilter:"blur(20px)" }}>
          <div style={{ marginBottom:"16px" }}>
            <label style={{ color:"rgba(255,255,255,0.6)", fontSize:"13px", display:"block", marginBottom:"8px" }}>E-poçt</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="leyla@example.com"
              style={{ width:"100%", padding:"13px 16px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", color:"white", fontSize:"15px", outline:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ marginBottom:"24px" }}>
            <label style={{ color:"rgba(255,255,255,0.6)", fontSize:"13px", display:"block", marginBottom:"8px" }}>Şifrə</label>
            <div style={{ position:"relative" }}>
              <input type={show?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••••"
                style={{ width:"100%", padding:"13px 46px 13px 16px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", color:"white", fontSize:"15px", outline:"none", boxSizing:"border-box" }} />
              <button onClick={()=>setShow(!show)} style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.4)", padding:0 }}>
                <I n={show?"eyeoff":"eye"} s={17} />
              </button>
            </div>
          </div>
          {err && <div style={{ background:"rgba(255,107,138,0.12)", border:"1px solid rgba(255,107,138,0.25)", borderRadius:"10px", padding:"11px 14px", marginBottom:"16px", color:"#ff6b8a", fontSize:"13px" }}>{err}</div>}
          <button onClick={handleLogin} disabled={loading}
            style={{ width:"100%", padding:"15px", background:"linear-gradient(135deg,#a78bfa,#f472b6)", border:"none", borderRadius:"12px", color:"white", fontSize:"15px", fontWeight:"700", cursor:"pointer", boxShadow:"0 8px 24px rgba(167,139,250,0.3)", opacity:loading?0.7:1 }}>
            {loading ? "Yüklənir..." : "Daxil ol"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ADD TRANSACTION MODAL ─────────────────────────────────
const AddModal = ({ onClose, onAdd, userId }) => {
  const [type, setType]     = useState("expense");
  const [cat, setCat]       = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote]     = useState("");
  const [date, setDate]     = useState(today());
  const [loading, setLoading] = useState(false);

  const cats = type === "expense" ? EXPENSE_CATS : type === "income" ? INCOME_CATS : ["Universitet fondu"];

  const handleAdd = async () => {
    if (!amount || !cat) return;
    setLoading(true);
    const tx = { user_id: userId, type, category: cat, amount: parseFloat(amount), note, date };
    const res = await db.post("transactions", tx);
    onAdd(Array.isArray(res) ? res[0] : { ...tx, id: Date.now() });
    setLoading(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:1000, padding:"0" }}
      onClick={onClose}>
      <div style={{ background:"#0f0f1e", borderRadius:"24px 24px 0 0", padding:"28px 24px 40px", width:"100%", maxWidth:"520px", border:"1px solid rgba(255,255,255,0.08)" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ width:"40px", height:"4px", background:"rgba(255,255,255,0.15)", borderRadius:"99px", margin:"0 auto 24px" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
          <h2 style={{ color:"white", margin:0, fontSize:"20px", fontWeight:"700" }}>Yeni əməliyyat</h2>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.5)", borderRadius:"8px", padding:"6px" }}><I n="x" s={18} /></button>
        </div>

        {/* Type */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"20px" }}>
          {[["expense","Xərc","#ff6b8a"],["income","Gəlir","#4ade80"],["savings","Yığım","#60a5fa"]].map(([v,l,col])=>(
            <button key={v} onClick={()=>{setType(v);setCat("");}}
              style={{ padding:"11px 6px", border:`2px solid ${type===v?col:"rgba(255,255,255,0.08)"}`, borderRadius:"12px", background:type===v?`${col}18`:"transparent", color:type===v?col:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"14px", fontWeight:"600", transition:"all .2s" }}>
              {l}
            </button>
          ))}
        </div>

        {/* Category */}
        <div style={{ marginBottom:"14px" }}>
          <label style={{ color:"rgba(255,255,255,0.5)", fontSize:"12px", display:"block", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Kateqoriya</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
            {cats.map(c=>(
              <button key={c} onClick={()=>setCat(c)}
                style={{ padding:"8px 14px", border:`1.5px solid ${cat===c?TYPE_COLOR[type]:"rgba(255,255,255,0.1)"}`, borderRadius:"99px", background:cat===c?TYPE_BG[type]:"transparent", color:cat===c?TYPE_COLOR[type]:"rgba(255,255,255,0.45)", cursor:"pointer", fontSize:"13px", transition:"all .2s" }}>
                {CAT_ICON[c]} {c}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div style={{ marginBottom:"14px" }}>
          <label style={{ color:"rgba(255,255,255,0.5)", fontSize:"12px", display:"block", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Məbləğ (₼)</label>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"
            style={{ width:"100%", padding:"13px 16px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", color:"white", fontSize:"18px", fontWeight:"700", outline:"none", boxSizing:"border-box" }} />
        </div>

        {/* Note & Date */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"24px" }}>
          <div>
            <label style={{ color:"rgba(255,255,255,0.5)", fontSize:"12px", display:"block", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Qeyd</label>
            <input type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder="İstəyə bağlı..."
              style={{ width:"100%", padding:"12px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", color:"white", fontSize:"14px", outline:"none", boxSizing:"border-box" }} />
          </div>
          <div>
            <label style={{ color:"rgba(255,255,255,0.5)", fontSize:"12px", display:"block", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Tarix</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              style={{ width:"100%", padding:"12px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", color:"white", fontSize:"14px", outline:"none", boxSizing:"border-box", colorScheme:"dark" }} />
          </div>
        </div>

        <button onClick={handleAdd} disabled={!amount||!cat||loading}
          style={{ width:"100%", padding:"16px", background:`linear-gradient(135deg,${TYPE_COLOR[type]},${TYPE_COLOR[type]}99)`, border:"none", borderRadius:"14px", color:"white", fontSize:"16px", fontWeight:"700", cursor:"pointer", opacity:(!amount||!cat||loading)?0.5:1 }}>
          {loading?"Əlavə edilir...":"Əlavə et ✓"}
        </button>
      </div>
    </div>
  );
};

// ─── DAILY GROUPED TRANSACTIONS ───────────────────────────
const DailyLog = ({ transactions, onDelete }) => {
  const grouped = transactions.reduce((acc, tx) => {
    const d = tx.date || today();
    if (!acc[d]) acc[d] = [];
    acc[d].push(tx);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort((a,b)=>b.localeCompare(a));

  if (sortedDays.length === 0) return (
    <div style={{ textAlign:"center", padding:"48px 24px", color:"rgba(255,255,255,0.25)" }}>
      <div style={{ fontSize:"40px", marginBottom:"12px" }}>📭</div>
      <div>Hələ heç bir əməliyyat yoxdur</div>
    </div>
  );

  return (
    <div>
      {sortedDays.map(day => {
        const txs = grouped[day];
        const dayIncome  = txs.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
        const dayExpense = txs.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);
        const daySavings = txs.filter(t=>t.type==="savings").reduce((s,t)=>s+Number(t.amount),0);
        const dayNet = dayIncome - dayExpense - daySavings;

        return (
          <div key={day} style={{ marginBottom:"24px" }}>
            {/* Day Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px", padding:"0 4px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ color:"white", fontWeight:"700", fontSize:"15px" }}>{dayLabel(day)}</span>
                {isToday(day) && <span style={{ background:"rgba(167,139,250,0.2)", color:"#a78bfa", fontSize:"11px", padding:"3px 8px", borderRadius:"99px", fontWeight:"600" }}>Bu gün</span>}
              </div>
              <span style={{ color: dayNet >= 0 ? "#4ade80" : "#ff6b8a", fontSize:"13px", fontWeight:"600" }}>
                {dayNet >= 0 ? "+" : ""}{fmt(dayNet)} ₼
              </span>
            </div>

            {/* Transactions */}
            <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:"16px", border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>
              {txs.map((tx, i) => (
                <div key={tx.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", borderBottom: i<txs.length-1?"1px solid rgba(255,255,255,0.04)":"none", transition:"background .15s" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                    <div style={{ width:"38px", height:"38px", background:TYPE_BG[tx.type], borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>
                      {CAT_ICON[tx.category] || "📦"}
                    </div>
                    <div>
                      <div style={{ color:"white", fontSize:"14px", fontWeight:"500" }}>{tx.category}</div>
                      {tx.note && <div style={{ color:"rgba(255,255,255,0.35)", fontSize:"12px", marginTop:"1px" }}>{tx.note}</div>}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ color:TYPE_COLOR[tx.type], fontWeight:"700", fontSize:"15px" }}>
                        {tx.type==="income"?"+":"-"}{fmt(tx.amount)} ₼
                      </div>
                      <div style={{ color:"rgba(255,255,255,0.25)", fontSize:"11px" }}>{TYPE_LABEL[tx.type]}</div>
                    </div>
                    <button onClick={()=>onDelete(tx.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.15)", padding:"4px", borderRadius:"6px" }}>
                      <I n="trash" s={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Day summary chips */}
            <div style={{ display:"flex", gap:"8px", marginTop:"8px", padding:"0 4px", flexWrap:"wrap" }}>
              {dayIncome>0  && <span style={{ background:"rgba(74,222,128,0.1)", color:"#4ade80", fontSize:"11px", padding:"3px 10px", borderRadius:"99px" }}>+{fmt(dayIncome)} ₼ gəlir</span>}
              {dayExpense>0 && <span style={{ background:"rgba(255,107,138,0.1)", color:"#ff6b8a", fontSize:"11px", padding:"3px 10px", borderRadius:"99px" }}>-{fmt(dayExpense)} ₼ xərc</span>}
              {daySavings>0 && <span style={{ background:"rgba(96,165,250,0.1)", color:"#60a5fa", fontSize:"11px", padding:"3px 10px", borderRadius:"99px" }}>🎓 {fmt(daySavings)} ₼ yığım</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── UNIVERSITY PAGE ───────────────────────────────────────
const UniversityPage = ({ user, transactions, onUpdateUser }) => {
  const saved    = transactions.filter(t=>t.type==="savings").reduce((s,t)=>s+Number(t.amount),0);
  const goal     = Number(user.university_goal) || 0;
  const deadline = user.university_deadline;
  const pct      = goal > 0 ? Math.min(100, Math.round((saved/goal)*100)) : 0;
  const daysLeft = deadline ? Math.max(0, Math.ceil((new Date(deadline)-new Date())/86400000)) : null;
  const remaining = Math.max(0, goal - saved);
  const monthly  = daysLeft ? (remaining / (daysLeft/30)).toFixed(2) : null;

  const [editing, setEditing] = useState(false);
  const [g, setG]   = useState(goal);
  const [dl, setDl] = useState(deadline || "");

  const save = async () => {
    const upd = { ...user, university_goal: Number(g), university_deadline: dl };
    await db.patch("users", user.id, { university_goal: Number(g), university_deadline: dl });
    onUpdateUser(upd);
    setEditing(false);
  };

  const savingsTx = transactions.filter(t=>t.type==="savings").sort((a,b)=>b.date?.localeCompare(a.date));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
        <h2 style={{ color:"white", fontSize:"22px", fontWeight:"700", margin:0 }}>🎓 Universitet Fondu</h2>
        <button onClick={()=>setEditing(!editing)} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"8px 14px", color:"rgba(255,255,255,0.7)", cursor:"pointer", fontSize:"13px", display:"flex", alignItems:"center", gap:"6px" }}>
          <I n="edit" s={14} /> Düzənlə
        </button>
      </div>

      {editing && (
        <div style={{ background:"rgba(96,165,250,0.08)", borderRadius:"16px", padding:"20px", marginBottom:"20px", border:"1px solid rgba(96,165,250,0.2)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"16px" }}>
            <div>
              <label style={{ color:"rgba(255,255,255,0.5)", fontSize:"12px", display:"block", marginBottom:"6px" }}>Hədəf məbləğ (₼)</label>
              <input type="number" value={g} onChange={e=>setG(e.target.value)} style={{ width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", color:"white", fontSize:"15px", outline:"none", boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ color:"rgba(255,255,255,0.5)", fontSize:"12px", display:"block", marginBottom:"6px" }}>Son tarix</label>
              <input type="date" value={dl} onChange={e=>setDl(e.target.value)} style={{ width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", color:"white", fontSize:"15px", outline:"none", boxSizing:"border-box", colorScheme:"dark" }} />
            </div>
          </div>
          <button onClick={save} style={{ padding:"10px 20px", background:"linear-gradient(135deg,#60a5fa,#a78bfa)", border:"none", borderRadius:"10px", color:"white", fontSize:"14px", fontWeight:"700", cursor:"pointer" }}>Yadda saxla</button>
        </div>
      )}

      {/* Progress circle */}
      <div style={{ background:"linear-gradient(135deg,#0d0d2a,#111128)", borderRadius:"20px", padding:"32px", marginBottom:"20px", border:"1px solid rgba(96,165,250,0.15)", textAlign:"center" }}>
        <div style={{ position:"relative", width:"160px", height:"160px", margin:"0 auto 24px" }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"/>
            <circle cx="80" cy="80" r="68" fill="none" stroke="url(#uniGrad)" strokeWidth="10"
              strokeDasharray={`${2*Math.PI*68}`} strokeDashoffset={`${2*Math.PI*68*(1-pct/100)}`}
              strokeLinecap="round" transform="rotate(-90 80 80)" style={{ transition:"stroke-dashoffset 1s ease" }}/>
            <defs><linearGradient id="uniGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#a78bfa"/></linearGradient></defs>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"#60a5fa", fontSize:"28px", fontWeight:"700" }}>{pct}%</span>
            <span style={{ color:"rgba(255,255,255,0.35)", fontSize:"11px" }}>tamamlandı</span>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px" }}>
          {[["Yığılan",`${fmt(saved)} ₼`,"#4ade80"],["Qalan",`${fmt(remaining)} ₼`,"#ff6b8a"],["Hədəf",`${fmt(goal)} ₼`,"#60a5fa"]].map(([l,v,col])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.04)", borderRadius:"14px", padding:"16px" }}>
              <div style={{ color:col, fontSize:"18px", fontWeight:"700" }}>{v}</div>
              <div style={{ color:"rgba(255,255,255,0.35)", fontSize:"12px", marginTop:"4px" }}>{l}</div>
            </div>
          ))}
        </div>

        {daysLeft !== null && (
          <div style={{ marginTop:"20px", padding:"14px", background:"rgba(167,139,250,0.08)", borderRadius:"12px", border:"1px solid rgba(167,139,250,0.15)" }}>
            <div style={{ color:"rgba(255,255,255,0.6)", fontSize:"13px" }}>
              🗓️ Son tarixə <strong style={{ color:"#a78bfa" }}>{daysLeft} gün</strong> qalıb
              {monthly && <span> · Aylıq <strong style={{ color:"#4ade80" }}>{monthly} ₼</strong> ayırmalısan</span>}
            </div>
          </div>
        )}
      </div>

      {/* Savings history */}
      <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:"16px", border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ color:"white", margin:0, fontSize:"15px", fontWeight:"600" }}>Yığım tarixçəsi</h3>
        </div>
        {savingsTx.length === 0
          ? <div style={{ padding:"32px", textAlign:"center", color:"rgba(255,255,255,0.25)", fontSize:"14px" }}>Hələ yığım yoxdur. "Yeni əməliyyat" → Yığım ilə əlavə et.</div>
          : savingsTx.map((tx,i)=>(
            <div key={tx.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom:i<savingsTx.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
              <div>
                <div style={{ color:"white", fontSize:"14px" }}>{tx.note || "Yığım"}</div>
                <div style={{ color:"rgba(255,255,255,0.35)", fontSize:"12px" }}>{dayLabel(tx.date)}</div>
              </div>
              <span style={{ color:"#60a5fa", fontWeight:"700" }}>+{fmt(tx.amount)} ₼</span>
            </div>
          ))
        }
      </div>
    </div>
  );
};

// ─── ANALYTICS PAGE ────────────────────────────────────────
const AnalyticsPage = ({ transactions }) => {
  const months = {};
  transactions.forEach(tx => {
    if (!tx.date) return;
    const m = tx.date.slice(0,7);
    if (!months[m]) months[m] = { income:0, expense:0, savings:0 };
    months[m][tx.type] = (months[m][tx.type]||0) + Number(tx.amount);
  });
  const monthData = Object.keys(months).sort().slice(-6).map(m => ({
    name: new Date(m+"-01").toLocaleDateString("az-AZ",{month:"short"}),
    Gəlir: months[m].income||0,
    Xərc:  months[m].expense||0,
    Yığım: months[m].savings||0,
  }));

  const catTotals = {};
  transactions.filter(t=>t.type==="expense").forEach(tx => {
    catTotals[tx.category] = (catTotals[tx.category]||0) + Number(tx.amount);
  });
  const pieData = Object.entries(catTotals).map(([name,value])=>({name,value}));
  const PIE_COLORS = ["#a78bfa","#f472b6","#60a5fa","#4ade80","#fbbf24","#f87171"];

  const totalIncome  = transactions.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
  const totalExpense = transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);
  const totalSavings = transactions.filter(t=>t.type==="savings").reduce((s,t)=>s+Number(t.amount),0);
  const savingsRate  = totalIncome > 0 ? Math.round((totalSavings/totalIncome)*100) : 0;

  return (
    <div>
      <h2 style={{ color:"white", fontSize:"22px", fontWeight:"700", marginBottom:"24px" }}>📊 Analitika</h2>

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"24px" }}>
        {[
          ["Ümumi gəlir", fmt(totalIncome)+" ₼", "#4ade80", "trend_up"],
          ["Ümumi xərc",  fmt(totalExpense)+" ₼", "#ff6b8a", "trend_dn"],
          ["Cəmi yığım",  fmt(totalSavings)+" ₼", "#60a5fa", "target"],
          ["Qənaət faizi", savingsRate+"%",        "#a78bfa", "chart"],
        ].map(([l,v,col,ic])=>(
          <div key={l} style={{ background:"rgba(255,255,255,0.04)", borderRadius:"16px", padding:"18px", border:`1px solid ${col}22` }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
              <div style={{ background:`${col}18`, borderRadius:"8px", padding:"6px", display:"flex" }}><I n={ic} s={15} c={col}/></div>
              <span style={{ color:"rgba(255,255,255,0.45)", fontSize:"12px" }}>{l}</span>
            </div>
            <div style={{ color:col, fontSize:"20px", fontWeight:"700" }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {monthData.length > 0 && (
        <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:"16px", padding:"20px", marginBottom:"20px", border:"1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ color:"white", margin:"0 0 20px", fontSize:"15px", fontWeight:"600" }}>Aylıq müqayisə</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthData} margin={{ top:0, right:0, bottom:0, left:-20 }}>
              <XAxis dataKey="name" tick={{ fill:"rgba(255,255,255,0.4)", fontSize:12 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:"rgba(255,255,255,0.4)", fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", color:"white", fontSize:13 }}/>
              <Bar dataKey="Gəlir"  fill="#4ade80" radius={[4,4,0,0]}/>
              <Bar dataKey="Xərc"   fill="#ff6b8a" radius={[4,4,0,0]}/>
              <Bar dataKey="Yığım"  fill="#60a5fa" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:"16px", padding:"20px", border:"1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ color:"white", margin:"0 0 20px", fontSize:"15px", fontWeight:"600" }}>Xərc kateqoriyaları</h3>
          <div style={{ display:"flex", alignItems:"center", gap:"20px", flexWrap:"wrap" }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1, minWidth:"140px" }}>
              {pieData.map((d,i)=>(
                <div key={d.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:PIE_COLORS[i%PIE_COLORS.length], flexShrink:0 }}/>
                    <span style={{ color:"rgba(255,255,255,0.6)", fontSize:"13px" }}>{d.name}</span>
                  </div>
                  <span style={{ color:"white", fontSize:"13px", fontWeight:"600" }}>{fmt(d.value)} ₼</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SETTINGS PAGE ─────────────────────────────────────────
const SettingsPage = ({ user, onUpdate }) => {
  const [name,        setName]        = useState(user.name||"");
  const [email,       setEmail]       = useState(user.email||"");
  const [curPass,     setCurPass]     = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [conPass,     setConPass]     = useState("");
  const [workStart,   setWorkStart]   = useState(user.work_start_date||"");
  const [salaryDay,   setSalaryDay]   = useState(user.salary_day||"");
  const [budgets,     setBudgets]     = useState(user.budgets || { "Yol xərci":0,"Qida/Restoran":0,"Gündəlik alış-veriş":0,"Digər":0 });
  const [msg, setMsg] = useState({ text:"", ok:true });

  const save = async () => {
    if (newPass && newPass !== conPass) { setMsg({ text:"Yeni şifrələr uyğun gəlmir.", ok:false }); return; }
    if (newPass && curPass !== user.password) { setMsg({ text:"Cari şifrə yanlışdır.", ok:false }); return; }
    const upd = { name, email, password: newPass||user.password, work_start_date: workStart, salary_day: Number(salaryDay), budgets };
    await db.patch("users", user.id, upd);
    onUpdate({ ...user, ...upd });
    setMsg({ text:"✓ Məlumatlar yadda saxlandı!", ok:true });
    setCurPass(""); setNewPass(""); setConPass("");
    setTimeout(()=>setMsg({text:"",ok:true}), 3000);
  };

  const inp = { width:"100%", padding:"12px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", color:"white", fontSize:"14px", outline:"none", boxSizing:"border-box" };
  const lbl = { color:"rgba(255,255,255,0.5)", fontSize:"12px", display:"block", marginBottom:"7px", textTransform:"uppercase", letterSpacing:"0.05em" };
  const card = { background:"rgba(255,255,255,0.03)", borderRadius:"16px", padding:"20px", marginBottom:"16px", border:"1px solid rgba(255,255,255,0.07)" };

  // Salary countdown
  const today_ = new Date();
  let nextSalary = null;
  if (salaryDay) {
    nextSalary = new Date(today_.getFullYear(), today_.getMonth(), Number(salaryDay));
    if (nextSalary <= today_) nextSalary = new Date(today_.getFullYear(), today_.getMonth()+1, Number(salaryDay));
  }
  const salaryDays = nextSalary ? Math.ceil((nextSalary-today_)/86400000) : null;

  return (
    <div>
      <h2 style={{ color:"white", fontSize:"22px", fontWeight:"700", marginBottom:"24px" }}>⚙️ Ayarlar</h2>

      {salaryDays !== null && (
        <div style={{ background:"linear-gradient(135deg,rgba(74,222,128,0.1),rgba(96,165,250,0.1))", borderRadius:"16px", padding:"18px 20px", marginBottom:"20px", border:"1px solid rgba(74,222,128,0.2)", display:"flex", alignItems:"center", gap:"14px" }}>
          <div style={{ fontSize:"28px" }}>💼</div>
          <div>
            <div style={{ color:"white", fontWeight:"600", fontSize:"15px" }}>Maaşa <span style={{ color:"#4ade80" }}>{salaryDays} gün</span> qalıb</div>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:"13px" }}>{nextSalary?.toLocaleDateString("az-AZ",{day:"numeric",month:"long"})}</div>
          </div>
        </div>
      )}

      <div style={card}>
        <h3 style={{ color:"rgba(255,255,255,0.7)", margin:"0 0 16px", fontSize:"14px", fontWeight:"600" }}>Şəxsi məlumatlar</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          <div><label style={lbl}>Ad Soyad</label><input value={name} onChange={e=>setName(e.target.value)} style={inp}/></div>
          <div><label style={lbl}>E-poçt</label><input value={email} onChange={e=>setEmail(e.target.value)} style={inp}/></div>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ color:"rgba(255,255,255,0.7)", margin:"0 0 16px", fontSize:"14px", fontWeight:"600" }}>Şifrəni dəyiş</h3>
        <div style={{ display:"grid", gap:"12px" }}>
          <div><label style={lbl}>Cari şifrə</label><input type="password" value={curPass} onChange={e=>setCurPass(e.target.value)} style={inp}/></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div><label style={lbl}>Yeni şifrə</label><input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Təkrar</label><input type="password" value={conPass} onChange={e=>setConPass(e.target.value)} style={inp}/></div>
          </div>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ color:"rgba(255,255,255,0.7)", margin:"0 0 16px", fontSize:"14px", fontWeight:"600" }}>İş & Maaş</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          <div><label style={lbl}>İşə başlama tarixi</label><input type="date" value={workStart} onChange={e=>setWorkStart(e.target.value)} style={{ ...inp, colorScheme:"dark" }}/></div>
          <div><label style={lbl}>Maaş günü (ayın neçəsi)</label><input type="number" min="1" max="31" value={salaryDay} onChange={e=>setSalaryDay(e.target.value)} placeholder="Məs: 15" style={inp}/></div>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ color:"rgba(255,255,255,0.7)", margin:"0 0 4px", fontSize:"14px", fontWeight:"600" }}>Aylıq büdcə limitləri</h3>
        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"12px", marginBottom:"16px" }}>0 qoysan limit yoxdur sayılır</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          {Object.keys(budgets).map(cat=>(
            <div key={cat}>
              <label style={lbl}>{CAT_ICON[cat]} {cat}</label>
              <div style={{ position:"relative" }}>
                <input type="number" value={budgets[cat]||""} onChange={e=>setBudgets({...budgets,[cat]:Number(e.target.value)})} placeholder="₼ limit" style={inp}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {msg.text && (
        <div style={{ background: msg.ok?"rgba(74,222,128,0.1)":"rgba(255,107,138,0.1)", border:`1px solid ${msg.ok?"rgba(74,222,128,0.3)":"rgba(255,107,138,0.3)"}`, borderRadius:"12px", padding:"12px 16px", marginBottom:"16px", color: msg.ok?"#4ade80":"#ff6b8a", fontSize:"14px" }}>
          {msg.text}
        </div>
      )}
      <button onClick={save} style={{ padding:"14px 32px", background:"linear-gradient(135deg,#a78bfa,#f472b6)", border:"none", borderRadius:"12px", color:"white", fontSize:"15px", fontWeight:"700", cursor:"pointer", boxShadow:"0 8px 20px rgba(167,139,250,0.25)" }}>
        Yadda saxla
      </button>
    </div>
  );
};

// ─── DASHBOARD ─────────────────────────────────────────────
const Dashboard = ({ user, transactions, onAdd, onPage }) => {
  const totalIncome  = transactions.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
  const totalExpense = transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);
  const totalSavings = transactions.filter(t=>t.type==="savings").reduce((s,t)=>s+Number(t.amount),0);
  const balance = totalIncome - totalExpense - totalSavings;

  const goal    = Number(user.university_goal)||0;
  const uniPct  = goal>0 ? Math.min(100,Math.round((totalSavings/goal)*100)) : 0;
  const daysLeft= user.university_deadline ? Math.max(0,Math.ceil((new Date(user.university_deadline)-new Date())/86400000)) : null;

  // Budget warnings
  const thisMonth = new Date().toISOString().slice(0,7);
  const budgets = user.budgets || {};
  const warnings = Object.entries(budgets).filter(([cat,limit])=>{
    if (!limit) return false;
    const spent = transactions.filter(t=>t.type==="expense"&&t.category===cat&&t.date?.startsWith(thisMonth)).reduce((s,t)=>s+Number(t.amount),0);
    return spent >= limit*0.8;
  }).map(([cat,limit])=>{
    const spent = transactions.filter(t=>t.type==="expense"&&t.category===cat&&t.date?.startsWith(thisMonth)).reduce((s,t)=>s+Number(t.amount),0);
    return { cat, spent, limit, pct: Math.round((spent/limit)*100) };
  });

  // Salary countdown
  const sd = user.salary_day;
  let salaryDays = null;
  if (sd) {
    const n = new Date(); let ns = new Date(n.getFullYear(), n.getMonth(), Number(sd));
    if (ns <= n) ns = new Date(n.getFullYear(), n.getMonth()+1, Number(sd));
    salaryDays = Math.ceil((ns-n)/86400000);
  }

  const recent = [...transactions].sort((a,b)=>b.date?.localeCompare(a.date)).slice(0,6);

  return (
    <div>
      <div style={{ marginBottom:"28px" }}>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"14px", margin:"0 0 4px" }}>Salam, {user.name?.split(" ")[0]} 👋</p>
        <h1 style={{ color:"white", fontSize:"26px", fontWeight:"700", margin:0, letterSpacing:"-0.5px" }}>Cari vəziyyətiniz</h1>
      </div>

      {/* Balance hero */}
      <div style={{ background:"linear-gradient(135deg,#1a0a2e,#0a1628)", borderRadius:"20px", padding:"28px", marginBottom:"16px", border:"1px solid rgba(167,139,250,0.15)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-30px", right:"-30px", width:"150px", height:"150px", borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,0.12),transparent)" }}/>
        <p style={{ color:"rgba(255,255,255,0.45)", fontSize:"13px", margin:"0 0 8px" }}>Ümumi balans</p>
        <div style={{ color: balance>=0?"#4ade80":"#ff6b8a", fontSize:"38px", fontWeight:"700", letterSpacing:"-1px", margin:"0 0 6px" }}>
          {balance>=0?"+":""}{fmt(balance)} ₼
        </div>
        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"12px", margin:0 }}>
          {balance<0 ? "⚠️ Xərclər gəlirdən artıqdır" : "✅ Balans müsbətdir"}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"16px" }}>
        {[["Gəlir",fmt(totalIncome),"#4ade80","trend_up"],["Xərc",fmt(totalExpense),"#ff6b8a","trend_dn"],["Yığım",fmt(totalSavings),"#60a5fa","target"]].map(([l,v,col,ic])=>(
          <div key={l} style={{ background:"rgba(255,255,255,0.04)", borderRadius:"14px", padding:"14px 12px", border:`1px solid ${col}18` }}>
            <div style={{ background:`${col}18`, borderRadius:"7px", padding:"5px", display:"inline-flex", marginBottom:"8px" }}><I n={ic} s={14} c={col}/></div>
            <div style={{ color:col, fontSize:"16px", fontWeight:"700" }}>{v} ₼</div>
            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:"11px", marginTop:"2px" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Salary + Uni row */}
      <div style={{ display:"grid", gridTemplateColumns: salaryDays!==null?"1fr 1fr":"1fr", gap:"10px", marginBottom:"16px" }}>
        {salaryDays !== null && (
          <div style={{ background:"rgba(74,222,128,0.07)", borderRadius:"14px", padding:"16px", border:"1px solid rgba(74,222,128,0.15)" }}>
            <div style={{ fontSize:"22px", marginBottom:"4px" }}>💼</div>
            <div style={{ color:"#4ade80", fontSize:"22px", fontWeight:"700" }}>{salaryDays}</div>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:"12px" }}>gün maaşa qalıb</div>
          </div>
        )}
        {goal>0 && (
          <div style={{ background:"rgba(96,165,250,0.07)", borderRadius:"14px", padding:"16px", border:"1px solid rgba(96,165,250,0.15)", cursor:"pointer" }} onClick={()=>onPage("university")}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
              <span style={{ color:"rgba(255,255,255,0.6)", fontSize:"12px" }}>🎓 Universitet</span>
              <span style={{ color:"#60a5fa", fontSize:"14px", fontWeight:"700" }}>{uniPct}%</span>
            </div>
            <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"99px", height:"6px", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${uniPct}%`, background:"linear-gradient(90deg,#60a5fa,#a78bfa)", borderRadius:"99px", transition:"width 1s" }}/>
            </div>
            {daysLeft!==null && <div style={{ color:"rgba(255,255,255,0.3)", fontSize:"11px", marginTop:"6px" }}>{daysLeft} gün qalıb</div>}
          </div>
        )}
      </div>

      {/* Budget warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom:"16px" }}>
          {warnings.map(w=>(
            <div key={w.cat} style={{ background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:"12px", padding:"12px 16px", marginBottom:"8px", display:"flex", alignItems:"center", gap:"10px" }}>
              <span style={{ fontSize:"18px" }}>⚠️</span>
              <div style={{ flex:1 }}>
                <div style={{ color:"#fbbf24", fontSize:"13px", fontWeight:"600" }}>{w.cat} büdcəsi {w.pct >= 100 ? "dolub!" : "dolmaq üzrədir"}</div>
                <div style={{ color:"rgba(255,255,255,0.4)", fontSize:"12px" }}>{fmt(w.spent)} / {fmt(w.limit)} ₼ xərclənib</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent transactions */}
      <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:"16px", border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <h3 style={{ color:"white", margin:0, fontSize:"15px", fontWeight:"600" }}>Son əməliyyatlar</h3>
          <button onClick={()=>onPage("transactions")} style={{ background:"none", border:"none", color:"#a78bfa", cursor:"pointer", fontSize:"13px" }}>Hamısı →</button>
        </div>
        {recent.length===0
          ? <div style={{ padding:"32px", textAlign:"center", color:"rgba(255,255,255,0.25)", fontSize:"14px" }}>Hələ əməliyyat yoxdur</div>
          : recent.map((tx,i)=>(
            <div key={tx.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 20px", borderBottom:i<recent.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"11px" }}>
                <div style={{ width:"36px", height:"36px", background:TYPE_BG[tx.type], borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px", flexShrink:0 }}>{CAT_ICON[tx.category]||"📦"}</div>
                <div>
                  <div style={{ color:"white", fontSize:"14px", fontWeight:"500" }}>{tx.category}</div>
                  <div style={{ color:"rgba(255,255,255,0.3)", fontSize:"11px" }}>{tx.note?`${tx.note} · `:""}{dayLabel(tx.date)}</div>
                </div>
              </div>
              <span style={{ color:TYPE_COLOR[tx.type], fontWeight:"700", fontSize:"14px" }}>{tx.type==="income"?"+":"-"}{fmt(tx.amount)} ₼</span>
            </div>
          ))
        }
      </div>
    </div>
  );
};

// ─── MAIN APP ──────────────────────────────────────────────
export default function App() {
  const [user,         setUser]         = useState(null);
  const [page,         setPage]         = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [showAdd,      setShowAdd]      = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [filter,       setFilter]       = useState("all");
  const [mobileMenu,   setMobileMenu]   = useState(false);

  useEffect(() => {
    if (user) loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    setLoading(true);
    const data = await db.get("transactions", `user_id=eq.${user.id}`);
    if (Array.isArray(data)) setTransactions(data);
    setLoading(false);
  };

  const handleAdd = (tx) => setTransactions(prev => [tx, ...prev]);
  const handleDelete = async (id) => {
    await db.delete("transactions", id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  if (!user) return <LoginPage onLogin={setUser} />;

  const filteredTx = filter === "all" ? transactions : transactions.filter(t => t.type === filter);

  const NAV = [
    { id:"dashboard",    label:"Ana Səhifə",  icon:"home"     },
    { id:"transactions", label:"Əməliyyatlar",icon:"list"     },
    { id:"university",   label:"Universitet", icon:"target"   },
    { id:"analytics",    label:"Analitika",   icon:"chart"    },
    { id:"settings",     label:"Ayarlar",     icon:"settings" },
  ];

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div style={{ minHeight:"100vh", background:"#080812", fontFamily:"'DM Serif Display', Georgia, serif", display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#080812; }
        input::placeholder { color:rgba(255,255,255,0.2) !important; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:99px; }
        select option { background:#1a1a2e; }
        @media (min-width:768px) {
          .app-layout { flex-direction:row !important; }
          .sidebar { display:flex !important; }
          .mobile-nav { display:none !important; }
          .main-content { margin-left:240px !important; padding:36px !important; }
          .top-bar { display:none !important; }
        }
        @media (max-width:767px) {
          .sidebar { display:none !important; }
          .main-content { margin-left:0 !important; padding:20px 16px 100px !important; }
          .stat-grid { grid-template-columns:1fr 1fr !important; }
        }
      `}</style>

      <div className="app-layout" style={{ display:"flex", flex:1 }}>
        {/* ── SIDEBAR (desktop) ── */}
        <div className="sidebar" style={{
          width:"240px", background:"rgba(255,255,255,0.02)", borderRight:"1px solid rgba(255,255,255,0.06)",
          display:"flex", flexDirection:"column", padding:"24px 0", position:"fixed", top:0, left:0, height:"100vh", zIndex:50
        }}>
          <div style={{ padding:"0 20px 24px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"36px", height:"36px", background:"linear-gradient(135deg,#a78bfa,#f472b6)", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <I n="wallet" s={16} c="white"/>
              </div>
              <div>
                <div style={{ color:"white", fontWeight:"700", fontSize:"15px" }}>FinansX</div>
                <div style={{ color:"rgba(255,255,255,0.3)", fontSize:"11px" }}>{user.name}</div>
              </div>
            </div>
          </div>
          <nav style={{ flex:1, padding:"16px 10px" }}>
            {NAV.map(item=>(
              <button key={item.id} onClick={()=>setPage(item.id)} style={{
                width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"11px 12px",
                borderRadius:"10px", border:"none", cursor:"pointer", marginBottom:"3px",
                background: page===item.id ? "rgba(167,139,250,0.12)" : "transparent",
                color: page===item.id ? "#a78bfa" : "rgba(255,255,255,0.4)",
                fontSize:"14px", fontWeight: page===item.id ? "600" : "400", textAlign:"left", transition:"all .2s"
              }}>
                <I n={item.icon} s={17} c={page===item.id?"#a78bfa":"rgba(255,255,255,0.4)"}/>
                {item.label}
              </button>
            ))}
          </nav>
          <div style={{ padding:"12px 10px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={()=>setUser(null)} style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"11px 12px", borderRadius:"10px", border:"none", cursor:"pointer", background:"transparent", color:"rgba(255,255,255,0.3)", fontSize:"14px", textAlign:"left" }}>
              <I n="logout" s={16} c="rgba(255,255,255,0.3)"/> Çıxış
            </button>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div className="main-content" style={{ flex:1, marginLeft:"240px", padding:"32px", overflowY:"auto", minHeight:"100vh" }}>
          {/* Top bar (desktop) */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"28px" }}>
            <div/>
            <button onClick={()=>setShowAdd(true)} style={{
              display:"flex", alignItems:"center", gap:"8px", padding:"11px 20px",
              background:"linear-gradient(135deg,#a78bfa,#f472b6)", border:"none", borderRadius:"12px",
              color:"white", fontSize:"14px", fontWeight:"700", cursor:"pointer", boxShadow:"0 8px 20px rgba(167,139,250,0.28)"
            }}>
              <I n="plus" s={16} c="white"/> Yeni əməliyyat
            </button>
          </div>

          {/* Pages */}
          {page==="dashboard"    && <Dashboard user={user} transactions={transactions} onAdd={handleAdd} onPage={setPage}/>}

          {page==="transactions" && (
            <div>
              <h2 style={{ color:"white", fontSize:"22px", fontWeight:"700", marginBottom:"20px" }}>Əməliyyatlar</h2>
              <div style={{ display:"flex", gap:"8px", marginBottom:"20px", flexWrap:"wrap" }}>
                {[["all","Hamısı"],["income","Gəlirlər"],["expense","Xərclər"],["savings","Yığımlar"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setFilter(v)} style={{
                    padding:"9px 16px", border:`1.5px solid ${filter===v?"#a78bfa":"rgba(255,255,255,0.1)"}`,
                    borderRadius:"99px", background:filter===v?"rgba(167,139,250,0.12)":"transparent",
                    color:filter===v?"#a78bfa":"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"13px", fontWeight:"500"
                  }}>{l}</button>
                ))}
              </div>
              {loading ? <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"48px" }}>Yüklənir...</div>
                : <DailyLog transactions={filteredTx} onDelete={handleDelete}/>}
            </div>
          )}

          {page==="university"   && <UniversityPage user={user} transactions={transactions} onUpdateUser={setUser}/>}
          {page==="analytics"    && <AnalyticsPage transactions={transactions}/>}
          {page==="settings"     && <SettingsPage user={user} onUpdate={setUser}/>}
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="mobile-nav" style={{
        position:"fixed", bottom:0, left:0, right:0, background:"rgba(8,8,18,0.95)",
        backdropFilter:"blur(20px)", borderTop:"1px solid rgba(255,255,255,0.07)",
        display:"flex", zIndex:100, paddingBottom:"env(safe-area-inset-bottom)"
      }}>
        {NAV.map(item=>(
          <button key={item.id} onClick={()=>setPage(item.id)} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"4px",
            padding:"12px 4px 10px", border:"none", background:"transparent",
            color: page===item.id ? "#a78bfa" : "rgba(255,255,255,0.3)", cursor:"pointer"
          }}>
            <I n={item.icon} s={20} c={page===item.id?"#a78bfa":"rgba(255,255,255,0.3)"}/>
            <span style={{ fontSize:"10px", fontWeight: page===item.id?"700":"400" }}>{item.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* ── MOBILE FAB ── */}
      <button className="mobile-nav" onClick={()=>setShowAdd(true)} style={{
        position:"fixed", bottom:"72px", right:"20px", width:"52px", height:"52px",
        background:"linear-gradient(135deg,#a78bfa,#f472b6)", border:"none", borderRadius:"50%",
        display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
        boxShadow:"0 8px 24px rgba(167,139,250,0.4)", zIndex:101
      }}>
        <I n="plus" s={22} c="white"/>
      </button>

      {showAdd && <AddModal onClose={()=>setShowAdd(false)} onAdd={handleAdd} userId={user.id}/>}
    </div>
  );
}
