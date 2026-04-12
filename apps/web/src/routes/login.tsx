import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "../auth-client";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router requires throwing redirect()
      throw redirect({ to: "/app" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    void authClient.signIn
      .email({
        email,
        password,
      })
      .then(({ error }) => {
        if (error) {
          setError(error.message ?? "ログインに失敗しました");
          return;
        }
        void navigate({ to: "/app" });
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h1 className="mb-6 text-center text-lg font-bold text-on-surface">
          ログイン
        </h1>
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
            className="w-full rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark"
          >
            ログイン
          </button>
        </form>
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
