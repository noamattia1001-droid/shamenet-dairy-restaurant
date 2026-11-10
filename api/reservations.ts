import { save, all, get, newId, isAdmin, body, clean } from "./_store.js";
import { AREAS, TIMES } from "../src/data/menu.js";

const STATUSES = ["pending", "confirmed", "seated", "cancelled"];

/** Seats already taken per area for one date + time. */
async function taken(date: string, time: string) {
  const out: Record<string, number> = {};
  for (const r of await all("reservations")) {
    if (r.date === date && r.time === time && r.status !== "cancelled") out[r.area] = (out[r.area] || 0) + r.guests;
  }
  return out;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const url = new URL(req.url, "http://x");

    // Public: free seats per area for a slot.
    if (req.method === "GET" && url.searchParams.get("date")) {
      const t = await taken(url.searchParams.get("date")!, url.searchParams.get("time") || "");
      return res.json(Object.fromEntries(AREAS.map((a) => [a.id, Math.max(0, a.capacity - (t[a.id] || 0))])));
    }

    if (req.method === "POST") {
      const b = await body(req);
      const name = clean(b.name, 60), phone = clean(b.phone, 20);
      const date = clean(b.date, 10), time = clean(b.time, 5);
      const guests = Math.round(Number(b.guests));
      const area = AREAS.find((a) => a.id === b.area);
      if (name.length < 2 || !/^0\d{8,9}$/.test(phone.replace(/\D/g, ""))) return res.status(400).json({ error: "חסר שם או טלפון תקין" });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !TIMES.includes(time)) return res.status(400).json({ error: "תאריך או שעה לא תקינים" });
      if (date < new Date(Date.now() - 864e5).toISOString().slice(0, 10)) return res.status(400).json({ error: "התאריך עבר" });
      if (!area || !(guests >= 1 && guests <= 16)) return res.status(400).json({ error: "בחרו אזור ומספר סועדים" });
      if (area.id === "bar" && guests > 2) return res.status(400).json({ error: "בבר אפשר עד 2 סועדים" });
      if (area.id === "private" && guests < 8) return res.status(400).json({ error: "החדר הפרטי מ־8 סועדים" });
      const free = area.capacity - ((await taken(date, time))[area.id] || 0);
      if (guests > free) return res.status(409).json({ error: `נשארו רק ${free} מקומות ב${area.name} בשעה הזו` });
      const rec = {
        id: newId(), kind: "reservation", createdAt: new Date().toISOString(), status: "pending",
        name, phone, date, time, guests, area: area.id, notes: clean(b.notes, 400),
      };
      await save("reservations", rec);
      return res.status(201).json({ id: rec.id });
    }

    if (!isAdmin(req)) return res.status(401).json({ error: "סיסמה שגויה" });

    if (req.method === "GET") {
      const list = (await all("reservations")).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      return res.json(list);
    }
    if (req.method === "PATCH") {
      const b = await body(req);
      if (!STATUSES.includes(b.status)) return res.status(400).json({ error: "סטטוס לא תקין" });
      const rec = await get("reservations", clean(b.id, 40));
      if (!rec) return res.status(404).json({ error: "לא נמצא" });
      rec.status = b.status;
      await save("reservations", rec);
      return res.json(rec);
    }
    res.status(405).end();
  } catch (e: any) {
    res.status(500).json({ error: "שגיאת שרת", detail: String(e?.message || e) });
  }
}
