import LoginScreen from "@/app/login";
import { fireEvent, renderRouter, screen, waitFor } from "@/test-utils/router";

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

  it("入力した認証情報でログインできる", async () => {
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
});
