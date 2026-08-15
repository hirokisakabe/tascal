import { AsyncLocalStorage } from "node:async_hooks";

export type EmailPurpose = "email_verification" | "password_reset";

export type EmailFailureType =
  | "configuration"
  | "rejected"
  | "timeout"
  | "unreachable"
  | "unknown";

export type EmailDeliveryFailure = {
  purpose: EmailPurpose;
  failureType: EmailFailureType;
  requestId: string;
};

type DeliveryContext = {
  failures: EmailDeliveryFailure[];
};

const deliveryStorage = new AsyncLocalStorage<DeliveryContext>();

export function recordEmailDeliveryFailure(
  failure: EmailDeliveryFailure,
): void {
  deliveryStorage.getStore()?.failures.push(failure);
}

export async function withEmailDeliveryContext<T>(
  callback: () => Promise<T>,
): Promise<{ result: T; failures: EmailDeliveryFailure[] }> {
  const context: DeliveryContext = { failures: [] };
  const result = await deliveryStorage.run(context, callback);
  return { result, failures: context.failures };
}
