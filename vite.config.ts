import path from "path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Dev only: serve /api/* from the same files Vercel runs in production.
const devApi = (): Plugin => ({
  name: "dev-api",
  configureServer(server) {
    server.middlewares.use(async (req: any, res: any, next) => {
      const m = req.url?.match(/^\/api\/(\w+)/);
      if (!m) return next();
      try {
        const mod = await server.ssrLoadModule(`/api/${m[1]}.ts`);
        res.status = (c: number) => ((res.statusCode = c), res);
        res.json = (d: unknown) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(d)); };
        await mod.default(req, res);
      } catch (e) { res.statusCode = 500; res.end(String(e)); }
    });
  },
});

export default defineConfig({
  plugins: [react(), devApi()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
