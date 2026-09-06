import crypto from "crypto";
import { env } from "@/lib/env";
import type {
  PaymentProviderAdapter,
  InitiatePaymentInput,
  InitiatePaymentResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from "./types";

// Real ZarinPal REST integration (https://docs.zarinpal.com). Sandbox vs.
// production is switched purely by ZARINPAL_SANDBOX + which host we call —
// no mock responses are fabricated here. Without a real ZARINPAL_MERCHANT_ID
// set in .env, `initiate` will fail with ZarinPal's own error response,
// which is surfaced to the caller rather than swallowed.
const BASE_HOST = env.ZARINPAL_SANDBOX === "true" ? "sandbox.zarinpal.com" : "payment.zarinpal.com";
const REQUEST_URL = `https://${BASE_HOST}/pg/v4/payment/request.json`;
const VERIFY_URL = `https://${BASE_HOST}/pg/v4/payment/verify.json`;
const STARTPAY_URL = (authority: string) => `https://${BASE_HOST}/pg/StartPay/${authority}`;

export const zarinpalAdapter: PaymentProviderAdapter = {
  name: "ZARINPAL",

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const res = await fetch(REQUEST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: env.ZARINPAL_MERCHANT_ID,
        amount: input.amountRial,
        description: input.description,
        callback_url: input.callbackUrl,
        metadata: {
          email: input.payerEmail,
          mobile: input.payerPhone,
          order_id: input.orderId,
        },
      }),
    });

    const data = await res.json();
    const authority = data?.data?.authority;
    const code = data?.data?.code;

    if (!authority || code !== 100) {
      throw new Error(
        `ZarinPal payment request failed: ${JSON.stringify(data?.errors ?? data)}`,
      );
    }

    return { authority, redirectUrl: STARTPAY_URL(authority) };
  },

  async verify(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: env.ZARINPAL_MERCHANT_ID,
        amount: input.amountRial,
        authority: input.authority,
      }),
    });

    const data = await res.json();
    const code = data?.data?.code;

    if (code === 100 || code === 101) {
      return { ok: true, refId: String(data.data.ref_id), raw: data };
    }
    return { ok: false, errorCode: String(code ?? "UNKNOWN"), raw: data };
  },

  verifyWebhookSignature(): boolean {
    // ZarinPal's flow is redirect+server-verify based (no separate signed
    // webhook body to validate); the security boundary is that `verify()`
    // is always called server-side against ZarinPal's API using our own
    // merchant_id, never trusting the client's redirect query params alone.
    return true;
  },
};

export function timingSafeHmacEqual(payload: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
