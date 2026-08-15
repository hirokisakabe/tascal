import { beforeEach, describe, expect, it, vi } from "vitest";

const { warn } = vi.hoisted(() => ({ warn: vi.fn() }));

vi.mock("./logger.js", () => ({
  default: { warn },
}));

import { handleAuthRequest } from "./auth-handler.js";
import {
  createPasswordResetEmail,
  createResendEmailSender,
  createVerificationEmail,
  deliverAuthEmail,
  EmailDeliveryError,
  type TransactionalEmail,
  type TransactionalEmailSender,
} from "./email.js";

const baseMessage: TransactionalEmail = {
  purpose: "email_verification",
  to: "user@example.com",
  subject: "subject",
  text: "text",
  html: "<p>html</p>",
  requestId: "request-123",
};

describe("Resend transactional email sender", () => {
  beforeEach(() => {
    warn.mockReset();
  });

  it("text / HTML の両方を渡し、Resend の受付成功を完了として扱う", async () => {
    const send = vi.fn().mockResolvedValue({
      data: { id: "email-id" },
      error: null,
      headers: {},
    });
    const sender = createResendEmailSender({
      apiKey: "test-key",
      fromEmail: "no-reply@example.com",
      fromName: "tascal",
      client: { emails: { send } },
    });

    await sender.send(baseMessage);

    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        from: "tascal <no-reply@example.com>",
        to: "user@example.com",
        text: "text",
        html: "<p>html</p>",
      }),
    );
    const requestOptions = send.mock.calls[0]?.[1] as
      | { signal?: unknown }
      | undefined;
    expect(requestOptions?.signal).toBeInstanceOf(AbortSignal);
  });

  it("Resend が返す error を安全な拒否分類へ変換する", async () => {
    const sender = createResendEmailSender({
      apiKey: "test-key",
      fromEmail: "no-reply@example.com",
      fromName: "tascal",
      client: {
        emails: {
          send: vi.fn().mockResolvedValue({
            data: null,
            error: {
              name: "rate_limit_exceeded",
              statusCode: 429,
              message: "provider detail must stay private",
            },
            headers: {},
          }),
        },
      } as never,
    });

    await expect(sender.send(baseMessage)).rejects.toMatchObject({
      failureType: "rejected",
    });
  });

  it("送信 timeout を中断し、安全な timeout 分類へ変換する", async () => {
    const sender = createResendEmailSender({
      apiKey: "test-key",
      fromEmail: "no-reply@example.com",
      fromName: "tascal",
      timeoutMs: 5,
      client: {
        emails: {
          send: vi.fn((_payload, options) => {
            const signal = (options as unknown as { signal: AbortSignal })
              .signal;
            return new Promise((resolve) => {
              signal.addEventListener("abort", () =>
                resolve({
                  data: null,
                  error: {
                    name: "application_error",
                    statusCode: null,
                    message: "aborted",
                  },
                  headers: null,
                }),
              );
            });
          }),
        },
      } as never,
    });

    await expect(sender.send(baseMessage)).rejects.toMatchObject({
      failureType: "timeout",
    });
  });

  it("HTML に埋め込む URL を escape する", () => {
    const verification = createVerificationEmail(
      "user@example.com",
      'https://example.com/verify?a=1&value="><script>',
      "request-123",
    );
    const reset = createPasswordResetEmail(
      "user@example.com",
      "https://example.com/reset?a=1&b=2",
      "request-123",
    );

    expect(verification.text).toContain(
      'https://example.com/verify?a=1&value="><script>',
    );
    expect(verification.html).toContain(
      "a=1&amp;value=&quot;&gt;&lt;script&gt;",
    );
    expect(verification.html).not.toContain("<script>");
    expect(reset.text).toContain("https://example.com/reset?a=1&b=2");
    expect(reset.html).toContain("a=1&amp;b=2");
  });
});

describe("auth email delivery response safety", () => {
  const rejectedSender: TransactionalEmailSender = {
    send: vi.fn().mockRejectedValue(new EmailDeliveryError("rejected")),
  };

  it("確認メール失敗時は成功を断定せず、秘密値を含まない安全な応答とログを返す", async () => {
    const response = await handleAuthRequest({
      request: new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
      }),
      requestId: "request-123",
      passwordResetMinimumMs: 0,
      handler: async (request) => {
        await deliverAuthEmail(
          rejectedSender,
          createVerificationEmail(
            "private@example.com",
            "https://example.com/verify?token=secret-token",
            request.headers.get("x-request-id")!,
          ),
        ).catch(() => undefined);
        return Response.json({ token: null });
      },
    });

    expect(response.status).toBe(503);
    const body = await response.text();
    expect(body).toContain("EMAIL_DELIVERY_UNAVAILABLE");
    expect(body).not.toContain("private@example.com");
    expect(body).not.toContain("secret-token");
    expect(warn).toHaveBeenCalledWith(
      {
        purpose: "email_verification",
        failureType: "rejected",
        requestId: "request-123",
      },
      "Transactional email delivery failed",
    );
  });

  it("再設定要求は配送失敗でも登録有無を秘匿した同じ応答と最小時間を使う", async () => {
    const knownStartedAt = Date.now();
    const known = await handleAuthRequest({
      request: new Request(
        "http://localhost:3000/api/auth/request-password-reset",
        { method: "POST" },
      ),
      requestId: "known-request",
      passwordResetMinimumMs: 20,
      handler: async (request) => {
        await deliverAuthEmail(
          rejectedSender,
          createPasswordResetEmail(
            "known@example.com",
            "https://example.com/reset?token=private-token",
            request.headers.get("x-request-id")!,
          ),
        ).catch(() => undefined);
        return Response.json({ status: true, providerAccepted: false });
      },
    });
    const knownDuration = Date.now() - knownStartedAt;

    const unknownStartedAt = Date.now();
    const unknown = await handleAuthRequest({
      request: new Request(
        "http://localhost:3000/api/auth/request-password-reset",
        { method: "POST" },
      ),
      requestId: "unknown-request",
      passwordResetMinimumMs: 20,
      handler: () => Promise.resolve(Response.json({ status: true })),
    });
    const unknownDuration = Date.now() - unknownStartedAt;

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(await known.text()).toBe(await unknown.text());
    expect(knownDuration).toBeGreaterThanOrEqual(18);
    expect(unknownDuration).toBeGreaterThanOrEqual(18);
  });
});
