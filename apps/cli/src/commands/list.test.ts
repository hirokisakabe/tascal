import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

vi.mock("consola", () => ({
  consola: { info: vi.fn(), error: vi.fn() },
}));

vi.mock("../api.js", () => ({
  requireAuthClient: vi.fn(),
  handleApiError: vi.fn(),
}));

import { consola } from "consola";
import { requireAuthClient, handleApiError } from "../api.js";
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

function createMockClient(
  tasksResponse: Response,
  categoriesResponse: Response,
) {
  return {
    api: {
      tasks: {
        $get: vi.fn().mockResolvedValue(tasksResponse),
      },
      categories: {
        $get: vi.fn().mockResolvedValue(categoriesResponse),
      },
    },
  };
}

describe("list", () => {
  it("タスク一覧にカテゴリ名を表示する", async () => {
    const mockClient = createMockClient(
      new Response(
        JSON.stringify([
          {
            id: "task-1",
            title: "タスク1",
            description: null,
            date: "2026-04-13",
            status: "todo",
            categoryId: "cat-1",
          },
          {
            id: "task-2",
            title: "タスク2",
            description: null,
            date: "2026-04-14",
            status: "done",
            categoryId: null,
          },
        ]),
        { status: 200 },
      ),
      new Response(JSON.stringify([{ id: "cat-1", name: "仕事" }]), {
        status: 200,
      }),
    );
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);

    await command.run!({
      args: { _: [], year: "2026", month: "4" },
      rawArgs: [],
      cmd: command,
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[仕事]"));
    const task2Line = consoleSpy.mock.calls
      .map((c) => c[0] as string)
      .find((line) => line.includes("task-2"));
    expect(task2Line).toBeDefined();
    expect(task2Line).toContain("タスク2");
    expect(task2Line).not.toContain("[仕事]");
  });

  it("カテゴリなしのタスクにはカテゴリラベルを表示しない", async () => {
    const mockClient = createMockClient(
      new Response(
        JSON.stringify([
          {
            id: "task-1",
            title: "タスク1",
            description: null,
            date: "2026-04-13",
            status: "todo",
            categoryId: null,
          },
        ]),
        { status: 200 },
      ),
      new Response(JSON.stringify([]), { status: 200 }),
    );
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);

    await command.run!({
      args: { _: [], year: "2026", month: "4" },
      rawArgs: [],
      cmd: command,
    });

    const taskLine = consoleSpy.mock.calls
      .map((c) => c[0] as string)
      .find((line) => line.includes("task-1"));
    expect(taskLine).toBeDefined();
    expect(taskLine).toContain("タスク1");
    // カテゴリ名の [] がないことを確認（日付の [] は許容）
    expect(taskLine).toBe("  ○ [2026-04-13] タスク1 (task-1)");
  });

  it("タスクがない場合、メッセージを表示する", async () => {
    const mockClient = createMockClient(
      new Response(JSON.stringify([]), { status: 200 }),
      new Response(JSON.stringify([]), { status: 200 }),
    );
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);

    await command.run!({
      args: { _: [], year: "2026", month: "4" },
      rawArgs: [],
      cmd: command,
    });

    expect(consola.info).toHaveBeenCalledWith(
      expect.stringContaining("タスクはありません"),
    );
  });

  it("タスク API エラー時にエラーハンドリングする", async () => {
    const mockClient = createMockClient(
      new Response(JSON.stringify({ error: "error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
      new Response(JSON.stringify([]), { status: 200 }),
    );
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);
    mockedHandleApiError.mockRejectedValue(new Error("exit"));

    await expect(
      command.run!({
        args: { _: [], year: "2026", month: "4" },
        rawArgs: [],
        cmd: command,
      }),
    ).rejects.toThrow("exit");

    expect(mockedHandleApiError).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false }),
      "タスクの取得に失敗しました。",
    );
  });
});
