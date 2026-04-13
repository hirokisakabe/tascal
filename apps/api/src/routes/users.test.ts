import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { Auth } from "../auth.js";

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

const mockDelete = vi.fn();

vi.mock("../db/index.js", () => ({
  getDb: () => ({
    delete: () => ({
      where: () => ({
        returning: mockDelete,
      }),
    }),
  }),
}));

vi.mock("../db/schema.js", async () => {
  const actual = await vi.importActual("../db/schema.js");
  return actual;
});

async function createTestApp(user: AuthVariables["user"] = mockUser) {
  const usersApp = (await import("./users.js")).default;

  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", async (c, next) => {
    c.set("user", user);
    c.set("session", null);
    await next();
  });
  app.route("/api/users", usersApp);
  return app;
}

describe("DELETE /api/users/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未認証の場合 401 を返す", async () => {
    const app = await createTestApp(null);
    const res = await app.request(
      new Request("http://localhost/api/users/me", { method: "DELETE" }),
    );
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("認証が必要です");
  });

  it("アカウントを削除できる", async () => {
    mockDelete.mockResolvedValue([mockUser]);
    const app = await createTestApp();

    const res = await app.request(
      new Request("http://localhost/api/users/me", { method: "DELETE" }),
    );
    expect(res.status).toBe(200);

    const json = (await res.json()) as { message: string };
    expect(json.message).toBe("アカウントを削除しました");
    expect(mockDelete).toHaveBeenCalled();
  });

  it("ユーザーが見つからない場合 404 を返す", async () => {
    mockDelete.mockResolvedValue([]);
    const app = await createTestApp();

    const res = await app.request(
      new Request("http://localhost/api/users/me", { method: "DELETE" }),
    );
    expect(res.status).toBe(404);

    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("ユーザーが見つかりません");
  });
});
