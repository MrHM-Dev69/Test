import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { kavenegarAdapter } from "./kavenegar";
import { smsirAdapter } from "./smsir";
import type { SmsProviderAdapter, SendSmsInput } from "./types";

const adapters: Record<string, SmsProviderAdapter> = {
  KAVENEGAR: kavenegarAdapter,
  SMSIR: smsirAdapter,
};

export function getActiveSmsProvider(): SmsProviderAdapter {
  const adapter = adapters[env.ACTIVE_SMS_PROVIDER];
  if (!adapter) throw new Error(`No SMS adapter registered for ${env.ACTIVE_SMS_PROVIDER}`);
  return adapter;
}

// Sends an SMS and always records the attempt in SmsLog, so delivery
// failures are auditable from the admin panel rather than silently lost.
export async function sendSms(input: SendSmsInput) {
  const provider = getActiveSmsProvider();
  const result = await provider.send(input);

  await prisma.smsLog.create({
    data: {
      toPhone: input.toPhone,
      templateKey: input.templateKey,
      body: input.body,
      provider: provider.name,
      status: result.ok ? "SENT" : "FAILED",
      providerRef: result.providerRef,
      error: result.error,
    },
  });

  return result;
}

export * from "./types";
