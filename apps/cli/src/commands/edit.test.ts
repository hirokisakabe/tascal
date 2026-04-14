import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

vi.mock("consola", () => ({
  consola: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../api.js", () => ({
  requireAuthClient: vi.fn(),
  handleApiError: vi.fn(),
}));

import { consola } from "consola";
import { requireAuthClient } from "../api.js";
import command from "./edit.js";

const mockedRequireAuthClient = vi.mocked(requireAuthClient);
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

// citty の ParsedArgs 型が全フィールド必須のため、テスト用にキャスト
const run = command.run! as (ctx: {
  args: Record<string, unknown>;
  rawArgs: string[];
  cmd: unknown;
}) => Promise<void>;

describe("edit", () => {
  it("カテゴリ付きでタスクを更新する", async () => {
    const mockPatch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "task-1",
          title: "テスト",
          date: "2026-04-13",
        }),
        { status: 200 },
      ),
    );
    const mockClient = { api: { tasks: { ":id": { $patch: mockPatch } } } };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);

    await run({
      args: { _: [], id: "task-1", category: "cat-1" },
      rawArgs: [],
      cmd: command,
    });

    expect(mockPatch).toHaveBeenCalledWith({
      param: { id: "task-1" },
      json: { categoryId: "cat-1" },
    });
    expect(consola.success).toHaveBeenCalledWith(
      expect.stringContaining("テスト"),
    );
  });

  it("更新項目が指定されていない場合、エラーメッセージに --category を含む", async () => {
    const mockPatch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    const mockClient = {
      api: { tasks: { ":id": { $patch: mockPatch } } },
    };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);

    await run({
      args: { _: [], id: "task-1" },
      rawArgs: [],
      cmd: command,
    });

    expect(consola.error).toHaveBeenCalledWith(
      expect.stringContaining("--category"),
    );
    expect(mockedProcessExit).toHaveBeenCalledWith(1);
  });
});
