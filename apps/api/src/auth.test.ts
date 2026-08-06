import { beforeAll, describe, expect, it } from "vitest";
import { getTestInstance } from "better-auth/test";
import { createPublicSessionPlugin } from "./auth.js";

function createTestAuth() {
  return getTestInstance({
    plugins: [createPublicSessionPlugin()],
  });
}

type TestInstance = Awaited<ReturnType<typeof createTestAuth>>;

let instance: TestInstance;
let bearerToken: string;

beforeAll(async () => {
  instance = await createTestAuth();

  const signInResponse = await instance.customFetchImpl(
    "http://localhost:3000/api/auth/sign-in/email",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: instance.testUser.email,
        password: instance.testUser.password,
      }),
    },
  );

  const signInBody = (await signInResponse.json()) as { token?: string };
  bearerToken = signInResponse.headers.get("set-auth-token") ?? "";

  expect(signInResponse.ok).toBe(true);
  expect(signInBody.token).toBeTruthy();
  expect(bearerToken).toBeTruthy();
});

async function expectSafeSession(response: Response) {
  expect(response.ok).toBe(true);
  expect(response.headers.get("cache-control")).toBe("private, no-store");

  const body = (await response.json()) as {
    user: { email: string };
    session: Record<string, unknown>;
  };

  expect(body.user.email).toBe(instance.testUser.email);
  expect(body.session.id).toEqual(expect.any(String));
  expect(body.session.userId).toEqual(expect.any(String));
  expect(body.session.expiresAt).toEqual(expect.any(String));
  expect(body.session).not.toHaveProperty("token");
  expect(JSON.stringify(body)).not.toContain(bearerToken);
}

describe("GET /api/auth/get-session", () => {
  it("Cookie 認証では再利用可能なトークンをレスポンス本文に含めない", async () => {
    const { headers } = await instance.signInWithTestUser();
    const response = await instance.customFetchImpl(
      "http://localhost:3000/api/auth/get-session",
      { headers },
    );

    await expectSafeSession(response);
  });

  it("Bearer 認証を維持しつつレスポンス本文からトークンを除外する", async () => {
    const response = await instance.customFetchImpl(
      "http://localhost:3000/api/auth/get-session",
      { headers: { Authorization: `Bearer ${bearerToken}` } },
    );

    await expectSafeSession(response);
  });
});
