import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/auth";
import { verifyOtp } from "@/lib/auth/otp";
import { hashPassword, isPasswordStrongEnough } from "@/lib/auth/password";
import { createSession, getRequestMeta } from "@/lib/auth/session";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { jsonError, zodErrorResponse, isEmail } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { ipAddress, userAgent } = await getRequestMeta();
  const rl = checkRateLimit(`register:${ipAddress ?? "unknown"}`, RATE_LIMITS.loginAttempt.limit, RATE_LIMITS.loginAttempt.windowSeconds);
  if (!rl.allowed) return jsonError("تعداد تلاش‌ها بیش از حد مجاز است.", 429);

  const parsed = registerSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { name, phone, email, password, otpCode } = parsed.data;

  if (!isPasswordStrongEnough(password)) {
    return jsonError("رمز عبور باید حداقل ۸ کاراکتر و شامل حرف و عدد باشد.", 422);
  }

  const destination = phone ?? email!;
  const verifyResult = await verifyOtp({ destination, purpose: "REGISTER", code: otpCode });
  if (!verifyResult.ok) return jsonError("کد تایید نامعتبر یا منقضی شده است.", 422);

  const existing = await prisma.user.findFirst({
    where: { OR: [phone ? { phone } : {}, email ? { email } : {}] },
  });
  if (existing) return jsonError("کاربری با این مشخصات قبلاً ثبت‌نام کرده است.", 409);

  const customerRole = await prisma.role.findUnique({ where: { name: "CUSTOMER" } });
  if (!customerRole) return jsonError("پیکربندی سیستم نقش‌ها ناقص است.", 500);

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email,
      passwordHash,
      roleId: customerRole.id,
      phoneVerifiedAt: phone ? new Date() : undefined,
      emailVerifiedAt: email && isEmail(destination) ? new Date() : undefined,
    },
  });

  await createSession(user, customerRole, { ipAddress, userAgent });
  await logAuditEvent({ userId: user.id, action: "USER_REGISTERED", entity: "User", entityId: user.id, ipAddress, userAgent });

  if (email) {
    await sendEmail({ toEmail: email, subject: "خوش آمدید", html: emailTemplates.welcome(name), templateKey: "welcome" });
  }

  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name } });
}
