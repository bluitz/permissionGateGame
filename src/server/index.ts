/**
 * The whole server: a health check and the static game files.
 * All game logic runs in the browser; there is no API and no secret.
 */
import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));
app.use("/*", serveStatic({ root: "./public" }));

const port = Number(process.env.PORT ?? 3000);
console.log(`Gatekeeper listening on http://localhost:${port}`);

export default { port, fetch: app.fetch };
