import { isAdmin } from "./_store.js";

export default function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  if (isAdmin(req)) return res.json({ ok: true });
  res.status(401).json({ error: "סיסמה שגויה" });
}
