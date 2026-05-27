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

describe("/ beforeLoad (PWA standalone redirect)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("display-mode: standalone のとき /app にリダイレクトする", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: query === "(display-mode: standalone)",
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const { Route } = await import("./index");
    const beforeLoad = Route.options.beforeLoad!;

    try {
      (beforeLoad as () => void)();
      expect.fail("redirect が throw されるべき");
    } catch (e) {
      expect(isRedirect(e)).toBe(true);
      expect((e as { options: { to: string } }).options.to).toBe("/app");
    }
  });

  it("通常ブラウザ (non-standalone) ではリダイレクトしない", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const { Route } = await import("./index");
    const beforeLoad = Route.options.beforeLoad!;

    expect(() => (beforeLoad as () => void)()).not.toThrow();
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
