import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "../../test/helpers";

const mockUseSession = vi.fn();
const mockSignOut = vi.fn();
const mockFetchCategories = vi.fn();

vi.mock("../../auth-client", () => ({
  authClient: {
    useSession: () => mockUseSession() as unknown,
    signOut: (...args: unknown[]) => mockSignOut(...args) as unknown,
  },
}));

vi.mock("../../api/categories", () => ({
  fetchCategories: (...args: unknown[]) =>
    mockFetchCategories(...args) as unknown,
}));

vi.mock("../../api/users", () => ({
  deleteAccount: vi.fn(),
}));

let capturedComponent: React.ComponentType | null = null;

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: { component: React.ComponentType }) => {
    capturedComponent = opts.component;
    return { options: opts };
  },
  Link: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
    <a {...props}>{children}</a>
  ),
}));

describe("SettingsPage アカウントセクション", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", name: "テストユーザー" }, session: {} },
    });
    mockFetchCategories.mockResolvedValue([]);
    // Import to trigger createFileRoute and capture the component
    await import("../app/settings");
  });

  function renderSettingsPage() {
    const Component = capturedComponent!;
    renderWithQueryClient(<Component />);
  }

  it("ログアウトボタンが表示される", () => {
    renderSettingsPage();

    expect(
      screen.getByRole("button", { name: "ログアウト" }),
    ).toBeInTheDocument();
  });

  it("アカウント削除ボタンが表示される", () => {
    renderSettingsPage();

    expect(
      screen.getByRole("button", { name: "アカウント削除" }),
    ).toBeInTheDocument();
  });

  it("アカウント削除ボタンをクリックするとモーダルが開く", async () => {
    const user = userEvent.setup();
    renderSettingsPage();

    await user.click(screen.getByRole("button", { name: "アカウント削除" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "この操作は取り消せません。アカウントとすべてのデータが完全に削除されます。",
        ),
      ).toBeInTheDocument();
    });
  });
});
