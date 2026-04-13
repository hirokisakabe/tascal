import { describe, it, expect, vi, beforeEach } from "vitest";

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
import command from "./add.js";

const mockedRequireAuth = vi.mocked(requireAuth);
const mockedApiRequest = vi.mocked(apiRequest);

beforeEach(() => {
  vi.resetAllMocks();
});

const ctx = { apiUrl: "http://localhost:3000", token: "test-token" };

describe("add", () => {
  it("カテゴリ付きでタスクを作成する", async () => {
    mockedRequireAuth.mockResolvedValue(ctx);
    mockedApiRequest.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "task-1",
          title: "テスト",
          date: "2026-04-13",
        }),
        { status: 201 },
      ),
    );

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

    expect(mockedApiRequest).toHaveBeenCalledWith(ctx, "POST", "/api/tasks", {
      title: "テスト",
      date: "2026-04-13",
      categoryId: "cat-1",
    });
    expect(consola.success).toHaveBeenCalledWith(
      expect.stringContaining("テスト"),
    );
  });

  it("カテゴリなしでタスクを作成する", async () => {
    mockedRequireAuth.mockResolvedValue(ctx);
    mockedApiRequest.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "task-1",
          title: "テスト",
          date: "2026-04-13",
        }),
        { status: 201 },
      ),
    );

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

    expect(mockedApiRequest).toHaveBeenCalledWith(ctx, "POST", "/api/tasks", {
      title: "テスト",
      date: "2026-04-13",
    });
  });
});
