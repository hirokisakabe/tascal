import { describe, it, expect, vi, beforeEach } from "vitest";
import { isRedirect } from "@tanstack/react-router";

const mockGetSession = vi.fn();

vi.mock("../auth-client", () => ({
  authClient: {
    getSession: (...args: unknown[]) => mockGetSession(...args) as unknown,
  },
}));

describe("/login beforeLoad", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetSession.mockReset();
  });

  it("ログイン済みの場合 /app にリダイレクトする", async () => {
    mockGetSession.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
    });

    const { Route } = await import("./login");
    const beforeLoad = Route.options.beforeLoad!;

    try {
      await (beforeLoad as () => Promise<void>)();
      expect.fail("redirect が throw されるべき");
    } catch (e) {
      expect(isRedirect(e)).toBe(true);
      expect((e as { options: { to: string } }).options.to).toBe("/app");
    }
  });

  it("未ログインの場合リダイレクトしない", async () => {
    mockGetSession.mockResolvedValue({ data: null });

    const { Route } = await import("./login");
    const beforeLoad = Route.options.beforeLoad!;

    await expect(
      (beforeLoad as () => Promise<void>)(),
    ).resolves.toBeUndefined();
  });
});

describe("/signup beforeLoad", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetSession.mockReset();
  });

  it("ログイン済みの場合 /app にリダイレクトする", async () => {
    mockGetSession.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
    });

    const { Route } = await import("./signup");
    const beforeLoad = Route.options.beforeLoad!;

    try {
      await (beforeLoad as () => Promise<void>)();
      expect.fail("redirect が throw されるべき");
    } catch (e) {
      expect(isRedirect(e)).toBe(true);
      expect((e as { options: { to: string } }).options.to).toBe("/app");
    }
  });

  it("未ログインの場合リダイレクトしない", async () => {
    mockGetSession.mockResolvedValue({ data: null });

    const { Route } = await import("./signup");
    const beforeLoad = Route.options.beforeLoad!;

    await expect(
      (beforeLoad as () => Promise<void>)(),
    ).resolves.toBeUndefined();
  });
});
