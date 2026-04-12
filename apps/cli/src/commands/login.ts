import { defineCommand } from "citty";
import { text, password, isCancel } from "@clack/prompts";
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
    if (!process.stdin.isTTY) {
      consola.error("login は対話端末で実行してください。");
      process.exit(1);
    }

    const config = await readConfig();
    const apiUrl = args["api-url"] ?? getApiUrl(config);

    const email = await text({ message: "Email" });
    if (isCancel(email)) {
      process.exit(1);
    }

    const pw = await password({ message: "Password" });
    if (isCancel(pw)) {
      process.exit(1);
    }

    consola.start("ログイン中...");

    const res = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pw }),
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
  },
});
