import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

vi.mock("../logger.js", () => ({
  default: mockLogger,
}));

vi.mock("../db/index.js", () => ({
  getDb: () => ({
    execute: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  }),
}));

vi.mock("../auth.js", () => ({
  getAuth: () => ({
    api: { getSession: vi.fn().mockResolvedValue(null) },
    handler: vi.fn(),
  }),
}));

const { default: app } = await import("../app.js");

describe("リクエストログミドルウェア", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("API リクエストのログが出力される", async () => {
    const res = await app.request(
      new Request("http://localhost/api/tasks?year=2026&month=3"),
    );

    // 認証なしなので 401 が返る
    expect(res.status).toBe(401);
    expect(mockLogger.warn).toHaveBeenCalledOnce();
    const [logObj, logMsg] = mockLogger.warn.mock.calls[0] as [
      Record<string, unknown>,
      string,
    ];
    expect(logObj.method).toBe("GET");
    expect(logObj.path).toBe("/api/tasks");
    expect(logObj.status).toBe(401);
    expect(typeof logObj.duration).toBe("number");
    expect(logMsg).toContain("GET /api/tasks 401");
  });

  it("/healthz のリクエストはログから除外される", async () => {
    await app.request("/healthz");

    expect(mockLogger.info).not.toHaveBeenCalled();
    expect(mockLogger.warn).not.toHaveBeenCalled();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });
});
