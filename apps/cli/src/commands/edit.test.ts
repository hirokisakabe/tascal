import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

vi.mock("consola", () => ({
  consola: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../api.js", () => ({
  requireAuth: vi.fn(),
  apiRequest: vi.fn(),
  handleApiError: vi.fn(),
}));

import { consola } from "consola";
import { requireAuth, apiRequest } from "../api.js";
import command from "./edit.js";

const mockedRequireAuth = vi.mocked(requireAuth);
const mockedApiRequest = vi.mocked(apiRequest);
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

const ctx = { apiUrl: "http://localhost:3000", token: "test-token" };

// citty の ParsedArgs 型が全フィールド必須のため、テスト用にキャスト
const run = command.run! as (ctx: {
  args: Record<string, unknown>;
  rawArgs: string[];
  cmd: unknown;
}) => Promise<void>;

describe("edit", () => {
  it("カテゴリ付きでタスクを更新する", async () => {
    mockedRequireAuth.mockResolvedValue(ctx);
    mockedApiRequest.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "task-1",
          title: "テスト",
          date: "2026-04-13",
        }),
        { status: 200 },
      ),
    );

    await run({
      args: { _: [], id: "task-1", category: "cat-1" },
      rawArgs: [],
      cmd: command,
    });

    expect(mockedApiRequest).toHaveBeenCalledWith(
      ctx,
      "PATCH",
      "/api/tasks/task-1",
      { categoryId: "cat-1" },
    );
    expect(consola.success).toHaveBeenCalledWith(
      expect.stringContaining("テスト"),
    );
  });

  it("更新項目が指定されていない場合、エラーメッセージに --category を含む", async () => {
    mockedRequireAuth.mockResolvedValue(ctx);
    mockedApiRequest.mockResolvedValue(
      new Response(JSON.stringify({ id: "task-1", title: "t", date: "d" }), {
        status: 200,
      }),
    );

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
