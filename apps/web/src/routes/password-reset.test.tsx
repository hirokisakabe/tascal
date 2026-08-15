import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "../test/helpers";

const mockRequestPasswordReset = vi.fn();
const mockResetPassword = vi.fn();
const mockNavigate = vi.fn();
let mockSearch: { token?: string; error?: string } = {};
let capturedComponent: React.ComponentType | null = null;

vi.mock("../auth-client", () => ({
  authClient: {
    requestPasswordReset: (...args: unknown[]) =>
      mockRequestPasswordReset(...args) as unknown,
    resetPassword: (...args: unknown[]) =>
      mockResetPassword(...args) as unknown,
  },
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: { component: React.ComponentType }) => {
    capturedComponent = opts.component;
    return { options: opts, useSearch: () => mockSearch };
  },
  useNavigate: () => mockNavigate,
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("ForgotPasswordPage", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSearch = {};
    capturedComponent = null;
    await import("./forgot-password");
  });

  it("登録有無を断定しない同一案内を表示する", async () => {
    mockRequestPasswordReset.mockResolvedValue({ error: null });
    const Component = capturedComponent!;
    const user = userEvent.setup();
    renderWithQueryClient(<Component />);

    await user.type(
      screen.getByLabelText("メールアドレス"),
      "unknown@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: "再設定メールを送る" }),
    );

    await waitFor(() =>
      expect(mockRequestPasswordReset).toHaveBeenCalledWith({
        email: "unknown@example.com",
        redirectTo: "/reset-password",
      }),
    );
    expect(screen.getByText(/アカウントが存在する場合は/)).toBeInTheDocument();
  });

  it("配送結果を含む API error を画面へ露出しない", async () => {
    mockRequestPasswordReset.mockResolvedValue({
      error: { message: "provider rejected private@example.com" },
    });
    const Component = capturedComponent!;
    const user = userEvent.setup();
    renderWithQueryClient(<Component />);

    await user.type(
      screen.getByLabelText("メールアドレス"),
      "private@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: "再設定メールを送る" }),
    );

    expect(
      await screen.findByText(/リクエストを処理できませんでした/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/provider rejected/)).not.toBeInTheDocument();
  });
});

describe("ResetPasswordPage", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSearch = { token: "reset-token" };
    capturedComponent = null;
    await import("./reset-password");
  });

  it("有効な token と新しい password で再設定し login へ遷移する", async () => {
    mockResetPassword.mockResolvedValue({ error: null });
    const Component = capturedComponent!;
    const user = userEvent.setup();
    renderWithQueryClient(<Component />);

    await user.type(
      screen.getByLabelText("新しいパスワード"),
      "new-password123",
    );
    await user.type(
      screen.getByLabelText("新しいパスワード（確認）"),
      "new-password123",
    );
    await user.click(screen.getByRole("button", { name: "パスワードを変更" }));

    await waitFor(() =>
      expect(mockResetPassword).toHaveBeenCalledWith({
        newPassword: "new-password123",
        token: "reset-token",
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/login",
      search: { passwordReset: true },
    });
  });

  it("不正・期限切れ link では再送導線を表示する", async () => {
    mockSearch = { error: "INVALID_TOKEN" };
    vi.resetModules();
    capturedComponent = null;
    await import("./reset-password");
    const Component = capturedComponent!;
    renderWithQueryClient(<Component />);

    expect(
      screen.getByText(/再設定リンクが無効または期限切れ/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "再設定メールを送る" }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  it("reset API が token error を返した場合も再送方法を案内する", async () => {
    mockResetPassword.mockResolvedValue({
      error: { code: "INVALID_TOKEN", message: "Invalid token" },
    });
    const Component = capturedComponent!;
    const user = userEvent.setup();
    renderWithQueryClient(<Component />);

    await user.type(
      screen.getByLabelText("新しいパスワード"),
      "new-password123",
    );
    await user.type(
      screen.getByLabelText("新しいパスワード（確認）"),
      "new-password123",
    );
    await user.click(screen.getByRole("button", { name: "パスワードを変更" }));

    expect(await screen.findByText(/もう一度メールを送信/)).toBeInTheDocument();
  });
});
