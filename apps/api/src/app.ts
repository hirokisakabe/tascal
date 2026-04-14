import { serveStatic } from "@hono/node-server/serve-static";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { cors } from "hono/cors";
import { getAuth } from "./auth.js";
import type { Auth } from "./auth.js";
import { getDb } from "./db/index.js";
import logger from "./logger.js";
import categoriesApp from "./routes/categories.js";
import tasksApp from "./routes/tasks.js";
import usersApp from "./routes/users.js";

type AuthVariables = {
  user: Auth["$Infer"]["Session"]["user"] | null;
  session: Auth["$Infer"]["Session"]["session"] | null;
};

const SKIP_LOG_PATHS = new Set(["/healthz"]);

const app = new Hono<{ Variables: AuthVariables }>();

// リクエストログミドルウェア
app.use("*", async (c, next) => {
  if (SKIP_LOG_PATHS.has(c.req.path)) {
    await next();
    return;
  }

  const start = Date.now();
  try {
    await next();
  } finally {
    const duration = Date.now() - start;
    const status = c.res.status;
    const logLevel = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

    logger[logLevel](
      {
        method: c.req.method,
        path: c.req.path,
        status,
        duration,
      },
      `${c.req.method} ${c.req.path} ${status} ${duration}ms`,
    );
  }
});

// エラーハンドリング
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    logger.warn(
      {
        method: c.req.method,
        path: c.req.path,
        status: err.status,
      },
      `HTTP error: ${err.message}`,
    );
    return err.getResponse();
  }

  logger.error(
    {
      err,
      method: c.req.method,
      path: c.req.path,
    },
    `Unhandled error: ${err.message}`,
  );
  return c.json({ error: "Internal Server Error" }, 500);
});

// ヘルスチェック（認証不要）
app.get("/healthz", async (c) => {
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    return c.json({ status: "ok" }, 200);
  } catch {
    return c.json({ status: "error" }, 503);
  }
});

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

// RPC 型推論のためチェイン形式でルートをマウント
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
  .route("/api/categories", categoriesApp)
  .route("/api/tasks", tasksApp)
  .route("/api/users", usersApp);

/** @public Web・CLI の hc<AppType> で参照 */
export type AppType = typeof routes;

// SPA 静的ファイル配信（本番用）
app.use("*", serveStatic({ root: "./public" }));

// SPA fallback: API 以外のルートで index.html を返す
app.get("*", (c, next) => {
  if (c.req.path.startsWith("/api/")) {
    return next();
  }
  return serveStatic({ root: "./public", path: "index.html" })(c, next);
});

export default app;
