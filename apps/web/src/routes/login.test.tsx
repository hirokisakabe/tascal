import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "../test/helpers";

const mockSignInEmail = vi.fn();
const mockNavigate = vi.fn();
let mockSearch: {
  verified?: boolean;
  signup?: boolean;
  passwordReset?: boolean;
  error?: string;
} = {};

vi.mock("../auth-client", () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => mockSignInEmail(...args) as unknown,
    },
  },
}));

let capturedComponent: React.ComponentType | null = null;

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: { component: React.ComponentType }) => {
    capturedComponent = opts.component;
    return { options: opts, useSearch: () => mockSearch };
  },
  redirect: vi.fn(),
  useNavigate: () => mockNavigate,
}));

describe("LoginPage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockSearch = {};
    window.history.replaceState({}, "", "/login");
    await import("./login");
  });

  function renderLoginPage() {
    const Component = capturedComponent!;
    renderWithQueryClient(<Component />);
  }

  it("フォーム入力・送信で authClient.signIn.email が正しい引数で呼ばれる", async () => {
    mockSignInEmail.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(mockSignInEmail).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        callbackURL: "/login?verified=true",
      });
    });
  });

  it("ログイン成功時に /app へナビゲートする", async () => {
    mockSignInEmail.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/app" });
    });
  });

  it("API エラー時にエラーメッセージが表示される", async () => {
    mockSignInEmail.mockResolvedValue({
      error: { message: "メールアドレスまたはパスワードが正しくありません" },
    });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "wrong");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(
        screen.getByText("メールアドレスまたはパスワードが正しくありません"),
      ).toBeInTheDocument();
    });
  });

  it("エラーメッセージが無い場合デフォルトメッセージが表示される", async () => {
    mockSignInEmail.mockResolvedValue({
      error: { message: undefined },
    });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "wrong");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(screen.getByText("ログインに失敗しました")).toBeInTheDocument();
    });
  });

  it("API 呼び出し中はボタンが disabled になり「ログイン中...」と表示される", async () => {
    let resolveSignIn!: (value: { error: null }) => void;
    mockSignInEmail.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }),
    );
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      const button = screen.getByRole("button", { name: "ログイン中..." });
      expect(button).toBeDisabled();
    });

    resolveSignIn({ error: null });
  });

  it("サインアップページへのナビゲーションリンクが動作する", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByText("サインアップ"));

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/signup" });
  });

  it("未確認エラーでは確認メールを再送したことと次の操作を案内する", async () => {
    mockSignInEmail.mockResolvedValue({
      error: { code: "EMAIL_NOT_VERIFIED", message: "Email not verified" },
    });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(
      await screen.findByText(/確認メールを再送しました/),
    ).toBeInTheDocument();
  });

  it("配送失敗時は送信成功を断定せず再試行を案内する", async () => {
    mockSignInEmail.mockResolvedValue({
      error: {
        code: "EMAIL_DELIVERY_UNAVAILABLE",
        message: "provider detail",
      },
    });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com",
    );
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(
      await screen.findByText(/確認メールを送信できませんでした/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/再送しました/)).not.toBeInTheDocument();
  });

  it("確認成功の案内を表示し、検索 parameter を一度だけ消費する", async () => {
    mockSearch = { verified: true };
    window.history.replaceState({}, "", "/login?verified=true");
    renderLoginPage();

    expect(
      screen.getByText("メールアドレスを確認しました。ログインしてください。"),
    ).toBeInTheDocument();
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("無効・期限切れの確認 link では資格情報による再送方法を案内する", () => {
    mockSearch = { error: "TOKEN_EXPIRED" };
    renderLoginPage();

    expect(
      screen.getByText(/確認リンクが無効または期限切れ/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ログイン" }),
    ).toBeInTheDocument();
  });

  it("パスワード再設定導線を表示する", () => {
    renderLoginPage();
    expect(
      screen.getByRole("link", { name: "パスワードをお忘れですか？" }),
    ).toHaveAttribute("href", "/forgot-password");
  });
});
