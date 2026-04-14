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
import command from "./add.js";

const mockedRequireAuthClient = vi.mocked(requireAuthClient);
const mockedHandleApiError = vi.mocked(handleApiError);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("category add", () => {
  it("カテゴリを作成する", async () => {
    const mockPost = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cat-1", name: "仕事", color: "blue" }),
          { status: 201 },
        ),
      );
    const mockClient = { api: { categories: { $post: mockPost } } };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);

    await command.run!({
      args: { _: [], name: "仕事", color: "blue" },
      rawArgs: [],
      cmd: command,
    });

    expect(mockPost).toHaveBeenCalledWith({
      json: {
        name: "仕事",
        color: "blue",
      },
    });
    expect(consola.success).toHaveBeenCalledWith(
      expect.stringContaining("仕事"),
    );
  });

  it("API エラー時にエラーハンドリングする", async () => {
    const mockPost = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "error" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const mockClient = { api: { categories: { $post: mockPost } } };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);
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
