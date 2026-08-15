import { withEmailDeliveryContext } from "./email-delivery-context.js";

const GENERIC_RESET_RESPONSE = {
  status: true,
  message:
    "If this email exists in our system, check your email for the reset link",
};

export type AuthRequestHandlerOptions = {
  request: Request;
  requestId: string;
  handler: (request: Request) => Promise<Response>;
  passwordResetMinimumMs?: number;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleAuthRequest({
  request,
  requestId,
  handler,
  passwordResetMinimumMs = 3_000,
}: AuthRequestHandlerOptions): Promise<Response> {
  const startedAt = Date.now();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  const requestWithId = new Request(request, { headers: requestHeaders });
  const { result, failures } = await withEmailDeliveryContext(() =>
    handler(requestWithId),
  );

  if (new URL(request.url).pathname.endsWith("/request-password-reset")) {
    const remaining = passwordResetMinimumMs - (Date.now() - startedAt);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }

    return result.ok ? jsonResponse(GENERIC_RESET_RESPONSE) : result;
  }

  if (failures.length > 0) {
    return jsonResponse(
      {
        code: "EMAIL_DELIVERY_UNAVAILABLE",
        message:
          "メールを送信できませんでした。時間をおいて再度お試しください。",
      },
      503,
    );
  }

  return result;
}
