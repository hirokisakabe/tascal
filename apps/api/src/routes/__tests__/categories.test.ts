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

const mockCategory = {
  id: "660e8400-e29b-41d4-a716-446655440000",
  name: "仕事",
  color: "blue" as const,
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
        where: () => ({
          orderBy: mockSelect,
        }),
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

async function createTestApp(user: AuthVariables["user"] = mockUser) {
  const categoriesApp = (await import("../categories.js")).default;

  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", async (c, next) => {
    c.set("user", user);
    c.set("session", null);
    await next();
  });
  app.route("/api/categories", categoriesApp);
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
    const res = await app.request(jsonRequest("GET", "/api/categories"));
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("認証が必要です");
  });
});

describe("GET /api/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("カテゴリ一覧を取得できる", async () => {
    mockSelect.mockResolvedValue([mockCategory]);
    const app = await createTestApp();

    const res = await app.request(jsonRequest("GET", "/api/categories"));
    expect(res.status).toBe(200);

    const json = (await res.json()) as (typeof mockCategory)[];
    expect(json).toHaveLength(1);
    expect(json[0].name).toBe("仕事");
    expect(json[0].color).toBe("blue");
    expect(mockSelect).toHaveBeenCalled();
  });
});

describe("POST /api/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("カテゴリを作成できる", async () => {
    mockInsert.mockResolvedValue([mockCategory]);
    const app = await createTestApp();

    const res = await app.request(
      jsonRequest("POST", "/api/categories", {
        name: "仕事",
        color: "blue",
      }),
    );
    expect(res.status).toBe(201);

    const json = (await res.json()) as { name: string; color: string };
    expect(json.name).toBe("仕事");
    expect(json.color).toBe("blue");
  });

  it("name が空の場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(
      jsonRequest("POST", "/api/categories", {
        name: "",
        color: "blue",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("color が不正な場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(
      jsonRequest("POST", "/api/categories", {
        name: "テスト",
        color: "invalid-color",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("name が未指定の場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(
      jsonRequest("POST", "/api/categories", {
        color: "blue",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("color が未指定の場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(
      jsonRequest("POST", "/api/categories", {
        name: "テスト",
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/categories/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("カテゴリを更新できる", async () => {
    const updatedCategory = { ...mockCategory, name: "プライベート" };
    mockUpdate.mockResolvedValue([updatedCategory]);
    const app = await createTestApp();

    const res = await app.request(
      jsonRequest("PATCH", `/api/categories/${mockCategory.id}`, {
        name: "プライベート",
      }),
    );
    expect(res.status).toBe(200);

    const json = (await res.json()) as { name: string };
    expect(json.name).toBe("プライベート");
  });

  it("存在しないカテゴリの場合 404 を返す", async () => {
    mockUpdate.mockResolvedValue([]);
    const app = await createTestApp();

    const res = await app.request(
      jsonRequest(
        "PATCH",
        "/api/categories/770e8400-e29b-41d4-a716-446655440000",
        { name: "テスト" },
      ),
    );
    expect(res.status).toBe(404);
  });

  it("不正な UUID の場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(
      jsonRequest("PATCH", "/api/categories/invalid-uuid", { name: "テスト" }),
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/categories/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("カテゴリを削除できる", async () => {
    mockDelete.mockResolvedValue([mockCategory]);
    const app = await createTestApp();

    const res = await app.request(
      jsonRequest("DELETE", `/api/categories/${mockCategory.id}`),
    );
    expect(res.status).toBe(200);

    const json = (await res.json()) as { message: string };
    expect(json.message).toBe("カテゴリを削除しました");
  });

  it("存在しないカテゴリの場合 404 を返す", async () => {
    mockDelete.mockResolvedValue([]);
    const app = await createTestApp();

    const res = await app.request(
      jsonRequest(
        "DELETE",
        "/api/categories/770e8400-e29b-41d4-a716-446655440000",
      ),
    );
    expect(res.status).toBe(404);
  });

  it("不正な UUID の場合 400 を返す", async () => {
    const app = await createTestApp();
    const res = await app.request(
      jsonRequest("DELETE", "/api/categories/invalid-uuid"),
    );
    expect(res.status).toBe(400);
  });
});
