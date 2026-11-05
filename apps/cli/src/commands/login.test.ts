import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clack/prompts", () => ({
  text: vi.fn(),
  password: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock("consola", () => ({
  consola: { start: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

vi.mock("../config.js", () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
  getApiUrl: vi.fn(),
}));

import { password, text } from "@clack/prompts";
import { readConfig, writeConfig, getApiUrl } from "../config.js";
import command, { getLoginFailureMessage } from "./login.js";

const originalIsTTY = process.stdin.isTTY;

beforeEach(() => {
  vi.resetAllMocks();
  Object.defineProperty(process.stdin, "isTTY", {
    configurable: true,
    value: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(process.stdin, "isTTY", {
    configurable: true,
    value: originalIsTTY,
  });
});

describe("login", () => {
  it("ログインレスポンスのトークンを設定へ保存する", async () => {
    vi.mocked(readConfig).mockResolvedValue({});
    vi.mocked(getApiUrl).mockReturnValue("https://tascal.dev");
    vi.mocked(text).mockResolvedValue("test@example.com");
    vi.mocked(password).mockResolvedValue("password123");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ token: "session-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await command.run!({
      args: { _: [], "api-url": undefined as unknown as string },
      rawArgs: [],
      cmd: command,
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://tascal.dev/api/auth/sign-in/email",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://tascal.dev",
        },
      }),
    );
    expect(writeConfig).toHaveBeenCalledWith({
      token: "session-token",
      apiUrl: "https://tascal.dev",
    });
  });

  it("未確認 error をメール再送と Web 継続の案内へ変換する", () => {
    const message = getLoginFailureMessage(403, {
      code: "EMAIL_NOT_VERIFIED",
    });
    expect(message).toContain("確認メールを再送しました");
    expect(message).toContain("Web で開いて");
  });

  it("配送失敗では成功を断定せず再試行を案内する", () => {
    const message = getLoginFailureMessage(503, {
      code: "EMAIL_DELIVERY_UNAVAILABLE",
    });
    expect(message).toContain("送信できませんでした");
    expect(message).not.toContain("再送しました");
  });
});
