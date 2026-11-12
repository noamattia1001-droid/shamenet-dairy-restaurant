import { save, all, get, newId, isAdmin, body, clean } from "./_store.js";
import { MENU } from "../src/data/menu.js";

const STATUSES = ["new", "preparing", "ready", "done", "cancelled"];

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "POST") {
      const b = await body(req);
      const items = (Array.isArray(b.items) ? b.items : [])
        .map((i: any) => {
          const d = MENU.find((m) => m.id === i.id);
          const qty = Math.max(1, Math.min(20, Number(i.qty) || 1));
          return d ? { id: d.id, name: d.name, price: d.price, qty } : null;
        })
        .filter(Boolean);
      const name = clean(b.name, 60), phone = clean(b.phone, 20);
      const type = b.type === "dinein" ? "dinein" : "takeaway";
      const table = type === "dinein" ? clean(b.table, 10) : "";
      if (!items.length) return res.status(400).json({ error: "העגלה ריקה" });
      if (name.length < 2 || !/^0\d{8,9}$/.test(phone.replace(/\D/g, ""))) return res.status(400).json({ error: "חסר שם או טלפון תקין" });
      const subtotal = items.reduce((s: number, i: any) => s + i.price * i.qty, 0);
      const rec = {
        id: newId(), kind: "order", createdAt: new Date().toISOString(), status: "new",
        name, phone, type, table, notes: clean(b.notes, 400), items,
        subtotal, total: subtotal,
      };
      await save("orders", rec);
      return res.status(201).json({ id: rec.id, total: rec.total });
    }

    if (!isAdmin(req)) return res.status(401).json({ error: "סיסמה שגויה" });

    if (req.method === "GET") {
      const list = (await all("orders")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return res.json(list);
    }
    if (req.method === "PATCH") {
      const b = await body(req);
      if (!STATUSES.includes(b.status)) return res.status(400).json({ error: "סטטוס לא תקין" });
      const rec = await get("orders", clean(b.id, 40));
      if (!rec) return res.status(404).json({ error: "לא נמצא" });
      rec.status = b.status;
      await save("orders", rec);
      return res.json(rec);
    }
    res.status(405).end();
  } catch (e: any) {
    res.status(500).json({ error: "שגיאת שרת", detail: String(e?.message || e) });
  }
}
