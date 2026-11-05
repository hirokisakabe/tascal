import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "../auth-client";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token, error: linkError } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const invalidLink = linkError === "INVALID_TOKEN" || !token;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    setIsPending(true);
    void authClient
      .resetPassword({ newPassword: password, token })
      .then(({ error }) => {
        if (error) {
          setError(
            error.code === "INVALID_TOKEN"
              ? "再設定リンクが無効または期限切れです。もう一度メールを送信してください。"
              : (error.message ?? "パスワードを変更できませんでした。"),
          );
          setIsPending(false);
          return;
        }
        void navigate({
          to: "/login",
          search: { passwordReset: true },
        });
      })
      .catch(() => {
        setError("パスワードを変更できませんでした。");
        setIsPending(false);
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h1 className="mb-6 text-center text-lg font-bold text-on-surface">
          新しいパスワードを設定
        </h1>
        {invalidLink ? (
          <div className="space-y-4">
            <p className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger">
              再設定リンクが無効または期限切れです。もう一度再設定メールを送信してください。
            </p>
            <Link
              to="/forgot-password"
              className="block text-center text-sm text-primary hover:text-primary-dark hover:underline"
            >
              再設定メールを送る
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-on-surface-secondary"
              >
                新しいパスワード
              </label>
              <input
                id="password"
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label
                htmlFor="password-confirmation"
                className="mb-1 block text-sm font-medium text-on-surface-secondary"
              >
                新しいパスワード（確認）
              </label>
              <input
                id="password-confirmation"
                type="password"
                minLength={8}
                value={passwordConfirmation}
                onChange={(event) =>
                  setPasswordConfirmation(event.target.value)
                }
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
              {isPending ? "変更中..." : "パスワードを変更"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
