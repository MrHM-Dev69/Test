import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { OtpPurpose } from "@prisma/client";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;
// Minimum gap between two OTP requests for the same destination+purpose,
// to blunt SMS-bombing / cost-abuse via repeated OTP triggers.
const RESEND_COOLDOWN_SECONDS = 60;

function generateNumericCode(length: number): string {
  const max = 10 ** length;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(length, "0");
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export class OtpCooldownError extends Error {
  constructor(public retryAfterSeconds: number) {
    super("OTP_COOLDOWN");
  }
}

export async function issueOtp(params: {
  destination: string;
  purpose: OtpPurpose;
  userId?: string;
}): Promise<{ code: string; expiresAt: Date }> {
  const recent = await prisma.otpCode.findFirst({
    where: { destination: params.destination, purpose: params.purpose },
    orderBy: { createdAt: "desc" },
  });

  if (recent) {
    const secondsSince = (Date.now() - recent.createdAt.getTime()) / 1000;
    if (secondsSince < RESEND_COOLDOWN_SECONDS) {
      throw new OtpCooldownError(Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSince));
    }
  }

  const code = generateNumericCode(OTP_LENGTH);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  await prisma.otpCode.create({
    data: {
      destination: params.destination,
      purpose: params.purpose,
      userId: params.userId,
      codeHash: hashCode(code),
      maxAttempts: MAX_ATTEMPTS,
      expiresAt,
    },
  });

  return { code, expiresAt };
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "EXPIRED" | "TOO_MANY_ATTEMPTS" | "INVALID_CODE" };

export async function verifyOtp(params: {
  destination: string;
  purpose: OtpPurpose;
  code: string;
}): Promise<OtpVerifyResult> {
  const record = await prisma.otpCode.findFirst({
    where: { destination: params.destination, purpose: params.purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, reason: "NOT_FOUND" };
  if (record.expiresAt < new Date()) return { ok: false, reason: "EXPIRED" };
  if (record.attempts >= record.maxAttempts) return { ok: false, reason: "TOO_MANY_ATTEMPTS" };

  if (hashCode(params.code) !== record.codeHash) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "INVALID_CODE" };
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true };
}
