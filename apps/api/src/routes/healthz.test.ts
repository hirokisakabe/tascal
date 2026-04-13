import { describe, it, expect, vi } from "vitest";

const mockExecute = vi.fn();

vi.mock("../db/index.js", () => ({
  getDb: () => ({
    execute: mockExecute,
  }),
}));

vi.mock("../auth.js", () => ({
  getAuth: () => ({
    api: { getSession: vi.fn().mockResolvedValue(null) },
    handler: vi.fn(),
  }),
}));

const { default: app } = await import("../app.js");

describe("GET /healthz", () => {
  it("DB 接続成功時に 200 と { status: 'ok' } を返す", async () => {
    mockExecute.mockResolvedValueOnce([{ "?column?": 1 }]);

    const res = await app.request("/healthz");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    expect(mockExecute).toHaveBeenCalled();
  });

  it("DB 接続失敗時に 503 と { status: 'error' } を返す", async () => {
    mockExecute.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await app.request("/healthz");

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: "error" });
  });
});
