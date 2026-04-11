import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getAuth } from "./auth.js";
import type { Auth } from "./auth.js";
import tasksApp from "./routes/tasks.js";

type AuthVariables = {
  user: Auth["$Infer"]["Session"]["user"] | null;
  session: Auth["$Infer"]["Session"]["session"] | null;
};

const app = new Hono<{ Variables: AuthVariables }>();

const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin) {
  app.use(
    "/api/*",
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );
}

// セッション取得ミドルウェア
app.use("/api/*", async (c, next) => {
  const session = await getAuth().api.getSession({
    headers: c.req.raw.headers,
  });

  if (session) {
    c.set("user", session.user);
    c.set("session", session.session);
  } else {
    c.set("user", null);
    c.set("session", null);
  }

  await next();
});

app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return getAuth().handler(c.req.raw);
});

app.route("/api/tasks", tasksApp);

// SPA 静的ファイル配信（本番用）
app.use("*", serveStatic({ root: "./public" }));

// SPA fallback: API 以外のルートで index.html を返す
app.get("*", (c, next) => {
  if (c.req.path.startsWith("/api/")) {
    return next();
  }
  return serveStatic({ root: "./public", path: "index.html" })(c, next);
});

const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
