import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("consola", () => ({
  consola: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../api.js", () => ({
  requireAuthClient: vi.fn(),
  handleApiError: vi.fn(),
}));

import { consola } from "consola";
import { requireAuthClient } from "../api.js";
import command from "./add.js";

const mockedRequireAuthClient = vi.mocked(requireAuthClient);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("add", () => {
  it("カテゴリ付きでタスクを作成する", async () => {
    const mockPost = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "task-1",
          title: "テスト",
          date: "2026-04-13",
        }),
        { status: 201 },
      ),
    );
    const mockClient = { api: { tasks: { $post: mockPost } } };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);

    await command.run!({
      args: {
        _: [],
        title: "テスト",
        date: "2026-04-13",
        description: "",
        category: "cat-1",
      },
      rawArgs: [],
      cmd: command,
    });

    expect(mockPost).toHaveBeenCalledWith({
      json: {
        title: "テスト",
        date: "2026-04-13",
        categoryId: "cat-1",
      },
    });
    expect(consola.success).toHaveBeenCalledWith(
      expect.stringContaining("テスト"),
    );
  });

  it("カテゴリなしでタスクを作成する", async () => {
    const mockPost = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "task-1",
          title: "テスト",
          date: "2026-04-13",
        }),
        { status: 201 },
      ),
    );
    const mockClient = { api: { tasks: { $post: mockPost } } };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);

    await command.run!({
      args: {
        _: [],
        title: "テスト",
        date: "2026-04-13",
        description: "",
        category: "",
      },
      rawArgs: [],
      cmd: command,
    });

    expect(mockPost).toHaveBeenCalledWith({
      json: {
        title: "テスト",
        date: "2026-04-13",
      },
    });
  });

  it("date 省略で未スケジュールタスクを作成する", async () => {
    const mockPost = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "task-1",
          title: "未スケジュール",
          date: null,
        }),
        { status: 201 },
      ),
    );
    const mockClient = { api: { tasks: { $post: mockPost } } };
    mockedRequireAuthClient.mockResolvedValue(mockClient as never);

    await command.run!({
      args: {
        _: [],
        title: "未スケジュール",
        date: undefined as unknown as string,
        description: "",
        category: "",
      },
      rawArgs: [],
      cmd: command,
    });

    expect(mockPost).toHaveBeenCalledWith({
      json: {
        title: "未スケジュール",
      },
    });
    expect(consola.success).toHaveBeenCalledWith(
      expect.stringContaining("未スケジュール"),
    );
  });
});
