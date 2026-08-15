import { describe, expect, it } from "vitest";
import { getTestInstance } from "better-auth/test";
import { createAuthOptions } from "./auth.js";
import type { TransactionalEmail, TransactionalEmailSender } from "./email.js";

function createCollectingSender() {
  const messages: TransactionalEmail[] = [];
  const sender: TransactionalEmailSender = {
    send(message) {
      messages.push(message);
      return Promise.resolve();
    },
  };
  return { messages, sender };
}

async function postJson(
  instance: {
    customFetchImpl: (url: string, init?: RequestInit) => Promise<Response>;
  },
  path: string,
  body: unknown,
) {
  return instance.customFetchImpl(`http://localhost:3000/api/auth${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

describe("email verification", () => {
  it("新規登録では session を作らず、確認後にだけログインでき、再送も sign-in に限定する", async () => {
    const { messages, sender } = createCollectingSender();
    const instance = await getTestInstance(createAuthOptions(sender));
    messages.length = 0;
    const email = "new-user@example.com";
    const password = "password123";

    const signUp = await postJson(instance, "/sign-up/email", {
      name: "New User",
      email,
      password,
      callbackURL: "/login?verified=true",
    });
    expect(signUp.status).toBe(200);
    expect(await signUp.json()).toMatchObject({ token: null });
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      purpose: "email_verification",
      to: email,
    });

    const blockedSignIn = await postJson(instance, "/sign-in/email", {
      email,
      password,
      callbackURL: "/login?verified=true",
    });
    expect(blockedSignIn.status).toBe(403);
    expect(await blockedSignIn.json()).toMatchObject({
      code: "EMAIL_NOT_VERIFIED",
    });
    expect(messages).toHaveLength(2);

    const publicResend = await postJson(instance, "/send-verification-email", {
      email,
      callbackURL: "/login?verified=true",
    });
    expect(publicResend.status).toBe(404);

    const verify = await instance.customFetchImpl(
      messages[0].text.match(/https?:\/\/\S+/)![0],
      {
        redirect: "manual",
      },
    );
    expect(verify.status).toBe(302);
    expect(verify.headers.get("location")).toContain("/login?verified=true");

    const signedIn = await postJson(instance, "/sign-in/email", {
      email,
      password,
    });
    expect(signedIn.status).toBe(200);
    const signedInBody = (await signedIn.json()) as { token?: unknown };
    expect(typeof signedInBody.token).toBe("string");
  });

  it("不正・期限切れの確認 token を処理せず callback にエラーを返す", async () => {
    const { messages, sender } = createCollectingSender();
    const options = createAuthOptions(sender);
    const instance = await getTestInstance({
      ...options,
      emailVerification: { ...options.emailVerification, expiresIn: -1 },
    });
    messages.length = 0;

    await postJson(instance, "/sign-up/email", {
      name: "Expired User",
      email: "expired@example.com",
      password: "password123",
      callbackURL: "/login?verified=true",
    });
    const expired = await instance.customFetchImpl(
      messages[0].text.match(/https?:\/\/\S+/)![0],
      { redirect: "manual" },
    );
    expect(expired.status).toBe(302);
    expect(expired.headers.get("location")).toContain("error=TOKEN_EXPIRED");

    const invalid = await instance.customFetchImpl(
      "http://localhost:3000/api/auth/verify-email?token=invalid&callbackURL=%2Flogin%3Fverified%3Dtrue",
      { redirect: "manual" },
    );
    expect(invalid.status).toBe(302);
    expect(invalid.headers.get("location")).toContain("error=INVALID_TOKEN");
  });
});

describe("password reset", () => {
  it("登録有無を同じ応答にし、再設定後は既存 session を失効して新 password だけを受け付ける", async () => {
    const { messages, sender } = createCollectingSender();
    const instance = await getTestInstance(createAuthOptions(sender));
    messages.length = 0;
    const email = "reset-user@example.com";
    const oldPassword = "password123";
    const newPassword = "new-password123";

    await postJson(instance, "/sign-up/email", {
      name: "Reset User",
      email,
      password: oldPassword,
      callbackURL: "/login?verified=true",
    });
    await instance.customFetchImpl(
      messages[0].text.match(/https?:\/\/\S+/)![0],
      {
        redirect: "manual",
      },
    );

    const signIn = await postJson(instance, "/sign-in/email", {
      email,
      password: oldPassword,
    });
    const cookie = signIn.headers.get("set-cookie")!;

    const known = await postJson(instance, "/request-password-reset", {
      email,
      redirectTo: "/reset-password",
    });
    const unknown = await postJson(instance, "/request-password-reset", {
      email: "unknown@example.com",
      redirectTo: "/reset-password",
    });
    expect(await known.json()).toEqual(await unknown.json());

    const resetMessage = messages.find(
      (message) => message.purpose === "password_reset",
    )!;
    const callback = await instance.customFetchImpl(
      resetMessage.text.match(/https?:\/\/\S+/)![0],
      { redirect: "manual" },
    );
    const location = callback.headers.get("location")!;
    const token = new URL(location, "http://localhost:3000").searchParams.get(
      "token",
    )!;

    const reset = await postJson(instance, "/reset-password", {
      token,
      newPassword,
    });
    expect(reset.status).toBe(200);

    const oldSession = await instance.customFetchImpl(
      "http://localhost:3000/api/auth/get-session",
      { headers: { Cookie: cookie } },
    );
    expect(await oldSession.json()).toBeNull();
    expect(
      (
        await postJson(instance, "/sign-in/email", {
          email,
          password: oldPassword,
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await postJson(instance, "/sign-in/email", {
          email,
          password: newPassword,
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await postJson(instance, "/reset-password", {
          token,
          newPassword: "another-password123",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await postJson(instance, "/reset-password", {
          token: "invalid",
          newPassword: "another-password123",
        })
      ).status,
    ).toBe(400);
  });
});
