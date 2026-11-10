// Shared storage: one JSON blob per record in Vercel Blob.
// Without BLOB_READ_WRITE_TOKEN (local dev) it falls back to an in-memory map.
import { put, list } from "@vercel/blob";

export const PASSWORD = "1001";
const g = globalThis as any;
const mem: Map<string, any> = g.__shamenetMem || (g.__shamenetMem = new Map());
const hasBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

export async function save(kind: string, rec: any) {
  if (!hasBlob()) { mem.set(`${kind}/${rec.id}`, rec); return rec; }
  await put(`${kind}/${rec.id}.json`, JSON.stringify(rec), {
    access: "public", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 0,
  });
  return rec;
}

export async function all(kind: string): Promise<any[]> {
  if (!hasBlob()) return [...mem.entries()].filter(([k]) => k.startsWith(kind + "/")).map(([, v]) => v);
  const out: any[] = [];
  let cursor: string | undefined;
  do {
    const r = await list({ prefix: `${kind}/`, cursor, limit: 1000 });
    out.push(...r.blobs);
    cursor = r.cursor;
  } while (cursor);
  const recs = await Promise.all(
    out.map((b) => fetch(`${b.url}?t=${Date.now()}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null)),
  );
  return recs.filter(Boolean);
}

export async function get(kind: string, id: string) {
  return (await all(kind)).find((r) => r.id === id) || null;
}

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const isAdmin = (req: any) => req.headers["x-pass"] === PASSWORD;

export async function body(req: any) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString() || "{}");
}

export const clean = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
