import { hc } from "hono/client";
import type { AppType } from "@tascal/api/src/app.js";
import { consola } from "consola";
import { readConfig, getApiUrl } from "./config.js";

type ApiClient = ReturnType<typeof hc<AppType>>;

export async function requireAuthClient(): Promise<ApiClient> {
  const config = await readConfig();
  const token = config.token;

  if (!token) {
    consola.error("ログインしていません。`tascal login` を実行してください。");
    process.exit(1);
  }

  const apiUrl = getApiUrl(config);

  return hc<AppType>(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await fetch(input, init);
      if (res.status === 401) {
        consola.error(
          "認証エラー: セッションが無効です。`tascal login` で再ログインしてください。",
        );
        process.exit(1);
      }
      return res;
    },
  });
}

export async function handleApiError(
  res: Response,
  fallbackMessage: string,
): Promise<never> {
  let message = fallbackMessage;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await res.json()) as { error?: string };
    if (body.error) {
      message = body.error;
    }
  }
  consola.error(message);
  process.exit(1);
}
