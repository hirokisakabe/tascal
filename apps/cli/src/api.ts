import { consola } from "consola";
import { readConfig, getApiUrl } from "./config.js";

interface ApiContext {
  apiUrl: string;
  token: string;
}

export async function requireAuth(): Promise<ApiContext> {
  const config = await readConfig();
  const token = config.token;

  if (!token) {
    consola.error("ログインしていません。`tascal login` を実行してください。");
    process.exit(1);
  }

  return { apiUrl: getApiUrl(config), token };
}

export async function apiRequest(
  ctx: ApiContext,
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${ctx.token}`,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${ctx.apiUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    consola.error(
      "認証エラー: セッションが無効です。`tascal login` で再ログインしてください。",
    );
    process.exit(1);
  }

  return res;
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
