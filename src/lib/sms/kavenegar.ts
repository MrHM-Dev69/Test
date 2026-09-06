import { env } from "@/lib/env";
import type { SmsProviderAdapter, SendSmsInput, SendSmsResult } from "./types";

// Real Kavenegar REST integration (https://kavenegar.com/rest.html).
export const kavenegarAdapter: SmsProviderAdapter = {
  name: "KAVENEGAR",

  async send(input: SendSmsInput): Promise<SendSmsResult> {
    if (!env.KAVENEGAR_API_KEY) {
      return { ok: false, error: "KAVENEGAR_API_KEY is not configured" };
    }

    const url = `https://api.kavenegar.com/v1/${env.KAVENEGAR_API_KEY}/sms/send.json`;
    const params = new URLSearchParams({
      receptor: input.toPhone,
      message: input.body,
      sender: env.KAVENEGAR_SENDER,
    });

    try {
      const res = await fetch(`${url}?${params.toString()}`, { method: "GET" });
      const data = await res.json();
      const entry = data?.entries?.[0];
      if (res.ok && entry?.messageid) {
        return { ok: true, providerRef: String(entry.messageid) };
      }
      return { ok: false, error: JSON.stringify(data?.return ?? data) };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Unknown SMS error" };
    }
  },
};
