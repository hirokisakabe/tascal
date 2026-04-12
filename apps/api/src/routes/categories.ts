import { Hono, type Env } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { Hook } from "@hono/zod-validator";
import { eq, and, asc } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { categories } from "../db/schema.js";
import type { Auth } from "../auth.js";

type AuthVariables = {
  user: Auth["$Infer"]["Session"]["user"] | null;
  session: Auth["$Infer"]["Session"]["session"] | null;
};

const VALID_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
] as const;

const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  color: z.enum(VALID_COLORS),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  color: z.enum(VALID_COLORS).optional(),
});

const paramIdSchema = z.object({
  id: z.string().uuid("不正なカテゴリIDです"),
});

function validationHook(errorMessage: string): Hook<unknown, Env, string> {
  return (result, c) => {
    if (!result.success) {
      return c.json({ error: errorMessage, details: result.error.issues }, 400);
    }
  };
}

const app = new Hono<{ Variables: AuthVariables }>();

// 認証ミドルウェア
app.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "認証が必要です" }, 401);
  }
  await next();
});

// GET /api/categories
app.get("/", async (c) => {
  const user = c.get("user")!;

  const result = await getDb()
    .select()
    .from(categories)
    .where(eq(categories.userId, user.id))
    .orderBy(asc(categories.createdAt));

  return c.json(result);
});

// POST /api/categories
app.post(
  "/",
  zValidator(
    "json",
    createCategorySchema,
    validationHook("バリデーションエラー"),
  ),
  async (c) => {
    const user = c.get("user")!;
    const data = c.req.valid("json");

    const [category] = await getDb()
      .insert(categories)
      .values({
        name: data.name,
        color: data.color,
        userId: user.id,
      })
      .returning();

    return c.json(category, 201);
  },
);

// PATCH /api/categories/:id
app.patch(
  "/:id",
  zValidator("param", paramIdSchema, validationHook("不正なカテゴリIDです")),
  zValidator(
    "json",
    updateCategorySchema,
    validationHook("バリデーションエラー"),
  ),
  async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");

    const [updated] = await getDb()
      .update(categories)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
      .returning();

    if (!updated) {
      return c.json({ error: "カテゴリが見つかりません" }, 404);
    }

    return c.json(updated);
  },
);

// DELETE /api/categories/:id
app.delete(
  "/:id",
  zValidator("param", paramIdSchema, validationHook("不正なカテゴリIDです")),
  async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.valid("param");

    const [deleted] = await getDb()
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
      .returning();

    if (!deleted) {
      return c.json({ error: "カテゴリが見つかりません" }, 404);
    }

    return c.json({ message: "カテゴリを削除しました" });
  },
);

export default app;
