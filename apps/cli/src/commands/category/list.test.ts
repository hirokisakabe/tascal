import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

vi.mock("consola", () => ({
  consola: { info: vi.fn(), error: vi.fn() },
}));

vi.mock("../../api.js", () => ({
  requireAuth: vi.fn(),
  apiRequest: vi.fn(),
  handleApiError: vi.fn(),
}));

import { consola } from "consola";
import { requireAuth, apiRequest, handleApiError } from "../../api.js";
import command from "./list.js";

const mockedRequireAuth = vi.mocked(requireAuth);
const mockedApiRequest = vi.mocked(apiRequest);
const mockedHandleApiError = vi.mocked(handleApiError);
const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

beforeEach(() => {
  vi.resetAllMocks();
  consoleSpy.mockClear();
});

afterAll(() => {
  consoleSpy.mockRestore();
});

const ctx = { apiUrl: "http://localhost:3000", token: "test-token" };

describe("category list", () => {
  it("カテゴリ一覧を表示する", async () => {
    mockedRequireAuth.mockResolvedValue(ctx);
    mockedApiRequest.mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: "cat-1", name: "仕事", color: "blue" },
          { id: "cat-2", name: "個人", color: "green" },
        ]),
        { status: 200 },
      ),
    );

    await command.run!({ args: { _: [] }, rawArgs: [], cmd: command });

    expect(consola.info).toHaveBeenCalledWith(expect.stringContaining("2件"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("仕事"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("個人"));
  });

  it("カテゴリがない場合、メッセージを表示する", async () => {
    mockedRequireAuth.mockResolvedValue(ctx);
    mockedApiRequest.mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    await command.run!({ args: { _: [] }, rawArgs: [], cmd: command });

    expect(consola.info).toHaveBeenCalledWith(
      expect.stringContaining("カテゴリはありません"),
    );
  });

  it("API エラー時にエラーハンドリングする", async () => {
    mockedRequireAuth.mockResolvedValue(ctx);
    mockedApiRequest.mockResolvedValue(
      new Response(JSON.stringify({ error: "error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
    mockedHandleApiError.mockRejectedValue(new Error("exit"));

    await expect(
      command.run!({ args: { _: [] }, rawArgs: [], cmd: command }),
    ).rejects.toThrow("exit");

    expect(mockedHandleApiError).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false }),
      "カテゴリの取得に失敗しました。",
    );
  });
});
