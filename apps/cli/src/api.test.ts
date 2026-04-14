import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

vi.mock("consola", () => ({
  consola: { error: vi.fn() },
}));

vi.mock("./config.js", () => ({
  readConfig: vi.fn(),
  getApiUrl: vi.fn(),
}));

vi.mock("hono/client", () => ({
  hc: vi.fn(() => ({})),
}));

import { consola } from "consola";
import { readConfig, getApiUrl } from "./config.js";
import { requireAuthClient, handleApiError } from "./api.js";

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
});

describe("requireAuthClient", () => {
  it("トークンがある場合、クライアントを返す", async () => {
    mockedReadConfig.mockResolvedValue({ token: "test-token" });
    mockedGetApiUrl.mockReturnValue("http://localhost:3000");

    const client = await requireAuthClient();

    expect(client).toBeDefined();
  });

  it("トークンがない場合、process.exit(1) が呼ばれる", async () => {
    mockedReadConfig.mockResolvedValue({});

    await requireAuthClient();

    expect(consola.error).toHaveBeenCalledWith(
      expect.stringContaining("ログインしていません"),
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
