import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "../test/helpers";

const mockSignInEmail = vi.fn();
const mockNavigate = vi.fn();

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
    return { options: opts };
  },
  redirect: vi.fn(),
  useNavigate: () => mockNavigate,
}));

describe("LoginPage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
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

  it("サインアップページへのナビゲーションリンクが動作する", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByText("サインアップ"));

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/signup" });
  });
});
