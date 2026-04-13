import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

vi.mock("consola", () => ({
  consola: { error: vi.fn() },
}));

vi.mock("./config.js", () => ({
  readConfig: vi.fn(),
  getApiUrl: vi.fn(),
}));

import { consola } from "consola";
import { readConfig, getApiUrl } from "./config.js";
import { requireAuth, apiRequest, handleApiError } from "./api.js";

const mockedReadConfig = vi.mocked(readConfig);
const mockedGetApiUrl = vi.mocked(getApiUrl);
const mockedProcessExit = vi
  .spyOn(process, "exit")
  .mockImplementation(() => undefined as never);

beforeEach(() => {
  vi.resetAllMocks();
  mockedProcessExit.mockImplementation(() => undefined as never);
});

afterAll(() => {
  mockedProcessExit.mockRestore();
  vi.unstubAllGlobals();
});

describe("requireAuth", () => {
  it("トークンがある場合、apiUrl と token を返す", async () => {
    mockedReadConfig.mockResolvedValue({ token: "test-token" });
    mockedGetApiUrl.mockReturnValue("http://localhost:3000");

    const ctx = await requireAuth();

    expect(ctx).toEqual({
      apiUrl: "http://localhost:3000",
      token: "test-token",
    });
  });

  it("トークンがない場合、process.exit(1) が呼ばれる", async () => {
    mockedReadConfig.mockResolvedValue({});

    await requireAuth();

    expect(consola.error).toHaveBeenCalledWith(
      expect.stringContaining("ログインしていません"),
    );
    expect(mockedProcessExit).toHaveBeenCalledWith(1);
  });
});

describe("apiRequest", () => {
  const ctx = { apiUrl: "http://localhost:3000", token: "test-token" };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("Authorization ヘッダー付きでリクエストを送信する", async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
    });
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    const res = await apiRequest(ctx, "GET", "/api/tasks");

    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/api/tasks", {
      method: "GET",
      headers: { Authorization: "Bearer test-token" },
      body: undefined,
    });
    expect(res.status).toBe(200);
  });

  it("body がある場合、Content-Type ヘッダーを付与する", async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
    });
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    await apiRequest(ctx, "POST", "/api/tasks", { title: "test" });

    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/api/tasks", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "test" }),
    });
  });

  it("401 レスポンス時に process.exit(1) が呼ばれる", async () => {
    const mockResponse = new Response("Unauthorized", { status: 401 });
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    await apiRequest(ctx, "GET", "/api/tasks");

    expect(consola.error).toHaveBeenCalledWith(
      expect.stringContaining("認証エラー"),
    );
    expect(mockedProcessExit).toHaveBeenCalledWith(1);
  });
});

describe("handleApiError", () => {
  it("JSON レスポンスからエラーメッセージを抽出する", async () => {
    const res = new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });

    await handleApiError(res, "フォールバック");

    expect(consola.error).toHaveBeenCalledWith("Not found");
    expect(mockedProcessExit).toHaveBeenCalledWith(1);
  });

  it("非 JSON レスポンス時にフォールバックメッセージを使用する", async () => {
    const res = new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });

    await handleApiError(res, "フォールバック");

    expect(consola.error).toHaveBeenCalledWith("フォールバック");
    expect(mockedProcessExit).toHaveBeenCalledWith(1);
  });
});
