import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("consola", () => ({
  consola: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../../api.js", () => ({
  requireAuth: vi.fn(),
  apiRequest: vi.fn(),
  handleApiError: vi.fn(),
}));

import { consola } from "consola";
import { requireAuth, apiRequest, handleApiError } from "../../api.js";
import command from "./delete.js";

const mockedRequireAuth = vi.mocked(requireAuth);
const mockedApiRequest = vi.mocked(apiRequest);
const mockedHandleApiError = vi.mocked(handleApiError);

beforeEach(() => {
  vi.resetAllMocks();
});

const ctx = { apiUrl: "http://localhost:3000", token: "test-token" };

describe("category delete", () => {
  it("カテゴリを削除する", async () => {
    mockedRequireAuth.mockResolvedValue(ctx);
    mockedApiRequest.mockResolvedValue(
      new Response(JSON.stringify({ message: "カテゴリを削除しました" }), {
        status: 200,
      }),
    );

    await command.run!({
      args: { _: [], id: "cat-1" },
      rawArgs: [],
      cmd: command,
    });

    expect(mockedApiRequest).toHaveBeenCalledWith(
      ctx,
      "DELETE",
      "/api/categories/cat-1",
    );
    expect(consola.success).toHaveBeenCalledWith("カテゴリを削除しました。");
  });

  it("API エラー時にエラーハンドリングする", async () => {
    mockedRequireAuth.mockResolvedValue(ctx);
    mockedApiRequest.mockResolvedValue(
      new Response(JSON.stringify({ error: "error" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );
    mockedHandleApiError.mockRejectedValue(new Error("exit"));

    await expect(
      command.run!({
        args: { _: [], id: "cat-1" },
        rawArgs: [],
        cmd: command,
      }),
    ).rejects.toThrow("exit");

    expect(mockedHandleApiError).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false }),
      "カテゴリの削除に失敗しました。",
    );
  });
});
