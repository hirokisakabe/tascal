import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

vi.mock("consola", () => ({
  consola: { info: vi.fn(), error: vi.fn() },
}));

vi.mock("../../api.js", () => ({
  requireAuthClient: vi.fn(),
  handleApiError: vi.fn(),
}));

import { consola } from "consola";
import { requireAuthClient, handleApiError } from "../../api.js";
import command from "./list.js";

const mockedRequireAuthClient = vi.mocked(requireAuthClient);
const mockedHandleApiError = vi.mocked(handleApiError);
const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

beforeEach(() => {
  vi.resetAllMocks();
  consoleSpy.mockClear();
});

afterAll(() => {
  consoleSpy.mockRestore();
});

describe("category list", () => {
  it("カテゴリ一覧を表示する", async () => {
    const mockClient = {
      api: {
        categories: {
          $get: vi.fn().mockResolvedValue(
            new Response(
              JSON.stringify([
                { id: "cat-1", name: "仕事", color: "blue" },
                { id: "cat-2", name: "個人", color: "green" },
              ]),
              { status: 200 },
            ),
          ),
        },
      },
    };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);

    await command.run!({ args: { _: [] }, rawArgs: [], cmd: command });

    expect(consola.info).toHaveBeenCalledWith(expect.stringContaining("2件"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("仕事"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("個人"));
  });

  it("カテゴリがない場合、メッセージを表示する", async () => {
    const mockClient = {
      api: {
        categories: {
          $get: vi
            .fn()
            .mockResolvedValue(
              new Response(JSON.stringify([]), { status: 200 }),
            ),
        },
      },
    };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);

    await command.run!({ args: { _: [] }, rawArgs: [], cmd: command });

    expect(consola.info).toHaveBeenCalledWith(
      expect.stringContaining("カテゴリはありません"),
    );
  });

  it("API エラー時にエラーハンドリングする", async () => {
    const mockClient = {
      api: {
        categories: {
          $get: vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ error: "error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }),
          ),
        },
      },
    };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);
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
