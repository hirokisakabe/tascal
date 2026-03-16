import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "../auth-client";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    void authClient.signUp
      .email({
        name,
        email,
        password,
      })
      .then(({ error }) => {
        if (error) {
          setError(error.message ?? "サインアップに失敗しました");
          return;
        }
        void navigate({ to: "/" });
      });
  };

  return (
    <div>
      <h1>サインアップ</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">名前</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
        <button type="submit">サインアップ</button>
      </form>
      <p>
        すでにアカウントをお持ちの方は
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            void navigate({ to: "/login" });
          }}
        >
          ログイン
        </a>
      </p>
    </div>
  );
}
