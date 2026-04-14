import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

vi.mock("consola", () => ({
  consola: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../../api.js", () => ({
  requireAuthClient: vi.fn(),
  handleApiError: vi.fn(),
}));

import { consola } from "consola";
import { requireAuthClient, handleApiError } from "../../api.js";
import command from "./edit.js";

const mockedRequireAuthClient = vi.mocked(requireAuthClient);
const mockedHandleApiError = vi.mocked(handleApiError);
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

describe("category edit", () => {
  it("カテゴリを更新する", async () => {
    const mockPatch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cat-1", name: "更新後", color: "red" }),
          { status: 200 },
        ),
      );
    const mockClient = {
      api: { categories: { ":id": { $patch: mockPatch } } },
    };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);

    await command.run!({
      args: { _: [], id: "cat-1", name: "更新後", color: "red" },
      rawArgs: [],
      cmd: command,
    });

    expect(mockPatch).toHaveBeenCalledWith({
      param: { id: "cat-1" },
      json: { name: "更新後", color: "red" },
    });
    expect(consola.success).toHaveBeenCalledWith(
      expect.stringContaining("更新後"),
    );
  });

  it("更新項目が指定されていない場合、エラーを表示する", async () => {
    const mockClient = {
      api: {
        categories: {
          ":id": {
            $patch: vi
              .fn()
              .mockResolvedValue(
                new Response(JSON.stringify({}), { status: 200 }),
              ),
          },
        },
      },
    };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);

    await command.run!({
      args: { _: [], id: "cat-1", name: "", color: "" },
      rawArgs: [],
      cmd: command,
    });

    expect(consola.error).toHaveBeenCalledWith(
      expect.stringContaining("更新する項目を指定してください"),
    );
    expect(mockedProcessExit).toHaveBeenCalledWith(1);
  });

  it("API エラー時にエラーハンドリングする", async () => {
    const mockPatch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "error" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const mockClient = {
      api: { categories: { ":id": { $patch: mockPatch } } },
    };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);
    mockedHandleApiError.mockRejectedValue(new Error("exit"));

    await expect(
      command.run!({
        args: { _: [], id: "cat-1", name: "更新後", color: "" },
        rawArgs: [],
        cmd: command,
      }),
    ).rejects.toThrow("exit");

    expect(mockedHandleApiError).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false }),
      "カテゴリの更新に失敗しました。",
    );
  });
});
