import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "../test/helpers";

const mockSignUpEmail = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../auth-client", () => ({
  authClient: {
    signUp: {
      email: (...args: unknown[]) => mockSignUpEmail(...args) as unknown,
    },
  },
}));

let capturedComponent: React.ComponentType | null = null;

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: { component: React.ComponentType }) => {
    capturedComponent = opts.component;
    return { options: opts };
  },
  redirect: vi.fn(),
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

describe("SignupPage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await import("./signup");
  });

  function renderSignupPage() {
    const Component = capturedComponent!;
    renderWithQueryClient(<Component />);
  }

  it("フォーム入力・送信で authClient.signUp.email が正しい引数で呼ばれる", async () => {
    mockSignUpEmail.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText("名前"), "テストユーザー");
    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.click(screen.getByRole("button", { name: "サインアップ" }));

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith({
        name: "テストユーザー",
        email: "test@example.com",
        password: "password123",
        callbackURL: "/login?verified=true",
      });
    });
  });

  it("サインアップ成功時に確認メール案内付きの /login へナビゲートする", async () => {
    mockSignUpEmail.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText("名前"), "テストユーザー");
    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.click(screen.getByRole("button", { name: "サインアップ" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/login",
        search: { signup: true },
      });
    });
  });

  it("API エラー時にエラーメッセージが表示される", async () => {
    mockSignUpEmail.mockResolvedValue({
      error: { message: "このメールアドレスは既に使用されています" },
    });
    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText("名前"), "テストユーザー");
    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.click(screen.getByRole("button", { name: "サインアップ" }));

    await waitFor(() => {
      expect(
        screen.getByText("このメールアドレスは既に使用されています"),
      ).toBeInTheDocument();
    });
  });

  it("エラーメッセージが無い場合デフォルトメッセージが表示される", async () => {
    mockSignUpEmail.mockResolvedValue({
      error: { message: undefined },
    });
    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText("名前"), "テストユーザー");
    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.click(screen.getByRole("button", { name: "サインアップ" }));

    await waitFor(() => {
      expect(
        screen.getByText("サインアップに失敗しました"),
      ).toBeInTheDocument();
    });
  });

  it("配送失敗時はアカウント作成後の確認メール再試行方法を案内する", async () => {
    mockSignUpEmail.mockResolvedValue({
      error: { code: "EMAIL_DELIVERY_UNAVAILABLE", message: "private" },
    });
    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText("名前"), "テストユーザー");
    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.click(screen.getByRole("button", { name: "サインアップ" }));

    expect(
      await screen.findByText(/確認メールを送信できませんでした/),
    ).toBeInTheDocument();
    expect(screen.getByText(/ログイン画面で同じ資格情報/)).toBeInTheDocument();
  });

  it("API 呼び出し中はボタンが disabled になり「サインアップ中...」と表示される", async () => {
    let resolveSignUp!: (value: { error: null }) => void;
    mockSignUpEmail.mockReturnValue(
      new Promise((resolve) => {
        resolveSignUp = resolve;
      }),
    );
    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText("名前"), "テストユーザー");
    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.click(screen.getByRole("button", { name: "サインアップ" }));

    await waitFor(() => {
      const button = screen.getByRole("button", { name: "サインアップ中..." });
      expect(button).toBeDisabled();
    });

    resolveSignUp({ error: null });
  });

  it("利用規約とプライバシーポリシーへのリンクが表示される", () => {
    renderSignupPage();

    const termsLink = screen.getByRole("link", { name: "利用規約" });
    expect(termsLink).toHaveAttribute("href", "/terms");

    const privacyLink = screen.getByRole("link", {
      name: "プライバシーポリシー",
    });
    expect(privacyLink).toHaveAttribute("href", "/privacy");
  });

  it("ログインページへのナビゲーションリンクが動作する", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    await user.click(screen.getByText("ログイン"));

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
  });
});
