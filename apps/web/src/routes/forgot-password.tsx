import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "../auth-client";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsPending(true);

    void authClient
      .requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      })
      .then(({ error }) => {
        if (error) {
          setError(
            "リクエストを処理できませんでした。時間をおいて再度お試しください。",
          );
          setIsPending(false);
          return;
        }
        setSubmitted(true);
        setIsPending(false);
      })
      .catch(() => {
        setError(
          "リクエストを処理できませんでした。時間をおいて再度お試しください。",
        );
        setIsPending(false);
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h1 className="mb-2 text-center text-lg font-bold text-on-surface">
          パスワードを再設定
        </h1>
        <p className="mb-6 text-sm text-on-surface-secondary">
          登録したメールアドレスを入力してください。
        </p>

        {submitted ? (
          <div className="space-y-4">
            <p className="rounded-md bg-primary-light px-3 py-2 text-sm text-primary-dark">
              アカウントが存在する場合は、パスワード再設定メールをお送りします。メールをご確認ください。
            </p>
            <Link
              to="/login"
              className="block text-center text-sm text-primary hover:text-primary-dark hover:underline"
            >
              ログインへ戻る
            </Link>
          </div>
        ) : (
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
                onChange={(event) => setEmail(event.target.value)}
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
              {isPending ? "送信中..." : "再設定メールを送る"}
            </button>
            <Link
              to="/login"
              className="block text-center text-sm text-primary hover:text-primary-dark hover:underline"
            >
              ログインへ戻る
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
