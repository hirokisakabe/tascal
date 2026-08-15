import { randomUUID } from "node:crypto";
import {
  Resend,
  type CreateEmailOptions,
  type CreateEmailRequestOptions,
  type CreateEmailResponse,
} from "resend";
import {
  recordEmailDeliveryFailure,
  type EmailFailureType,
  type EmailPurpose,
} from "./email-delivery-context.js";
import logger from "./logger.js";

const DEFAULT_EMAIL_TIMEOUT_MS = 3_000;

export type TransactionalEmail = {
  purpose: EmailPurpose;
  to: string;
  subject: string;
  text: string;
  html: string;
  requestId: string;
};

export interface TransactionalEmailSender {
  send(message: TransactionalEmail): Promise<void>;
}

type ResendClient = {
  emails: {
    send(
      payload: CreateEmailOptions,
      options?: CreateEmailRequestOptions,
    ): Promise<CreateEmailResponse>;
  };
};

type ResendSenderOptions = {
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
  timeoutMs?: number;
  client?: ResendClient;
};

export class EmailDeliveryError extends Error {
  constructor(readonly failureType: EmailFailureType) {
    super(`Transactional email delivery failed: ${failureType}`);
    this.name = "EmailDeliveryError";
  }
}

function classifyResendFailure(
  error: CreateEmailResponse["error"],
  timedOut: boolean,
): EmailFailureType {
  if (timedOut) return "timeout";
  if (!error) return "unknown";

  if (
    error.name === "missing_api_key" ||
    error.name === "invalid_api_key" ||
    error.name === "restricted_api_key" ||
    error.name === "invalid_from_address"
  ) {
    return "configuration";
  }

  if (error.statusCode === null) return "unreachable";
  if (error.statusCode >= 400 && error.statusCode < 500) return "rejected";
  return "unknown";
}

export function createResendEmailSender({
  apiKey,
  fromEmail,
  fromName,
  timeoutMs = DEFAULT_EMAIL_TIMEOUT_MS,
  client,
}: ResendSenderOptions): TransactionalEmailSender {
  const configurationValid = Boolean(apiKey && fromEmail && fromName);
  const resend = client ?? (apiKey ? new Resend(apiKey) : null);

  return {
    async send(message) {
      if (!configurationValid || !resend) {
        throw new EmailDeliveryError("configuration");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await resend.emails.send(
          {
            from: `${fromName} <${fromEmail}>`,
            to: message.to,
            subject: message.subject,
            text: message.text,
            html: message.html,
          },
          // Resend forwards fetch options at runtime, though signal is not yet
          // included in CreateEmailRequestOptions' public type.
          { signal: controller.signal } as CreateEmailRequestOptions,
        );

        if (response.error) {
          throw new EmailDeliveryError(
            classifyResendFailure(response.error, controller.signal.aborted),
          );
        }
      } catch (error) {
        if (error instanceof EmailDeliveryError) throw error;
        throw new EmailDeliveryError(
          controller.signal.aborted ? "timeout" : "unreachable",
        );
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

export function createEmailSenderFromEnv(): TransactionalEmailSender {
  const configuredTimeout = Number(process.env.EMAIL_SEND_TIMEOUT_MS);
  return createResendEmailSender({
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.EMAIL_FROM_ADDRESS,
    fromName: process.env.EMAIL_FROM_NAME,
    timeoutMs:
      Number.isFinite(configuredTimeout) && configuredTimeout > 0
        ? configuredTimeout
        : DEFAULT_EMAIL_TIMEOUT_MS,
  });
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character]!,
  );
}

export function createVerificationEmail(
  to: string,
  url: string,
  requestId: string,
): TransactionalEmail {
  const safeUrl = escapeHtml(url);
  return {
    purpose: "email_verification",
    to,
    requestId,
    subject: "tascal のメールアドレスを確認してください",
    text: `tascal への登録ありがとうございます。\n\n次のリンクを1時間以内に開いて、メールアドレスを確認してください。\n${url}\n\n心当たりがない場合は、このメールを破棄してください。`,
    html: `<p>tascal への登録ありがとうございます。</p><p>次のリンクを1時間以内に開いて、メールアドレスを確認してください。</p><p><a href="${safeUrl}">メールアドレスを確認する</a></p><p>心当たりがない場合は、このメールを破棄してください。</p>`,
  };
}

export function createPasswordResetEmail(
  to: string,
  url: string,
  requestId: string,
): TransactionalEmail {
  const safeUrl = escapeHtml(url);
  return {
    purpose: "password_reset",
    to,
    requestId,
    subject: "tascal のパスワードを再設定してください",
    text: `tascal のパスワード再設定がリクエストされました。\n\n次のリンクを1時間以内に開いて、新しいパスワードを設定してください。\n${url}\n\n心当たりがない場合は、このメールを破棄してください。`,
    html: `<p>tascal のパスワード再設定がリクエストされました。</p><p>次のリンクを1時間以内に開いて、新しいパスワードを設定してください。</p><p><a href="${safeUrl}">パスワードを再設定する</a></p><p>心当たりがない場合は、このメールを破棄してください。</p>`,
  };
}

export async function deliverAuthEmail(
  sender: TransactionalEmailSender,
  message: TransactionalEmail,
): Promise<void> {
  try {
    await sender.send(message);
  } catch (error) {
    const failureType =
      error instanceof EmailDeliveryError ? error.failureType : "unknown";
    const failure = {
      purpose: message.purpose,
      failureType,
      requestId: message.requestId,
    } as const;

    recordEmailDeliveryFailure(failure);
    logger.warn(failure, "Transactional email delivery failed");

    // Better Auth logs callback errors. Keep this error intentionally free of
    // recipients, tokens, API keys, and provider response details.
    throw new EmailDeliveryError(failureType);
  }
}

export function getEmailRequestId(request?: Request): string {
  return request?.headers.get("x-request-id") ?? randomUUID();
}
