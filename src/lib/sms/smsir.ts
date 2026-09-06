import { env } from "@/lib/env";
import type { SmsProviderAdapter, SendSmsInput, SendSmsResult } from "./types";

// Real SMS.ir REST integration (https://sms.ir/rest-api).
export const smsirAdapter: SmsProviderAdapter = {
  name: "SMSIR",

  async send(input: SendSmsInput): Promise<SendSmsResult> {
    if (!env.SMSIR_API_KEY) {
      return { ok: false, error: "SMSIR_API_KEY is not configured" };
    }

    try {
      const res = await fetch("https://api.sms.ir/v1/send/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.SMSIR_API_KEY,
        },
        body: JSON.stringify({
          lineNumber: env.SMSIR_LINE_NUMBER,
          messageText: input.body,
          mobiles: [input.toPhone],
        }),
      });
      const data = await res.json();
      if (res.ok && data?.status === 1) {
        return { ok: true, providerRef: String(data?.data?.messageIds?.[0] ?? "") };
      }
      return { ok: false, error: JSON.stringify(data) };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Unknown SMS error" };
    }
  },
};
