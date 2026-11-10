import { useEffect, useMemo, useState } from "react";
import { Check, Menu, Minus, Phone, Plus, ShoppingBag, X } from "lucide-react";
import { TiltedGridHero } from "@/components/ui/tilted-grid-hero";
import { AREAS, CATEGORIES, MENU, TIMES, type Dish } from "@/data/menu";

const PHONE = "04-6100100";
const ADDRESS = "הרצל 40, חדרה";
const MAPS = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ADDRESS);

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;
const PHOTOS = [
  "photo-1565299624946-b28f40a0ae38", "photo-1551183053-bf91a1d81141", "photo-1567620905732-2d1ec7ab7445",
  "photo-1513104890138-7c749659a591", "photo-1495474472287-4d71bcdd2085", "photo-1512621776951-a57141f2eefd",
  "photo-1621996346565-e3dbc646d9a9", "photo-1533134242443-d4fd215305ad", "photo-1504754524776-8f4f37790ca0",
  "photo-1528207776546-365bb710ee93",
].map((id) => ({ src: u(id), alt: "מנה מהתפריט של שמנת" }));
const INTERIOR = u("photo-1555396273-367ea4eb4db5");

const NAV = [
  ["תפריט", "#menu"],
  ["הזמנת שולחן", "#reserve"],
  ["עלינו", "#about"],
  ["שעות ומיקום", "#contact"],
] as const;

type Cart = Record<string, number>;
const nis = (n: number) => `${n.toLocaleString("he-IL")} ₪`;
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

async function post(url: string, data: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "משהו השתבש, נסו שוב");
  return j;
}

