import { env } from "@/lib/env";
import { timingSafeHmacEqual } from "./zarinpal";
import type {
  PaymentProviderAdapter,
  InitiatePaymentInput,
  InitiatePaymentResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from "./types";

// Real IDPay REST integration (https://idpay.ir/docs).
const BASE_URL = "https://api.idpay.ir/v1.1/payment";
const SANDBOX_HEADER = env.IDPAY_SANDBOX === "true" ? "1" : "0";

export const idpayAdapter: PaymentProviderAdapter = {
  name: "IDPAY",

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": env.IDPAY_API_KEY,
        "X-SANDBOX": SANDBOX_HEADER,
      },
      body: JSON.stringify({
        order_id: input.orderId,
        amount: input.amountRial,
        name: input.payerName,
        phone: input.payerPhone,
        mail: input.payerEmail,
        desc: input.description,
        callback: input.callbackUrl,
      }),
    });

    const data = await res.json();
    if (!data?.id || !data?.link) {
      throw new Error(`IDPay payment request failed: ${JSON.stringify(data)}`);
    }

    return { authority: data.id, redirectUrl: data.link };
  },

  async verify(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const res = await fetch(`${BASE_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": env.IDPAY_API_KEY,
        "X-SANDBOX": SANDBOX_HEADER,
      },
      body: JSON.stringify({ id: input.authority, order_id: input.callbackParams.order_id }),
    });

    const data = await res.json();
    if (data?.status === 100 || data?.status === 101) {
      return { ok: true, refId: String(data.track_id), raw: data };
    }
    return { ok: false, errorCode: String(data?.status ?? "UNKNOWN"), raw: data };
  },

  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!signatureHeader) return false;
    return timingSafeHmacEqual(rawBody, signatureHeader, env.IDPAY_API_KEY);
  },
};
