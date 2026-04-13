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
import command from "./add.js";

const mockedRequireAuth = vi.mocked(requireAuth);
const mockedApiRequest = vi.mocked(apiRequest);
const mockedHandleApiError = vi.mocked(handleApiError);

beforeEach(() => {
  vi.resetAllMocks();
});

const ctx = { apiUrl: "http://localhost:3000", token: "test-token" };

describe("category add", () => {
  it("カテゴリを作成する", async () => {
    mockedRequireAuth.mockResolvedValue(ctx);
    mockedApiRequest.mockResolvedValue(
      new Response(
        JSON.stringify({ id: "cat-1", name: "仕事", color: "blue" }),
        { status: 201 },
      ),
    );

    await command.run!({
      args: { _: [], name: "仕事", color: "blue" },
      rawArgs: [],
      cmd: command,
    });

    expect(mockedApiRequest).toHaveBeenCalledWith(
      ctx,
      "POST",
      "/api/categories",
      {
        name: "仕事",
        color: "blue",
      },
    );
    expect(consola.success).toHaveBeenCalledWith(
      expect.stringContaining("仕事"),
    );
  });

  it("API エラー時にエラーハンドリングする", async () => {
    mockedRequireAuth.mockResolvedValue(ctx);
    mockedApiRequest.mockResolvedValue(
      new Response(JSON.stringify({ error: "error" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
    mockedHandleApiError.mockRejectedValue(new Error("exit"));

    await expect(
      command.run!({
        args: { _: [], name: "仕事", color: "invalid" },
        rawArgs: [],
        cmd: command,
      }),
    ).rejects.toThrow("exit");

    expect(mockedHandleApiError).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false }),
      "カテゴリの作成に失敗しました。",
    );
  });
});
