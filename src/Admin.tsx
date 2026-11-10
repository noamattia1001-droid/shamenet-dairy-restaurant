import { useCallback, useEffect, useRef, useState } from "react";
import { Bike, LogOut, Phone, RefreshCw, ShoppingBag, Store, Users } from "lucide-react";
import { AREAS } from "@/data/menu";

type Order = {
  id: string; createdAt: string; status: string; name: string; phone: string; type: string; address: string;
  notes: string; items: { id: string; name: string; price: number; qty: number }[]; total: number; deliveryFee: number;
};
type Resv = { id: string; createdAt: string; status: string; name: string; phone: string; date: string; time: string; guests: number; area: string; notes: string };

const O_STATUS: Record<string, string> = { new: "חדשה", preparing: "בהכנה", ready: "מוכנה", done: "נמסרה", cancelled: "בוטלה" };
const O_NEXT: Record<string, string> = { new: "preparing", preparing: "ready", ready: "done" };
const R_STATUS: Record<string, string> = { pending: "ממתינה", confirmed: "אושרה", seated: "הגיעו", cancelled: "בוטלה" };
const KEY = "shamenet-pass";
const nis = (n: number) => `${n.toLocaleString("he-IL")} ₪`;
const localDate = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
const read = () => { try { return sessionStorage.getItem(KEY) || ""; } catch { return ""; } };

export default function Admin() {
  const [pass, setPass] = useState(read);
  const [ok, setOk] = useState(false);
  const [input, setInput] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!pass) return;
    fetch("/api/login", { headers: { "x-pass": pass } }).then((r) => {
      if (r.ok) { setOk(true); try { sessionStorage.setItem(KEY, pass); } catch {} }
      else { setErr("סיסמה שגויה"); setPass(""); }
    });
  }, [pass]);

  if (!ok)
    return (
      <div className="ground flex min-h-screen items-center justify-center px-5">
        <form onSubmit={(e) => { e.preventDefault(); setErr(""); setPass(input); }} className="w-full max-w-sm rounded-[6px] border border-[#2b1d0e]/15 bg-[#fffaf0] p-8">
          <h1 className="text-[34px] font-bold">שמנת</h1>
          <p className="mt-1 font-body text-[#2b1d0e]/65">דשבורד המסעדה</p>
          <label className="mt-6 block"><span className="label">סיסמה</span>
            <input autoFocus type="password" inputMode="numeric" className="field text-center text-[22px] tracking-[0.4em]" value={input} onChange={(e) => setInput(e.target.value)} />
          </label>
          {err && <p className="mt-3 font-body font-semibold text-[#8b1d0e]">{err}</p>}
          <button className="btn btn-ink mt-5 w-full">כניסה</button>
        </form>
      </div>
    );

  return <Board pass={pass} logout={() => { try { sessionStorage.removeItem(KEY); } catch {} setOk(false); setPass(""); setInput(""); }} />;
}

