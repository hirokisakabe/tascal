import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { users } from "../db/schema.js";
import type { Auth } from "../auth.js";

type AuthVariables = {
  user: Auth["$Infer"]["Session"]["user"] | null;
  session: Auth["$Infer"]["Session"]["session"] | null;
};

const app = new Hono<{ Variables: AuthVariables }>();

// 認証ミドルウェア
app.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "認証が必要です" }, 401);
  }
  await next();
});

// DELETE /api/users/me
app.delete("/me", async (c) => {
  const user = c.get("user")!;

  const [deleted] = await getDb()
    .delete(users)
    .where(eq(users.id, user.id))
    .returning();

  if (!deleted) {
    return c.json({ error: "ユーザーが見つかりません" }, 404);
  }

  return c.json({ message: "アカウントを削除しました" });
});

export default app;