export default function App() {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<string>(CATEGORIES[0]);
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);

  const add = (id: string, d = 1) =>
    setCart((c) => {
      const n = { ...c, [id]: Math.max(0, (c[id] || 0) + d) };
      if (!n[id]) delete n[id];
      return n;
    });
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = Object.entries(cart).reduce((s, [id, q]) => s + (MENU.find((m) => m.id === id)?.price || 0) * q, 0);

  const heroText = (
    <>
      <p className="font-body text-[15px] font-semibold text-[#7a5413] md:text-base">שמנת, מסעדה חלבית בחדרה</p>
      <h1 className="mt-2 text-[44px] font-bold leading-[1.02] text-[#2b1d0e] md:text-[76px]">
        גבינות טובות,
        <br />
        טאבון חם.
      </h1>
      <p className="mt-4 max-w-[32ch] font-body text-lg leading-snug text-[#2b1d0e]/75 md:text-xl">
        ארוחות בוקר, פסטות טריות ופיצות מהטאבון. מזמינים משלוח או שומרים שולחן, הכל מכאן.
      </p>
      <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <a href="#menu" className="btn btn-ink">
          <ShoppingBag className="h-5 w-5" strokeWidth={2.2} /> להזמנת אוכל
        </a>
        <a href="#reserve" className="btn btn-line">
          הזמנת שולחן
        </a>
      </div>
    </>
  );

  return (
    <div className="ground relative min-h-screen overflow-x-clip">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#2b1d0e]/10 bg-[#f6ead0]/95">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#top" className="text-[24px] font-bold text-[#2b1d0e]">
            שמנת
          </a>
          <ul className="hidden items-center gap-8 font-body text-[15px] font-semibold md:flex">
            {NAV.map(([l, h]) => (
              <li key={h}>
                <a href={h} className="text-[#2b1d0e]/70 underline-offset-[6px] hover:text-[#2b1d0e] hover:underline">
                  {l}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 rounded-[10px] px-3 py-2 font-body text-[15px] font-bold hover:bg-[#2b1d0e]/5" aria-label="העגלה">
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden sm:inline">ההזמנה שלי</span>
              {count > 0 && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#e9b23a] px-1.5 text-[13px]">{count}</span>}
            </button>
            <button className="-ml-2 p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="תפריט">
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>
        {open && (
          <div className="border-t border-[#2b1d0e]/10 px-5 pb-4 md:hidden">
            {NAV.map(([l, h]) => (
              <a key={h} href={h} onClick={() => setOpen(false)} className="block border-b border-[#2b1d0e]/10 py-3.5 font-body text-lg font-semibold">
                {l}
              </a>
            ))}
          </div>
        )}
      </header>

      <main id="top">
        <section className="relative hidden h-[100svh] min-h-[780px] md:block">
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-start px-5 pt-28">{heroText}</div>
          <TiltedGridHero
            images={PHOTOS}
            aspectRatio={4 / 3}
            tileHeight={74}
            axis={50}
            gap={12}
            curve={58}
            speed={4}
            className="absolute inset-x-0 top-[500px] h-[min(calc(100%-520px),440px)] min-h-[260px] [contain:paint]"
          />
        </section>
        <section className="md:hidden">
          <div className="relative z-10 flex flex-col items-start px-5 pt-24">{heroText}</div>
          <TiltedGridHero images={PHOTOS} aspectRatio={4 / 3} tileHeight={72} axis={50} gap={10} curve={50} speed={2.6} fade={6} className="mt-8 h-[150px] w-full [contain:paint]" />
        </section>

        <section id="menu" className="scroll-mt-16 px-5 pb-20 pt-16 md:pt-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-[36px] font-bold leading-none md:text-[52px]">התפריט</h2>
            <p className="mt-3 max-w-md font-body text-[17px] text-[#2b1d0e]/70">
              הכל חלבי, הכל מוכן במקום. מוסיפים מנות להזמנה ומקבלים משלוח עד הבית או איסוף עצמי.
            </p>
            <div className="sticky top-16 z-30 -mx-5 mt-8 flex gap-2 overflow-x-auto bg-[#f6ead0]/95 px-5 py-3">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCat(c)} className={`chip shrink-0 ${cat === c ? "chip-on" : ""}`}>
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-x-10 md:grid-cols-2">
              {MENU.filter((m) => m.cat === cat).map((d) => (
                <DishRow key={d.id} d={d} qty={cart[d.id] || 0} add={add} />
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-16 bg-[#2b1d0e] px-5 py-20 text-[#f6ead0] md:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
            <img src={INTERIOR} alt="המסעדה מבפנים" loading="lazy" className="aspect-[4/3] w-full rounded-[6px] object-cover" />
            <div>
              <h2 className="text-[36px] font-bold leading-none md:text-[52px]">מטבח חלבי, בלי קיצורי דרך.</h2>
              <p className="mt-5 font-body text-[18px] leading-relaxed text-[#f6ead0]/75">
                את הגבינות אנחנו מביאים ממחלבות קטנות בגליל, הפסטה נמתחת כל בוקר והבצק של הפיצה תופח 48 שעות לפני שהוא נכנס לטאבון.
              </p>
              <dl className="mt-8 grid grid-cols-2 gap-x-6 border-t border-[#f6ead0]/15 pt-6 font-body">
                <div>
                  <dt className="text-[14px] text-[#f6ead0]/55">כשרות</dt>
                  <dd className="mt-1 text-[22px] font-bold">חלבי, כשר למהדרין</dd>
                </div>
                <div>
                  <dt className="text-[14px] text-[#f6ead0]/55">מקומות ישיבה</dt>
                  <dd className="mt-1 text-[22px] font-bold">{AREAS.reduce((s, a) => s + a.capacity, 0)} מקומות, 4 אזורים</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <Reserve />

        <section id="contact" className="scroll-mt-16 bg-[#e9b23a] px-5 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-[36px] font-bold leading-none text-[#2b1d0e] md:text-[52px]">רעבים?</h2>
            <a href={`tel:${PHONE}`} dir="ltr" className="mt-6 inline-block text-[44px] font-bold leading-none text-[#2b1d0e] hover:underline md:text-[84px]">
              {PHONE}
            </a>
            <dl className="mt-12 grid gap-y-6 border-t border-[#2b1d0e]/25 pt-8 font-body text-[#2b1d0e] sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-[14px] opacity-70">כתובת</dt>
                <dd className="mt-1 text-[18px] font-semibold">
                  <a href={MAPS} target="_blank" rel="noreferrer" className="underline underline-offset-4">{ADDRESS}</a>
                </dd>
              </div>
              <div>
                <dt className="text-[14px] opacity-70">א׳ עד ה׳</dt>
                <dd className="mt-1 text-[18px] font-semibold">08:00 עד 23:00</dd>
              </div>
              <div>
                <dt className="text-[14px] opacity-70">שישי</dt>
                <dd className="mt-1 text-[18px] font-semibold">08:00 עד שעה לפני כניסת שבת</dd>
              </div>
              <div>
                <dt className="text-[14px] opacity-70">מוצ״ש</dt>
                <dd className="mt-1 text-[18px] font-semibold">שעה אחרי צאת שבת עד 23:30</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <footer className="bg-[#2b1d0e] px-5 py-6 font-body text-[14px] text-[#f6ead0]/60">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2">
          <span>שמנת, מסעדה חלבית</span>
          <span>{ADDRESS}</span>
        </div>
      </footer>

      {count > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)} className="btn btn-ink fixed inset-x-5 bottom-5 z-40 shadow-[0_6px_20px_rgba(0,0,0,0.25)] sm:inset-x-auto sm:left-5">
          <ShoppingBag className="h-5 w-5" /> להזמנה ({count}) · {nis(subtotal)}
        </button>
      )}

      {cartOpen && <Checkout cart={cart} add={add} clear={() => setCart({})} close={() => setCartOpen(false)} subtotal={subtotal} />}
    </div>
  );
}

function DishRow({ d, qty, add }: { d: Dish; qty: number; add: (id: string, d?: number) => void }) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-[#2b1d0e]/15 py-5">
      <div className="min-w-0">
        <h3 className="flex flex-wrap items-center gap-2 text-[20px] font-semibold">
          {d.name}
          {d.tag && <span className="rounded-full bg-[#e9b23a] px-2.5 py-0.5 font-body text-[12px] font-bold">{d.tag}</span>}
        </h3>
        {d.desc && <p className="mt-1 font-body text-[16px] leading-snug text-[#2b1d0e]/65">{d.desc}</p>}
        <p className="mt-2 font-body text-[17px] font-bold">{nis(d.price)}</p>
      </div>
      {qty ? (
        <div className="flex shrink-0 items-center gap-1 rounded-[10px] border border-[#2b1d0e]/80">
          <button onClick={() => add(d.id, 1)} className="p-2.5" aria-label="עוד אחד"><Plus className="h-4 w-4" /></button>
          <span className="w-5 text-center font-body font-bold">{qty}</span>
          <button onClick={() => add(d.id, -1)} className="p-2.5" aria-label="פחות אחד"><Minus className="h-4 w-4" /></button>
        </div>
      ) : (
        <button onClick={() => add(d.id)} className="btn btn-line shrink-0 px-4 py-2.5 text-[15px]">
          <Plus className="h-4 w-4" /> הוספה
        </button>
      )}
    </div>
  );
}

function Checkout({ cart, add, clear, close, subtotal }: { cart: Cart; add: (id: string, d?: number) => void; clear: () => void; close: () => void; subtotal: number }) {
  const [f, setF] = useState({ name: "", phone: "", type: "pickup", address: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ id: string; total: number } | null>(null);
  const lines = Object.entries(cart).map(([id, qty]) => ({ d: MENU.find((m) => m.id === id)!, qty }));
  const fee = f.type === "delivery" ? 20 : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await post("/api/orders", { ...f, items: lines.map((l) => ({ id: l.d.id, qty: l.qty })) });
      setDone(r);
      clear();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-[#2b1d0e]/40" onClick={close}>
      <aside className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#f6ead0] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-[30px] font-bold">{done ? "ההזמנה התקבלה" : "ההזמנה שלי"}</h2>
          <button onClick={close} className="p-2" aria-label="סגירה"><X className="h-6 w-6" /></button>
        </div>

        {done ? (
          <div className="mt-6 font-body">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e9b23a]"><Check className="h-7 w-7" /></div>
            <p className="mt-5 text-[19px] leading-relaxed">
              תודה! מספר הזמנה <b dir="ltr">#{done.id.slice(-5).toUpperCase()}</b>, סה״כ {nis(done.total)}. המטבח כבר התחיל, ונתקשר אם יש שאלה.
            </p>
            <button onClick={close} className="btn btn-ink mt-8 w-full">חזרה לאתר</button>
          </div>
        ) : !lines.length ? (
          <p className="mt-6 font-body text-[17px] text-[#2b1d0e]/70">עדיין לא הוספתם מנות. בחרו משהו מהתפריט.</p>
        ) : (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
            <div>
              {lines.map(({ d, qty }) => (
                <div key={d.id} className="flex items-center justify-between gap-3 border-b border-[#2b1d0e]/15 py-3 font-body">
                  <div>
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-[14px] text-[#2b1d0e]/60">{nis(d.price * qty)}</div>
                  </div>
                  <div className="flex items-center gap-1 rounded-[10px] border border-[#2b1d0e]/40">
                    <button type="button" onClick={() => add(d.id, 1)} className="p-2"><Plus className="h-4 w-4" /></button>
                    <span className="w-5 text-center font-bold">{qty}</span>
                    <button type="button" onClick={() => add(d.id, -1)} className="p-2"><Minus className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {[["pickup", "איסוף עצמי"], ["delivery", "משלוח (20 ₪)"]].map(([v, l]) => (
                <button type="button" key={v} onClick={() => setF({ ...f, type: v })} className={`chip flex-1 ${f.type === v ? "chip-on" : ""}`}>{l}</button>
              ))}
            </div>
            <label><span className="label">שם</span><input required className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label><span className="label">טלפון</span><input required type="tel" dir="ltr" className="field text-right" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
            {f.type === "delivery" && (
              <label><span className="label">כתובת למשלוח</span><input required className="field" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></label>
            )}
            <label><span className="label">הערות למטבח</span><textarea rows={2} className="field" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
            <div className="border-t border-[#2b1d0e]/20 pt-4 font-body text-[17px]">
              {fee > 0 && <div className="flex justify-between text-[#2b1d0e]/70"><span>משלוח</span><span>{nis(fee)}</span></div>}
              <div className="flex justify-between text-[22px] font-bold"><span>לתשלום</span><span>{nis(subtotal + fee)}</span></div>
              <p className="mt-1 text-[14px] text-[#2b1d0e]/60">התשלום במסירה או באיסוף, במזומן או באשראי.</p>
            </div>
            {err && <p className="rounded-[10px] bg-[#8b1d0e]/10 px-4 py-3 font-body font-semibold text-[#8b1d0e]">{err}</p>}
            <button disabled={busy} className="btn btn-ink disabled:opacity-60">{busy ? "שולחים..." : "שליחת הזמנה"}</button>
          </form>
        )}
      </aside>
    </div>
  );
}

function Reserve() {
  const [f, setF] = useState({ name: "", phone: "", date: today(), time: "19:00", guests: 2, area: "inside", notes: "" });
  const [free, setFree] = useState<Record<string, number> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let live = true;
    setFree(null);
    fetch(`/api/reservations?date=${f.date}&time=${f.time}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => live && setFree(j))
      .catch(() => {});
    return () => { live = false; };
  }, [f.date, f.time, done]);

  const fits = useMemo(
    () => (id: string) => {
      if (id === "bar" && f.guests > 2) return false;
      if (id === "private" && f.guests < 8) return false;
      return !free || (free[id] ?? 0) >= f.guests;
    },
    [free, f.guests],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await post("/api/reservations", f);
      setDone(true);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="reserve" className="scroll-mt-16 px-5 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-[36px] font-bold leading-none md:text-[52px]">שומרים לכם שולחן</h2>
        <p className="mt-3 max-w-md font-body text-[17px] text-[#2b1d0e]/70">בוחרים יום, שעה ואיפה לשבת. אנחנו מאשרים בטלפון תוך זמן קצר.</p>

        {done ? (
          <div className="mt-10 max-w-lg rounded-[6px] border border-[#2b1d0e]/20 bg-[#fffaf0] p-8 font-body">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9b23a]"><Check className="h-6 w-6" /></div>
            <p className="mt-4 text-[19px]">
              קיבלנו! {f.guests} סועדים, {AREAS.find((a) => a.id === f.area)?.name}, {f.date.split("-").reverse().join(".")} בשעה {f.time}.
            </p>
            <button onClick={() => { setDone(false); setF({ ...f, name: "", phone: "", notes: "" }); }} className="btn btn-line mt-6">הזמנה נוספת</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10 grid gap-8 md:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <label><span className="label">תאריך</span><input type="date" required min={today()} className="field" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
                <label><span className="label">סועדים</span>
                  <select className="field" value={f.guests} onChange={(e) => setF({ ...f, guests: +e.target.value })}>
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </div>
              <div>
                <span className="label">שעה</span>
                <div className="flex flex-wrap gap-2">
                  {TIMES.map((t) => (
                    <button type="button" key={t} onClick={() => setF({ ...f, time: t })} className={`chip ${f.time === t ? "chip-on" : ""}`} dir="ltr">{t}</button>
                  ))}
                </div>
              </div>
              <label><span className="label">שם</span><input required className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
              <label><span className="label">טלפון</span><input required type="tel" dir="ltr" className="field text-right" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
              <label><span className="label">בקשות מיוחדות</span><input className="field" placeholder="יום הולדת, כיסא לתינוק..." value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
            </div>

            <div>
              <span className="label">איפה תשבו?</span>
              <div className="grid grid-cols-2 gap-3">
                {AREAS.map((a) => {
                  const ok = fits(a.id);
                  const on = f.area === a.id;
                  return (
                    <button
                      type="button"
                      key={a.id}
                      disabled={!ok}
                      onClick={() => setF({ ...f, area: a.id })}
                      className={`rounded-[6px] border p-5 text-right transition ${on ? "border-[#2b1d0e] bg-[#2b1d0e] text-[#f6ead0]" : "border-[#2b1d0e]/20 bg-[#fffaf0] hover:border-[#2b1d0e]/60"} disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <div className="text-[22px] font-bold" style={{ fontFamily: "Fredoka" }}>{a.name}</div>
                      <div className={`mt-1 font-body text-[14px] ${on ? "text-[#f6ead0]/70" : "text-[#2b1d0e]/60"}`}>{a.desc}</div>
                      <div className="mt-3 font-body text-[14px] font-bold">
                        {free ? `${free[a.id] ?? 0} מקומות פנויים` : "בודקים זמינות..."}
                      </div>
                    </button>
                  );
                })}
              </div>
              {err && <p className="mt-4 rounded-[10px] bg-[#8b1d0e]/10 px-4 py-3 font-body font-semibold text-[#8b1d0e]">{err}</p>}
              <button disabled={busy || !fits(f.area)} className="btn btn-ink mt-6 w-full disabled:opacity-60">
                {busy ? "שולחים..." : !fits(f.area) ? "האזור הזה לא מתאים, בחרו אחר" : "שמירת השולחן"}
              </button>
              <a href={`tel:${PHONE}`} className="mt-4 flex items-center justify-center gap-2 font-body text-[15px] font-semibold text-[#2b1d0e]/70">
                <Phone className="h-4 w-4" /> קבוצה גדולה? התקשרו <span dir="ltr">{PHONE}</span>
              </a>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
