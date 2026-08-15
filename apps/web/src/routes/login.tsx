import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "../auth-client";
import { LoadingScreen } from "../components/LoadingScreen";

type LoginSearch = {
  verified?: boolean;
  signup?: boolean;
  passwordReset?: boolean;
  error?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    verified:
      search.verified === true || search.verified === "true" ? true : undefined,
    signup:
      search.signup === true || search.signup === "true" ? true : undefined,
    passwordReset:
      search.passwordReset === true || search.passwordReset === "true"
        ? true
        : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router requires throwing redirect()
      throw redirect({ to: "/app" });
    }
  },
  pendingComponent: LoadingScreen,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (
      search.verified ||
      search.signup ||
      search.passwordReset ||
      search.error
    ) {
      window.history.replaceState(window.history.state, "", "/login");
    }
  }, [search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsPending(true);

    void authClient.signIn
      .email({
        email,
        password,
      })
      .then(({ error }) => {
        if (error) {
          if (error.code === "EMAIL_NOT_VERIFIED") {
            setError(
              "メールアドレスの確認が必要です。確認メールを再送しました。メール内のリンクを開いてから、もう一度ログインしてください。",
            );
          } else if (error.code === "EMAIL_DELIVERY_UNAVAILABLE") {
            setError(
              "確認メールを送信できませんでした。時間をおいて、同じ資格情報で再度ログインしてください。",
            );
          } else {
            setError(error.message ?? "ログインに失敗しました");
          }
          setIsPending(false);
          return;
        }
        void navigate({ to: "/app" });
      })
      .catch(() => {
        setError("ログインに失敗しました");
        setIsPending(false);
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h1 className="mb-6 text-center text-lg font-bold text-on-surface">
          ログイン
        </h1>
        {search.verified && (
          <p className="mb-4 rounded-md bg-primary-light px-3 py-2 text-sm text-primary-dark">
            メールアドレスを確認しました。ログインしてください。
          </p>
        )}
        {search.signup && (
          <p className="mb-4 rounded-md bg-primary-light px-3 py-2 text-sm text-primary-dark">
            確認メールを送信しました。メール内のリンクを開いてからログインしてください。
          </p>
        )}
        {search.passwordReset && (
          <p className="mb-4 rounded-md bg-primary-light px-3 py-2 text-sm text-primary-dark">
            パスワードを変更しました。新しいパスワードでログインしてください。
          </p>
        )}
        {search.error && (
          <p className="mb-4 rounded-md bg-danger-light px-3 py-2 text-sm text-danger">
            確認リンクが無効または期限切れです。正しい資格情報でログインすると確認メールを再送できます。
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-on-surface-secondary"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-on-surface-secondary"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {error && (
            <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {isPending ? "ログイン中..." : "ログイン"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <a
            href="/forgot-password"
            className="text-primary hover:text-primary-dark hover:underline"
          >
            パスワードをお忘れですか？
          </a>
        </p>
        <p className="mt-4 text-center text-sm text-on-surface-secondary">
          アカウントをお持ちでない方は
          <a
            href="/signup"
            onClick={(e) => {
              e.preventDefault();
              void navigate({ to: "/signup" });
            }}
            className="ml-1 text-primary hover:text-primary-dark hover:underline"
          >
            サインアップ
          </a>
        </p>
      </div>
    </div>
  );
}
