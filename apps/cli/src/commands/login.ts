import { defineCommand } from "citty";
import { createInterface } from "node:readline/promises";
import { consola } from "consola";
import { readConfig, writeConfig, getApiUrl } from "../config.js";

export default defineCommand({
  meta: {
    name: "login",
    description: "メール/パスワードでログインしてトークンを保存する",
  },
  args: {
    "api-url": {
      type: "string",
      description: "API のベース URL",
    },
  },
  async run({ args }) {
    const config = await readConfig();
    const apiUrl = args["api-url"] ?? getApiUrl(config);

    const rl = createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    try {
      const email = await rl.question("Email: ");
      const password = await readPassword(rl, "Password: ");

      consola.start("ログイン中...");

      const res = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        consola.error(
          "ログインに失敗しました。メールアドレスまたはパスワードを確認してください。",
        );
        process.exit(1);
      }

      const body = (await res.json()) as { token?: string };

      if (!body.token) {
        consola.error("トークンを取得できませんでした。");
        process.exit(1);
      }

      await writeConfig({
        ...config,
        token: body.token,
        apiUrl,
      });

      consola.success("ログインしました。");
    } finally {
      rl.close();
    }
  },
});

async function readPassword(
  rl: import("node:readline/promises").Interface,
  prompt: string,
): Promise<string> {
  const stdin = process.stdin;
  const wasRaw = stdin.isRaw;

  if (stdin.isTTY) {
    stdin.setRawMode(true);
  }

  process.stderr.write(prompt);

  let password = "";

  return new Promise((resolve) => {
    const onData = (buf: Buffer) => {
      const ch = buf.toString("utf-8");
      for (const c of ch) {
        if (c === "\r" || c === "\n") {
          process.stderr.write("\n");
          stdin.removeListener("data", onData);
          if (stdin.isTTY) {
            stdin.setRawMode(wasRaw ?? false);
          }
          // Resume normal readline behavior
          stdin.pause();
          resolve(password);
          return;
        } else if (c === "\u007F" || c === "\b") {
          // backspace
          password = password.slice(0, -1);
        } else if (c === "\u0003") {
          // Ctrl+C
          process.stderr.write("\n");
          process.exit(1);
        } else {
          password += c;
        }
      }
    };

    stdin.resume();
    stdin.on("data", onData);
    void rl; // rl is kept for the interface but raw mode handles input
  });
}
