import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { Auth } from "../../auth.js";

type AuthVariables = {
  user: Auth["$Infer"]["Session"]["user"] | null;
  session: Auth["$Infer"]["Session"]["session"] | null;
};

const mockUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Test User",
  email: "test@example.com",
  emailVerified: false,
  image: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const mockTask = {
  id: "660e8400-e29b-41d4-a716-446655440000",
  title: "テストタスク",
  description: null,
  date: "2026-03-15",
  status: "todo" as const,
  userId: mockUser.id,
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
};

// DB モック
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("../../db/index.js", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: mockSelect,
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: mockInsert,
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: mockUpdate,
        }),
      }),
    }),
    delete: () => ({
      where: () => ({
        returning: mockDelete,
      }),
    }),
  }),
}));

vi.mock("../../db/schema.js", async () => {
  const actual = await vi.importActual("../../db/schema.js");
  return actual;
});

/**
 * テスト用の Hono app を作成する。
 * 認証済みユーザーを Variables にセットした状態で tasks ルートをマウントする。
 */
async function createTestApp(user: AuthVariables["user"] = mockUser) {
  const tasksApp = (await import("../tasks.js")).default;

  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", async (c, next) => {
    c.set("user", user);
    c.set("session", null);
    await next();
  });
  app.route("/api/tasks", tasksApp);
  return app;
}

function jsonRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Request {
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new Request(`http://localhost${path}`, init);
}

// ─── テスト ───

describe("認証ミドルウェア", () => {
  it("未認証の場合 401 を返す", async () => {
    const app = await createTestApp(null);
    const res = await app.request(
      jsonRequest("GET", "/api/tasks?year=2026&month=3"),
    );
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("認証が必要です");
  });
});

describe("GET /api/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("year, month を指定してタスク一覧を取得できる", async () => {
    mockSelect.mockResolvedValue([mockTask]);
    const app = await createTestApp();

    const res = await app.request(
      jsonRequest("GET", "/api/tasks?year=2026&month=3"),
    );
    expect(res.status).toBe(200);

    const json = (await res.json()) as (typeof mockTask)[];
    expect(json).toHaveLength(1);
    expect(json[0].title).toBe("テストタスク");
    expect(json[0].id).toBe(mockTask.id);
    expect(mockSelect).toHaveBeenCalled();
  });

  it("year が未指定の場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(jsonRequest("GET", "/api/tasks?month=3"));
    expect(res.status).toBe(400);
  });

  it("month が未指定の場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(jsonRequest("GET", "/api/tasks?year=2026"));
    expect(res.status).toBe(400);
  });

  it("month が範囲外の場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(
      jsonRequest("GET", "/api/tasks?year=2026&month=13"),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タスクを作成できる", async () => {
    mockInsert.mockResolvedValue([mockTask]);
    const app = await createTestApp();

    const res = await app.request(
      jsonRequest("POST", "/api/tasks", {
        title: "テストタスク",
        date: "2026-03-15",
      }),
    );
    expect(res.status).toBe(201);

    const json = (await res.json()) as { title: string };
    expect(json.title).toBe("テストタスク");
  });

  it("title が空の場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(
      jsonRequest("POST", "/api/tasks", {
        title: "",
        date: "2026-03-15",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("date が不正な場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(
      jsonRequest("POST", "/api/tasks", {
        title: "テスト",
        date: "invalid-date",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("リクエストボディがない場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("status を指定してタスクを作成できる", async () => {
    const doneTask = { ...mockTask, status: "done" };
    mockInsert.mockResolvedValue([doneTask]);
    const app = await createTestApp();

    const res = await app.request(
      jsonRequest("POST", "/api/tasks", {
        title: "完了タスク",
        date: "2026-03-15",
        status: "done",
      }),
    );
    expect(res.status).toBe(201);

    const json = (await res.json()) as { status: string };
    expect(json.status).toBe("done");
  });
});

describe("PATCH /api/tasks/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タスクを更新できる", async () => {
    const updatedTask = { ...mockTask, title: "更新後タスク" };
    mockUpdate.mockResolvedValue([updatedTask]);
    const app = await createTestApp();

    const res = await app.request(
      jsonRequest("PATCH", `/api/tasks/${mockTask.id}`, {
        title: "更新後タスク",
      }),
    );
    expect(res.status).toBe(200);

    const json = (await res.json()) as { title: string };
    expect(json.title).toBe("更新後タスク");
  });

  it("存在しないタスクの場合 404 を返す", async () => {
    mockUpdate.mockResolvedValue([]);
    const app = await createTestApp();

    const res = await app.request(
      jsonRequest("PATCH", "/api/tasks/770e8400-e29b-41d4-a716-446655440000", {
        title: "テスト",
      }),
    );
    expect(res.status).toBe(404);
  });

  it("不正な UUID の場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(
      jsonRequest("PATCH", "/api/tasks/invalid-uuid", { title: "テスト" }),
    );
    expect(res.status).toBe(400);
  });

  it("リクエストボディがない場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(
      new Request(`http://localhost/api/tasks/${mockTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/tasks/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タスクを削除できる", async () => {
    mockDelete.mockResolvedValue([mockTask]);
    const app = await createTestApp();

    const res = await app.request(
      jsonRequest("DELETE", `/api/tasks/${mockTask.id}`),
    );
    expect(res.status).toBe(200);

    const json = (await res.json()) as { message: string };
    expect(json.message).toBe("タスクを削除しました");
  });

  it("存在しないタスクの場合 404 を返す", async () => {
    mockDelete.mockResolvedValue([]);
    const app = await createTestApp();

    const res = await app.request(
      jsonRequest("DELETE", "/api/tasks/770e8400-e29b-41d4-a716-446655440000"),
    );
    expect(res.status).toBe(404);
  });

  it("不正な UUID の場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(
      jsonRequest("DELETE", "/api/tasks/invalid-uuid"),
    );
    expect(res.status).toBe(400);
  });
});
