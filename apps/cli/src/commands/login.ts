import { defineCommand } from "citty";
import { text, password, isCancel } from "@clack/prompts";
import { consola } from "consola";
import { readConfig, writeConfig, getApiUrl } from "../config.js";

type AuthErrorBody = { code?: string };

export function getLoginFailureMessage(
  status: number,
  body: AuthErrorBody | null,
): string {
  if (body?.code === "EMAIL_NOT_VERIFIED") {
    return "メールアドレスの確認が必要です。確認メールを再送しました。メール内のリンクを Web で開いてから、もう一度ログインしてください。";
  }
  if (body?.code === "EMAIL_DELIVERY_UNAVAILABLE") {
    return "確認メールを送信できませんでした。時間をおいて、同じ資格情報で再度ログインしてください。";
  }
  return `ログインに失敗しました (${status})。メールアドレスとパスワードを確認してください。`;
}

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
      headers: {
        "Content-Type": "application/json",
        Origin: new URL(apiUrl).origin,
      },
      body: JSON.stringify({ email, password: pw }),
    });

    if (!res.ok) {
      let body: AuthErrorBody | null = null;
      try {
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          body = (await res.json()) as AuthErrorBody;
        }
      } catch {
        // provider detail を含み得る raw response は表示しない
      }
      consola.error(getLoginFailureMessage(res.status, body));
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
