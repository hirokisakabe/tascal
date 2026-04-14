import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("consola", () => ({
  consola: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../../api.js", () => ({
  requireAuthClient: vi.fn(),
  handleApiError: vi.fn(),
}));

import { consola } from "consola";
import { requireAuthClient, handleApiError } from "../../api.js";
import command from "./delete.js";

const mockedRequireAuthClient = vi.mocked(requireAuthClient);
const mockedHandleApiError = vi.mocked(handleApiError);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("category delete", () => {
  it("カテゴリを削除する", async () => {
    const mockDelete = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "カテゴリを削除しました" }), {
        status: 200,
      }),
    );
    const mockClient = {
      api: { categories: { ":id": { $delete: mockDelete } } },
    };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);

    await command.run!({
      args: { _: [], id: "cat-1" },
      rawArgs: [],
      cmd: command,
    });

    expect(mockDelete).toHaveBeenCalledWith({ param: { id: "cat-1" } });
    expect(consola.success).toHaveBeenCalledWith("カテゴリを削除しました。");
  });

  it("API エラー時にエラーハンドリングする", async () => {
    const mockDelete = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "error" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const mockClient = {
      api: { categories: { ":id": { $delete: mockDelete } } },
    };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);
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
