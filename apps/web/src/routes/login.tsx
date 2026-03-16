import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "../auth-client";

export const Route = createFileRoute("/login")({
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
        void navigate({ to: "/" });
      });
  };

  return (
    <div>
      <h1>ログイン</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">メールアドレス</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">パスワード</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p>{error}</p>}
        <button type="submit">ログイン</button>
      </form>
      <p>
        アカウントをお持ちでない方は
        <a
          href="/signup"
          onClick={(e) => {
            e.preventDefault();
            void navigate({ to: "/signup" });
          }}
        >
          サインアップ
        </a>
      </p>
    </div>
  );
}
