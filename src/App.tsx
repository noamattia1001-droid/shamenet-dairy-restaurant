import { useEffect, useRef, useState } from "react";
import { Check, Menu, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { TiltedGridHero } from "@/components/ui/tilted-grid-hero";
import { CATEGORIES, MENU, img, thumb, type Dish } from "@/data/menu";

const PHONE = "04-6100100";
const ADDRESS = "הרצל 40, חדרה";
const MAPS = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ADDRESS);

const PHOTOS = ["b2", "z1", "p1", "b3", "s1", "z2", "d1", "p2", "b1", "d3", "s3", "z3"].map((id) => ({ src: img(id), alt: "מנה מהתפריט של שמנת" }));

const NAV = [
  ["תפריט", "#menu"],
  ["עלינו", "#about"],
  ["שעות ומיקום", "#contact"],
] as const;

const ORDER_TYPES = [
  ["takeaway", "טייק אוויי", "אוספים מהדלפק"],
  ["dinein", "לשבת במקום", "מגישים לשולחן"],
] as const;

type Cart = Record<string, number>;
const nis = (n: number) => `${n.toLocaleString("he-IL")} ₪`;
const catId = (c: string) => "cat-" + CATEGORIES.indexOf(c as never);

/** Locks page scroll while a sheet is open. */
function useLock(on: boolean) {
  useEffect(() => {
    if (!on) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [on]);
}

export default function App() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [dish, setDish] = useState<Dish | null>(null);
  const [active, setActive] = useState<string>(CATEGORIES[0]);
  const stripRef = useRef<HTMLDivElement>(null);
  useLock(cartOpen || !!dish);

  const add = (id: string, d = 1) =>
    setCart((c) => {
      const n = { ...c, [id]: Math.max(0, (c[id] || 0) + d) };
      if (!n[id]) delete n[id];
      return n;
    });
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = Object.entries(cart).reduce((s, [id, q]) => s + (MENU.find((m) => m.id === id)?.price || 0) * q, 0);

  // Highlight the category you're scrolling through, and keep its tab in view.
  useEffect(() => {
    const els = CATEGORIES.map((c) => document.getElementById(catId(c))).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(CATEGORIES[+e.target.id.slice(4)])),
      { rootMargin: "-140px 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    stripRef.current?.querySelector(`[data-cat="${active}"]`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  const heroText = (
    <>
      <p className="font-body text-[15px] font-semibold text-[#7a5413] md:text-base">שמנת, מסעדה חלבית בחדרה</p>
      <h1 className="mt-2 text-[44px] font-bold leading-[1.02] text-[#2b1d0e] md:text-[76px]">
        גבינות טובות,
        <br />
        טאבון חם.
      </h1>
      <p className="mt-4 max-w-[32ch] font-body text-lg leading-snug text-[#2b1d0e]/75 md:text-xl">
        ארוחות בוקר, פסטות טריות ופיצות מהטאבון. מזמינים מכאן, לקחת או לשבת אצלנו.
      </p>
      <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <a href="#menu" className="btn btn-ink">
          <ShoppingBag className="h-5 w-5" strokeWidth={2.2} /> לתפריט ולהזמנה
        </a>
        <a href={`tel:${PHONE}`} className="btn btn-line" dir="ltr">{PHONE}</a>
      </div>
    </>
  );

  return (
    <div className="ground relative min-h-screen overflow-x-clip">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#2b1d0e]/10 bg-[#f6ead0]/95">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#top" className="text-[24px] font-bold text-[#2b1d0e]">שמנת</a>
          <ul className="hidden items-center gap-8 font-body text-[15px] font-semibold md:flex">
            {NAV.map(([l, h]) => (
              <li key={h}>
                <a href={h} className="text-[#2b1d0e]/70 underline-offset-[6px] hover:text-[#2b1d0e] hover:underline">{l}</a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 rounded-[10px] px-3 py-2 font-body text-[15px] font-bold hover:bg-[#2b1d0e]/5" aria-label="ההזמנה שלי">
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
              <a key={h} href={h} onClick={() => setOpen(false)} className="block border-b border-[#2b1d0e]/10 py-3.5 font-body text-lg font-semibold">{l}</a>
            ))}
          </div>
        )}
      </header>

      <main id="top">
        <section className="relative hidden h-[100svh] min-h-[780px] md:block">
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-start px-5 pt-28">{heroText}</div>
          <TiltedGridHero images={PHOTOS} aspectRatio={4 / 3} tileHeight={74} axis={50} gap={12} curve={58} speed={4}
            className="absolute inset-x-0 top-[500px] h-[min(calc(100%-520px),440px)] min-h-[260px] [contain:paint]" />
        </section>
        <section className="md:hidden">
          <div className="relative z-10 flex flex-col items-start px-5 pt-24">{heroText}</div>
          <TiltedGridHero images={PHOTOS} aspectRatio={4 / 3} tileHeight={72} axis={50} gap={10} curve={50} speed={2.6} fade={6} className="mt-8 h-[150px] w-full [contain:paint]" />
        </section>

        <section id="menu" className="scroll-mt-16 pb-20 pt-16 md:pt-24">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-[36px] font-bold leading-none md:text-[52px]">התפריט</h2>
            <p className="mt-3 max-w-md font-body text-[17px] text-[#2b1d0e]/70">
              הכל חלבי והכל מוכן במקום. לחצו על מנה כדי לראות אותה מקרוב ולהוסיף להזמנה.
            </p>
          </div>

          {/* One long menu; the strip only jumps between its sections. */}
          <div className="sticky top-16 z-30 mt-8 border-y border-[#2b1d0e]/10 bg-[#f6ead0]/95 backdrop-blur">
            <div ref={stripRef} className="mx-auto flex max-w-6xl gap-7 overflow-x-auto px-5 [scrollbar-width:none]">
              {CATEGORIES.map((c) => (
                <a key={c} href={`#${catId(c)}`} data-cat={c}
                  className={`shrink-0 border-b-[3px] py-3.5 font-body text-[16px] font-bold transition-colors ${active === c ? "border-[#e9b23a] text-[#2b1d0e]" : "border-transparent text-[#2b1d0e]/45 hover:text-[#2b1d0e]/80"}`}>
                  {c}
                </a>
              ))}
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-5">
            {CATEGORIES.map((c) => (
              <div key={c} id={catId(c)} className="scroll-mt-32 pt-10">
                <h3 className="text-[26px] font-bold md:text-[30px]">{c}</h3>
                <div className="mt-2 grid gap-x-10 md:grid-cols-2">
                  {MENU.filter((m) => m.cat === c).map((d) => (
                    <DishRow key={d.id} d={d} qty={cart[d.id] || 0} onOpen={() => setDish(d)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="scroll-mt-16 bg-[#2b1d0e] px-5 py-20 text-[#f6ead0] md:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
            <img src="/dishes/interior.webp" alt="המסעדה מבפנים" loading="lazy" className="aspect-[4/3] w-full rounded-[6px] object-cover" />
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
                  <dt className="text-[14px] text-[#f6ead0]/55">הזמנה</dt>
                  <dd className="mt-1 text-[22px] font-bold">טייק אוויי או לשבת</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-16 bg-[#e9b23a] px-5 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-[36px] font-bold leading-none text-[#2b1d0e] md:text-[52px]">רעבים?</h2>
            <a href={`tel:${PHONE}`} dir="ltr" className="mt-6 inline-block text-[44px] font-bold leading-none text-[#2b1d0e] hover:underline md:text-[84px]">{PHONE}</a>
            <dl className="mt-12 grid gap-y-6 border-t border-[#2b1d0e]/25 pt-8 font-body text-[#2b1d0e] sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-[14px] opacity-70">כתובת</dt>
                <dd className="mt-1 text-[18px] font-semibold"><a href={MAPS} target="_blank" rel="noreferrer" className="underline underline-offset-4">{ADDRESS}</a></dd>
              </div>
              <div><dt className="text-[14px] opacity-70">א׳ עד ה׳</dt><dd className="mt-1 text-[18px] font-semibold">08:00 עד 23:00</dd></div>
              <div><dt className="text-[14px] opacity-70">שישי</dt><dd className="mt-1 text-[18px] font-semibold">08:00 עד שעה לפני כניסת שבת</dd></div>
              <div><dt className="text-[14px] opacity-70">מוצ״ש</dt><dd className="mt-1 text-[18px] font-semibold">שעה אחרי צאת שבת עד 23:30</dd></div>
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

      {count > 0 && !cartOpen && !dish && (
        <button onClick={() => setCartOpen(true)} className="btn btn-ink fixed inset-x-5 bottom-5 z-40 shadow-[0_6px_20px_rgba(0,0,0,0.25)] sm:inset-x-auto sm:left-5">
          <ShoppingBag className="h-5 w-5" /> להזמנה ({count}) · {nis(subtotal)}
        </button>
      )}

      {dish && <DishSheet d={dish} inCart={cart[dish.id] || 0} close={() => setDish(null)} onAdd={(q) => { add(dish.id, q); setDish(null); }} />}
      {cartOpen && <Checkout cart={cart} add={add} clear={() => setCart({})} close={() => setCartOpen(false)} subtotal={subtotal} />}
    </div>
  );
}

function DishRow({ d, qty, onOpen }: { d: Dish; qty: number; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="group flex w-full items-center gap-4 border-b border-[#2b1d0e]/15 py-4 text-right">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[10px] bg-[#2b1d0e]/10 md:h-28 md:w-28">
        <img src={thumb(d.id)} alt={d.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        {qty > 0 && <span className="absolute right-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#e9b23a] px-1.5 font-body text-[13px] font-bold">{qty}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="flex flex-wrap items-center gap-2 text-[19px] font-semibold leading-tight" style={{ fontFamily: "Fredoka" }}>
          {d.name}
          {d.tag && <span className="rounded-full bg-[#e9b23a] px-2.5 py-0.5 font-body text-[12px] font-bold">{d.tag}</span>}
        </h4>
        <p className="mt-1 font-body text-[15px] leading-snug text-[#2b1d0e]/65">{d.desc}</p>
        <p className="mt-1.5 font-body text-[17px] font-bold">{nis(d.price)}</p>
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2b1d0e]/70 transition-colors group-hover:bg-[#2b1d0e] group-hover:text-[#f9e3a6]">
        <Plus className="h-5 w-5" />
      </span>
    </button>
  );
}

/** Tapping a dish opens it big: photo, full description, quantity, add. */
function DishSheet({ d, inCart, close, onAdd }: { d: Dish; inCart: number; close: () => void; onAdd: (qty: number) => void }) {
  const [qty, setQty] = useState(1);
  const [shown, setShown] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setShown(true)); }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [close]);

  return (
    <div className={`fixed inset-0 z-[60] flex items-end justify-center bg-[#2b1d0e]/50 transition-opacity duration-200 md:items-center md:p-6 ${shown ? "opacity-100" : "opacity-0"}`} onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[94svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[18px] bg-[#f6ead0] transition-transform duration-300 ease-out md:rounded-[14px] ${shown ? "translate-y-0 md:scale-100" : "translate-y-10 md:scale-95"}`}
      >
        <div className="relative shrink-0">
          <img src={img(d.id)} alt={d.name} className="aspect-[4/3] max-h-[52svh] w-full object-cover" />
          <button onClick={close} className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f6ead0]/95 shadow" aria-label="סגירה">
            <X className="h-5 w-5" />
          </button>
          {d.tag && <span className="absolute right-3 top-3 rounded-full bg-[#e9b23a] px-3 py-1 font-body text-[13px] font-bold">{d.tag}</span>}
        </div>
        <div className="overflow-y-auto p-6">
          <p className="font-body text-[14px] font-semibold text-[#7a5413]">{d.cat}</p>
          <div className="mt-1 flex items-baseline justify-between gap-4">
            <h3 className="text-[30px] font-bold leading-tight">{d.name}</h3>
            <span className="shrink-0 font-body text-[22px] font-bold">{nis(d.price)}</span>
          </div>
          <p className="mt-3 font-body text-[17px] leading-relaxed text-[#2b1d0e]/80">{d.long}</p>
          {inCart > 0 && <p className="mt-3 font-body text-[14px] font-semibold text-[#7a5413]">כבר יש {inCart} בהזמנה שלך</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3 border-t border-[#2b1d0e]/10 p-4">
          <div className="flex items-center gap-1 rounded-[10px] border border-[#2b1d0e]/40">
            <button onClick={() => setQty(qty + 1)} className="p-3" aria-label="עוד אחד"><Plus className="h-4 w-4" /></button>
            <span className="w-6 text-center font-body text-[18px] font-bold">{qty}</span>
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3" aria-label="פחות אחד"><Minus className="h-4 w-4" /></button>
          </div>
          <button onClick={() => onAdd(qty)} className="btn btn-ink flex-1">
            הוספה להזמנה · {nis(d.price * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}

function Checkout({ cart, add, clear, close, subtotal }: { cart: Cart; add: (id: string, d?: number) => void; clear: () => void; close: () => void; subtotal: number }) {
  const [f, setF] = useState({ name: "", phone: "", type: "takeaway", table: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ id: string; total: number; type: string } | null>(null);
  const lines = Object.entries(cart).map(([id, qty]) => ({ d: MENU.find((m) => m.id === id)!, qty }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, items: lines.map((l) => ({ id: l.d.id, qty: l.qty })) }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "משהו השתבש, נסו שוב");
      setDone({ ...j, type: f.type });
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
              תודה! מספר הזמנה <b dir="ltr">#{done.id.slice(-5).toUpperCase()}</b>, סה״כ {nis(done.total)}.{" "}
              {done.type === "dinein" ? "שבו בנוח, המנות יגיעו לשולחן." : "נקרא לכם כשההזמנה מוכנה לאיסוף."}
            </p>
            <button onClick={close} className="btn btn-ink mt-8 w-full">חזרה לאתר</button>
          </div>
        ) : !lines.length ? (
          <p className="mt-6 font-body text-[17px] text-[#2b1d0e]/70">עדיין לא הוספתם מנות. בחרו משהו מהתפריט.</p>
        ) : (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
            <div>
              {lines.map(({ d, qty }) => (
                <div key={d.id} className="flex items-center gap-3 border-b border-[#2b1d0e]/15 py-3 font-body">
                  <img src={thumb(d.id)} alt="" className="h-14 w-14 shrink-0 rounded-[8px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold leading-tight">{d.name}</div>
                    <div className="text-[14px] text-[#2b1d0e]/60">{nis(d.price * qty)}</div>
                  </div>
                  <div className="flex items-center gap-1 rounded-[10px] border border-[#2b1d0e]/40">
                    <button type="button" onClick={() => add(d.id, 1)} className="p-2" aria-label="עוד אחד"><Plus className="h-4 w-4" /></button>
                    <span className="w-5 text-center font-bold">{qty}</span>
                    <button type="button" onClick={() => add(d.id, -1)} className="p-2" aria-label="פחות אחד"><Minus className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ORDER_TYPES.map(([v, l, s]) => (
                <button type="button" key={v} onClick={() => setF({ ...f, type: v })}
                  className={`rounded-[10px] border p-3 text-right font-body transition ${f.type === v ? "border-[#2b1d0e] bg-[#2b1d0e] text-[#f9e3a6]" : "border-[#2b1d0e]/25 hover:border-[#2b1d0e]/60"}`}>
                  <div className="text-[17px] font-bold">{l}</div>
                  <div className={`text-[13px] ${f.type === v ? "text-[#f9e3a6]/70" : "text-[#2b1d0e]/55"}`}>{s}</div>
                </button>
              ))}
            </div>

            <label><span className="label">שם</span><input required className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label><span className="label">טלפון</span><input required type="tel" dir="ltr" className="field text-right" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
            {f.type === "dinein" && (
              <label><span className="label">מספר שולחן (אם כבר יושבים)</span><input inputMode="numeric" className="field" value={f.table} onChange={(e) => setF({ ...f, table: e.target.value })} /></label>
            )}
            <label><span className="label">הערות למטבח</span><textarea rows={2} className="field" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
            <div className="border-t border-[#2b1d0e]/20 pt-4 font-body text-[17px]">
              <div className="flex justify-between text-[22px] font-bold"><span>לתשלום</span><span>{nis(subtotal)}</span></div>
              <p className="mt-1 text-[14px] text-[#2b1d0e]/60">משלמים בקופה, במזומן או באשראי.</p>
            </div>
            {err && <p className="rounded-[10px] bg-[#8b1d0e]/10 px-4 py-3 font-body font-semibold text-[#8b1d0e]">{err}</p>}
            <button disabled={busy} className="btn btn-ink disabled:opacity-60">{busy ? "שולחים..." : "שליחת הזמנה"}</button>
          </form>
        )}
      </aside>
    </div>
  );
}
