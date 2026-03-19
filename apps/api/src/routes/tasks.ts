import { Hono } from "hono";
import { z } from "zod";
import { eq, and, gte, lt } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { tasks } from "../db/schema.js";
import type { Auth } from "../auth.js";

type AuthVariables = {
  user: Auth["$Infer"]["Session"]["user"] | null;
  session: Auth["$Infer"]["Session"]["session"] | null;
};

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  date: z.string().date("日付はYYYY-MM-DD形式の実在する日付で指定してください"),
  status: z.enum(["todo", "done"]).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  date: z
    .string()
    .date("日付はYYYY-MM-DD形式の実在する日付で指定してください")
    .optional(),
  status: z.enum(["todo", "done"]).optional(),
});

const listQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

const app = new Hono<{ Variables: AuthVariables }>();

// 認証ミドルウェア
app.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "認証が必要です" }, 401);
  }
  await next();
});

// GET /api/tasks?year=YYYY&month=MM
app.get("/", async (c) => {
  const user = c.get("user")!;

  const parsed = listQuerySchema.safeParse({
    year: c.req.query("year"),
    month: c.req.query("month"),
  });

  if (!parsed.success) {
    return c.json(
      {
        error: "year と month のクエリパラメータが必要です",
        details: parsed.error.issues,
      },
      400,
    );
  }

  const { year, month } = parsed.data;
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const result = await getDb()
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, user.id),
        gte(tasks.date, startDate),
        lt(tasks.date, endDate),
      ),
    );

  return c.json(result);
});

// POST /api/tasks
app.post("/", async (c) => {
  const user = c.get("user")!;

  const body: unknown = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "リクエストボディが不正です" }, 400);
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "バリデーションエラー", details: parsed.error.issues },
      400,
    );
  }

  const [task] = await getDb()
    .insert(tasks)
    .values({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      date: parsed.data.date,
      status: parsed.data.status ?? "todo",
      userId: user.id,
    })
    .returning();

  return c.json(task, 201);
});

// PATCH /api/tasks/:id
app.patch("/:id", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");

  const uuidSchema = z.string().uuid();
  if (!uuidSchema.safeParse(id).success) {
    return c.json({ error: "不正なタスクIDです" }, 400);
  }

  const body: unknown = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "リクエストボディが不正です" }, 400);
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "バリデーションエラー", details: parsed.error.issues },
      400,
    );
  }

  const [updated] = await getDb()
    .update(tasks)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning();

  if (!updated) {
    return c.json({ error: "タスクが見つかりません" }, 404);
  }

  return c.json(updated);
});

// DELETE /api/tasks/:id
app.delete("/:id", async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");

  const uuidSchema = z.string().uuid();
  if (!uuidSchema.safeParse(id).success) {
    return c.json({ error: "不正なタスクIDです" }, 400);
  }

  const [deleted] = await getDb()
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning();

  if (!deleted) {
    return c.json({ error: "タスクが見つかりません" }, 404);
  }

  return c.json({ message: "タスクを削除しました" });
});

export default app;
