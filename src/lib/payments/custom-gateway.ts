import { env } from "@/lib/env";
import { timingSafeHmacEqual } from "./zarinpal";
import type {
  PaymentProviderAdapter,
  InitiatePaymentInput,
  InitiatePaymentResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from "./types";

// Template adapter for adding a bespoke/local gateway (e.g. a bank's direct
// merchant API not covered by the named providers) without touching any
// core checkout/order code. Point CUSTOM_GATEWAY_BASE_URL at the real
// gateway's REST API and implement its actual request/verify contract here;
// nothing else in the payment core needs to change to support it.
const BASE_URL = process.env.CUSTOM_GATEWAY_BASE_URL ?? "";
const API_KEY = process.env.CUSTOM_GATEWAY_API_KEY ?? "";
const WEBHOOK_SECRET = process.env.CUSTOM_GATEWAY_WEBHOOK_SECRET ?? "";

export const customGatewayAdapter: PaymentProviderAdapter = {
  name: "CUSTOM_GATEWAY",

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    if (!BASE_URL) {
      throw new Error(
        "CUSTOM_GATEWAY_BASE_URL is not configured. Set it in .env before selecting CUSTOM_GATEWAY.",
      );
    }
    const res = await fetch(`${BASE_URL}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        order_id: input.orderId,
        amount: input.amountRial,
        description: input.description,
        callback_url: input.callbackUrl,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.authority || !data?.redirect_url) {
      throw new Error(`Custom gateway payment request failed: ${JSON.stringify(data)}`);
    }
    return { authority: data.authority, redirectUrl: data.redirect_url };
  },

  async verify(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const res = await fetch(`${BASE_URL}/payments/${input.authority}/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await res.json();
    if (data?.status === "PAID" && Number(data?.amount) === input.amountRial) {
      return { ok: true, refId: String(data.ref_id), raw: data };
    }
    return { ok: false, errorCode: String(data?.status ?? "UNKNOWN"), raw: data };
  },

  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!signatureHeader || !WEBHOOK_SECRET) return false;
    return timingSafeHmacEqual(rawBody, signatureHeader, WEBHOOK_SECRET);
  },
};
