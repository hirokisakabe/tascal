import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, gte, lt, asc, isNull } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { categories, tasks } from "../db/schema.js";
import type { Auth } from "../auth.js";

type AuthVariables = {
  user: Auth["$Infer"]["Session"]["user"] | null;
  session: Auth["$Infer"]["Session"]["session"] | null;
};

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  date: z
    .string()
    .date("日付はYYYY-MM-DD形式の実在する日付で指定してください")
    .nullable()
    .optional(),
  status: z.enum(["todo", "done"]).optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  date: z
    .string()
    .date("日付はYYYY-MM-DD形式の実在する日付で指定してください")
    .nullable()
    .optional(),
  status: z.enum(["todo", "done"]).optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

const listQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

const paramIdSchema = z.object({
  id: z.string().uuid("不正なタスクIDです"),
});

const app = new Hono<{ Variables: AuthVariables }>()
  // 認証ミドルウェア
  .use("*", async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "認証が必要です" }, 401);
    }
    await next();
  })
  // GET /api/tasks?year=YYYY&month=MM
  .get("/", zValidator("query", listQuerySchema), async (c) => {
    const user = c.get("user")!;
    const { year, month } = c.req.valid("query");

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
      )
      .orderBy(asc(tasks.status), asc(tasks.createdAt));

    return c.json(result);
  })
  // GET /api/tasks/unscheduled
  .get("/unscheduled", async (c) => {
    const user = c.get("user")!;

    const result = await getDb()
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, user.id), isNull(tasks.date)))
      .orderBy(asc(tasks.status), asc(tasks.createdAt));

    return c.json(result);
  })
  // POST /api/tasks
  .post("/", zValidator("json", createTaskSchema), async (c) => {
    const user = c.get("user")!;
    const data = c.req.valid("json");
    const categoryId = data.categoryId ?? null;

    if (categoryId) {
      const [cat] = await getDb()
        .select()
        .from(categories)
        .where(
          and(eq(categories.id, categoryId), eq(categories.userId, user.id)),
        );
      if (!cat) {
        return c.json({ error: "カテゴリが見つかりません" }, 400);
      }
    }

    const [task] = await getDb()
      .insert(tasks)
      .values({
        title: data.title,
        description: data.description ?? null,
        date: data.date ?? null,
        status: data.status ?? "todo",
        categoryId,
        userId: user.id,
      })
      .returning();

    return c.json(task, 201);
  })
  // PATCH /api/tasks/:id
  .patch(
    "/:id",
    zValidator("param", paramIdSchema),
    zValidator("json", updateTaskSchema),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");

      if (data.categoryId) {
        const [cat] = await getDb()
          .select()
          .from(categories)
          .where(
            and(
              eq(categories.id, data.categoryId),
              eq(categories.userId, user.id),
            ),
          );
        if (!cat) {
          return c.json({ error: "カテゴリが見つかりません" }, 400);
        }
      }

      const [updated] = await getDb()
        .update(tasks)
        .set({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
        .returning();

      if (!updated) {
        return c.json({ error: "タスクが見つかりません" }, 404);
      }

      return c.json(updated);
    },
  )
  // DELETE /api/tasks/:id
  .delete("/:id", zValidator("param", paramIdSchema), async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.valid("param");

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
