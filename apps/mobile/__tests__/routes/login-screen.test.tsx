import LoginScreen from "@/app/login";
import { fireEvent, renderRouter, screen, waitFor } from "@/test-utils/router";
import { AccessibilityInfo } from "react-native";

const mockSignIn = jest.fn();

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockSignIn.mockResolvedValue(undefined);
  });

  it("入力した認証情報でサインイン処理を呼び出す", async () => {
    renderRouter({ login: LoginScreen }, { initialUrl: "/login" });

    expect(screen.getByText("tascal")).toBeOnTheScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText("メールアドレス"),
      "user@example.com",
    );
    fireEvent.changeText(screen.getByPlaceholderText("パスワード"), "secret");
    fireEvent.press(screen.getByText("ログイン"));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("user@example.com", "secret");
    });
  });

  it("未確認ユーザーへメール内リンクを Web で開く次の操作を表示する", async () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility");
    mockSignIn.mockRejectedValue(
      new Error(
        "メールアドレスの確認が必要です。確認メールを再送しました。メール内のリンクを Web で開いてから、もう一度ログインしてください。",
      ),
    );
    renderRouter({ login: LoginScreen }, { initialUrl: "/login" });

    fireEvent.changeText(
      screen.getByPlaceholderText("メールアドレス"),
      "user@example.com",
    );
    fireEvent.changeText(screen.getByPlaceholderText("パスワード"), "secret");
    fireEvent.press(screen.getByText("ログイン"));

    expect(
      await screen.findByText(/確認メールを再送しました/),
    ).toBeOnTheScreen();
    expect(screen.getByText(/Web で開いて/)).toBeOnTheScreen();
    expect(announce).toHaveBeenCalledWith(
      expect.stringContaining("確認メールを再送しました"),
    );
  });
});
