import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, getRequestMeta } from "@/lib/auth/session";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { jsonError, zodErrorResponse, isEmail } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { authenticator } from "otplib";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SHOP_MANAGER", "ACADEMY_MANAGER", "ACCOUNTANT", "SUPPORT", "EDITOR"];

export async function POST(req: NextRequest) {
  const { ipAddress, userAgent } = await getRequestMeta();

  const rl = checkRateLimit(`login:${ipAddress ?? "unknown"}`, RATE_LIMITS.loginAttempt.limit, RATE_LIMITS.loginAttempt.windowSeconds);
  if (!rl.allowed) {
    return jsonError(`تعداد تلاش‌های ورود بیش از حد مجاز است. ${rl.retryAfterSeconds} ثانیه صبر کنید.`, 429);
  }

  const parsed = loginSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { identifier, password, totpCode } = parsed.data;

  const user = await prisma.user.findFirst({
    where: isEmail(identifier) ? { email: identifier } : { phone: identifier },
    include: { role: true },
  });

  const recordFailure = async (reason: string) => {
    if (user) {
      await prisma.loginHistory.create({
        data: { userId: user.id, success: false, ipAddress, userAgent, reason },
      });
    }
  };

  if (!user || !user.passwordHash) {
    await recordFailure("INVALID_CREDENTIALS");
    return jsonError("اطلاعات ورود نامعتبر است.", 401);
  }

  // Per-account brute-force lock, in addition to the per-IP rate limit above.
  const recentFailures = await prisma.loginHistory.count({
    where: { userId: user.id, success: false, createdAt: { gt: new Date(Date.now() - 15 * 60_000) } },
  });
  if (recentFailures >= 10) {
    return jsonError("حساب کاربری به دلیل تلاش‌های ناموفق مکرر موقتاً قفل شده است.", 423);
  }

  if (!user.isActive) {
    await recordFailure("ACCOUNT_DISABLED");
    return jsonError("حساب کاربری غیرفعال است.", 403);
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    await recordFailure("INVALID_CREDENTIALS");
    return jsonError("اطلاعات ورود نامعتبر است.", 401);
  }

  if (ADMIN_ROLES.includes(user.role.name) && user.twoFactorEnabled) {
    if (!totpCode) {
      return NextResponse.json({ requiresTotp: true }, { status: 200 });
    }
    if (!user.twoFactorSecret || !authenticator.verify({ token: totpCode, secret: user.twoFactorSecret })) {
      await recordFailure("INVALID_TOTP");
      return jsonError("کد تایید دومرحله‌ای نامعتبر است.", 401);
    }
  }

  await createSession(user, user.role, { ipAddress, userAgent });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await prisma.loginHistory.create({ data: { userId: user.id, success: true, ipAddress, userAgent } });
  await logAuditEvent({ userId: user.id, action: "LOGIN", entity: "User", entityId: user.id, ipAddress, userAgent });

  return NextResponse.json({ ok: true, role: user.role.name });
}
