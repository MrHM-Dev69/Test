import { env } from "@/lib/env";
import { zarinpalAdapter } from "./zarinpal";
import { idpayAdapter } from "./idpay";
import { customGatewayAdapter } from "./custom-gateway";
import type { PaymentProviderAdapter } from "./types";

const adapters: Record<string, PaymentProviderAdapter> = {
  ZARINPAL: zarinpalAdapter,
  IDPAY: idpayAdapter,
  CUSTOM_GATEWAY: customGatewayAdapter,
};

// Adding a gateway means: implement PaymentProviderAdapter in its own file,
// register it here, and set ACTIVE_PAYMENT_PROVIDER — no other code changes.
export function getActivePaymentProvider(): PaymentProviderAdapter {
  const adapter = adapters[env.ACTIVE_PAYMENT_PROVIDER];
  if (!adapter) {
    throw new Error(`No payment adapter registered for ${env.ACTIVE_PAYMENT_PROVIDER}`);
  }
  return adapter;
}

export * from "./types";
