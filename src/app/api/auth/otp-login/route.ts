import { NextRequest, NextResponse } from "next/server";
import { otpLoginSchema } from "@/lib/validation/auth";
import { verifyOtp } from "@/lib/auth/otp";
import { createSession, getRequestMeta } from "@/lib/auth/session";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { jsonError, zodErrorResponse, isEmail } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

// Passwordless login via OTP — for customers who registered with phone/OTP
// only (no password set) or who prefer OTP over remembering a password.
export async function POST(req: NextRequest) {
  const { ipAddress, userAgent } = await getRequestMeta();
  const rl = checkRateLimit(`otp-login:${ipAddress ?? "unknown"}`, RATE_LIMITS.loginAttempt.limit, RATE_LIMITS.loginAttempt.windowSeconds);
  if (!rl.allowed) return jsonError("تعداد تلاش‌ها بیش از حد مجاز است.", 429);

  const parsed = otpLoginSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { destination, code } = parsed.data;

  const verifyResult = await verifyOtp({ destination, purpose: "LOGIN", code });
  if (!verifyResult.ok) return jsonError("کد تایید نامعتبر یا منقضی شده است.", 422);

  const user = await prisma.user.findFirst({
    where: isEmail(destination) ? { email: destination } : { phone: destination },
    include: { role: true },
  });
  if (!user || !user.isActive) return jsonError("کاربری یافت نشد.", 404);

  await createSession(user, user.role, { ipAddress, userAgent });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await prisma.loginHistory.create({ data: { userId: user.id, success: true, ipAddress, userAgent, reason: "OTP" } });
  await logAuditEvent({ userId: user.id, action: "LOGIN_OTP", entity: "User", entityId: user.id, ipAddress, userAgent });

  return NextResponse.json({ ok: true, role: user.role.name });
}