function Board({ pass, logout }: { pass: string; logout: () => void }) {
  const [tab, setTab] = useState<"orders" | "resv">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [resv, setResv] = useState<Resv[]>([]);
  const [oFilter, setOFilter] = useState("active");
  const [rDate, setRDate] = useState(localDate());
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);
  const seen = useRef<Set<string> | null>(null);

  const api = useCallback(
    (url: string, init?: RequestInit) => fetch(url, { ...init, headers: { "Content-Type": "application/json", "x-pass": pass } }).then((r) => r.json()),
    [pass],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, r] = await Promise.all([api("/api/orders"), api("/api/reservations")]);
      if (Array.isArray(o)) {
        const ids = new Set(o.map((x: Order) => x.id));
        if (seen.current && o.some((x: Order) => !seen.current!.has(x.id))) beep();
        seen.current = ids;
        setOrders(o);
      }
      if (Array.isArray(r)) setResv(r);
      setUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);

  const setStatus = async (kind: "orders" | "reservations", id: string, status: string) => {
    if (kind === "orders") setOrders((l) => l.map((x) => (x.id === id ? { ...x, status } : x)));
    else setResv((l) => l.map((x) => (x.id === id ? { ...x, status } : x)));
    await api(`/api/${kind}`, { method: "PATCH", body: JSON.stringify({ id, status }) });
  };

  const today = localDate();
  const todays = orders.filter((o) => localDate(new Date(o.createdAt)) === today && o.status !== "cancelled");
  const active = orders.filter((o) => ["new", "preparing", "ready"].includes(o.status));
  const dayResv = resv.filter((r) => r.date === rDate);
  const todayResv = resv.filter((r) => r.date === today && r.status !== "cancelled");
  const shownOrders = oFilter === "active" ? active : oFilter === "today" ? orders.filter((o) => localDate(new Date(o.createdAt)) === today) : orders;

  return (
    <div className="min-h-screen bg-[#f6ead0]">
      <header className="sticky top-0 z-40 border-b border-[#2b1d0e]/10 bg-[#2b1d0e] text-[#f6ead0]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-baseline gap-3">
            <span className="text-[24px] font-bold" style={{ fontFamily: "Fredoka" }}>שמנת</span>
            <span className="font-body text-[14px] text-[#f6ead0]/60">דשבורד</span>
          </div>
          <div className="flex items-center gap-1 font-body text-[14px]">
            <span className="hidden text-[#f6ead0]/50 sm:inline">{updated ? `עודכן ${updated.toLocaleTimeString("he-IL")}` : ""}</span>
            <button onClick={load} className="p-2" aria-label="רענון"><RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} /></button>
            <a href="/" className="p-2" aria-label="לאתר"><Store className="h-5 w-5" /></a>
            <button onClick={logout} className="p-2" aria-label="יציאה"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="הזמנות פתוחות" value={String(active.length)} hot={active.some((o) => o.status === "new")} />
          <Stat label="הכנסות היום" value={nis(todays.reduce((s, o) => s + o.total, 0))} />
          <Stat label="הזמנות היום" value={String(todays.length)} />
          <Stat label="סועדים היום" value={String(todayResv.reduce((s, r) => s + r.guests, 0))} sub={`${todayResv.length} שולחנות`} />
        </div>

        <div className="mt-8 flex gap-2">
          <button onClick={() => setTab("orders")} className={`chip ${tab === "orders" ? "chip-on" : ""}`}><ShoppingBag className="ml-1.5 inline h-4 w-4" />הזמנות אוכל</button>
          <button onClick={() => setTab("resv")} className={`chip ${tab === "resv" ? "chip-on" : ""}`}><Users className="ml-1.5 inline h-4 w-4" />שולחנות</button>
        </div>

        {tab === "orders" ? (
          <>
            <div className="mt-5 flex gap-4 font-body text-[15px] font-semibold">
              {[["active", "פתוחות"], ["today", "היום"], ["all", "הכל"]].map(([v, l]) => (
                <button key={v} onClick={() => setOFilter(v)} className={oFilter === v ? "underline decoration-[#e9b23a] decoration-[3px] underline-offset-[6px]" : "text-[#2b1d0e]/55"}>{l}</button>
              ))}
            </div>
            {!shownOrders.length && <Empty text="אין הזמנות כאן כרגע. הזמנות חדשות מהאתר יופיעו לבד, עם צליל." />}
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shownOrders.map((o) => (
                <article key={o.id} className={`flex flex-col rounded-[6px] border bg-[#fffaf0] p-5 font-body ${o.status === "new" ? "border-[#e9b23a] ring-2 ring-[#e9b23a]/60" : "border-[#2b1d0e]/15"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[13px] text-[#2b1d0e]/55" dir="ltr">#{o.id.slice(-5).toUpperCase()} · {hhmm(o.createdAt)}</div>
                      <div className="text-[19px] font-bold">{o.name}</div>
                    </div>
                    <Badge s={o.status} label={O_STATUS[o.status]} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-[#2b1d0e]/75">
                    <a href={`tel:${o.phone}`} dir="ltr" className="flex items-center gap-1 font-semibold"><Phone className="h-3.5 w-3.5" />{o.phone}</a>
                    <span className="flex items-center gap-1">{o.type === "delivery" ? <><Bike className="h-3.5 w-3.5" />משלוח: {o.address}</> : <><Store className="h-3.5 w-3.5" />איסוף עצמי</>}</span>
                  </div>
                  <ul className="mt-3 border-t border-[#2b1d0e]/10 pt-3 text-[15px]">
                    {o.items.map((i) => (
                      <li key={i.id} className="flex justify-between"><span><b>{i.qty}×</b> {i.name}</span><span className="text-[#2b1d0e]/60">{nis(i.price * i.qty)}</span></li>
                    ))}
                  </ul>
                  {o.notes && <p className="mt-2 rounded-[6px] bg-[#e9b23a]/20 px-3 py-2 text-[14px]">📝 {o.notes}</p>}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <span className="text-[19px] font-bold">{nis(o.total)}</span>
                    <div className="flex gap-2">
                      {O_NEXT[o.status] && (
                        <button onClick={() => setStatus("orders", o.id, O_NEXT[o.status])} className="btn btn-ink px-4 py-2 text-[14px]">
                          {O_STATUS[O_NEXT[o.status]]}
                        </button>
                      )}
                      {["new", "preparing"].includes(o.status) && (
                        <button onClick={() => confirm("לבטל את ההזמנה?") && setStatus("orders", o.id, "cancelled")} className="btn btn-line px-3 py-2 text-[14px]">ביטול</button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <input type="date" className="field w-auto py-2" value={rDate} onChange={(e) => setRDate(e.target.value)} />
              <button onClick={() => setRDate(today)} className="chip">היום</button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {AREAS.map((a) => {
                const used = dayResv.filter((r) => r.area === a.id && r.status !== "cancelled").reduce((s, r) => s + r.guests, 0);
                return (
                  <div key={a.id} className="rounded-[6px] border border-[#2b1d0e]/15 bg-[#fffaf0] p-4 font-body">
                    <div className="text-[15px] font-bold">{a.name}</div>
                    <div className="mt-1 text-[13px] text-[#2b1d0e]/60">{used} סועדים ביום, עד {a.capacity} בכל שעה</div>
                  </div>
                );
              })}
            </div>
            {!dayResv.length && <Empty text="אין הזמנות שולחן לתאריך הזה." />}
            <div className="mt-4 overflow-x-auto rounded-[6px] border border-[#2b1d0e]/15 bg-[#fffaf0]">
              {dayResv.length > 0 && (
                <table className="w-full min-w-[640px] font-body text-[15px]">
                  <thead className="bg-[#2b1d0e]/5 text-right text-[13px] text-[#2b1d0e]/60">
                    <tr><th className="p-3">שעה</th><th className="p-3">שם</th><th className="p-3">טלפון</th><th className="p-3">סועדים</th><th className="p-3">אזור</th><th className="p-3">הערות</th><th className="p-3">סטטוס</th></tr>
                  </thead>
                  <tbody>
                    {dayResv.map((r) => (
                      <tr key={r.id} className={`border-t border-[#2b1d0e]/10 ${r.status === "cancelled" ? "opacity-45" : ""}`}>
                        <td className="p-3 font-bold" dir="ltr">{r.time}</td>
                        <td className="p-3 font-semibold">{r.name}</td>
                        <td className="p-3"><a href={`tel:${r.phone}`} dir="ltr">{r.phone}</a></td>
                        <td className="p-3">{r.guests}</td>
                        <td className="p-3">{AREAS.find((a) => a.id === r.area)?.name}</td>
                        <td className="p-3 text-[14px] text-[#2b1d0e]/70">{r.notes}</td>
                        <td className="p-3">
                          <select value={r.status} onChange={(e) => setStatus("reservations", r.id, e.target.value)} className="rounded-[8px] border border-[#2b1d0e]/25 bg-transparent px-2 py-1.5 font-semibold">
                            {Object.entries(R_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, sub, hot }: { label: string; value: string; sub?: string; hot?: boolean }) {
  return (
    <div className={`rounded-[6px] p-5 ${hot ? "bg-[#e9b23a]" : "bg-[#fffaf0] border border-[#2b1d0e]/15"}`}>
      <div className="font-body text-[14px] text-[#2b1d0e]/65">{label}</div>
      <div className="mt-1 text-[30px] font-bold leading-none" style={{ fontFamily: "Fredoka" }}>{value}</div>
      {sub && <div className="mt-1 font-body text-[13px] text-[#2b1d0e]/55">{sub}</div>}
    </div>
  );
}

function Badge({ s, label }: { s: string; label: string }) {
  const c = s === "new" ? "bg-[#e9b23a]" : s === "preparing" ? "bg-[#2b1d0e] text-[#f9e3a6]" : s === "ready" ? "bg-[#f9dd8a]" : "bg-[#2b1d0e]/10 text-[#2b1d0e]/60";
  return <span className={`shrink-0 rounded-full px-3 py-1 font-body text-[13px] font-bold ${c}`}>{label}</span>;
}

const Empty = ({ text }: { text: string }) => <p className="mt-6 font-body text-[16px] text-[#2b1d0e]/60">{text}</p>;

function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.18].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.2, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.16);
    });
  } catch {}
}
