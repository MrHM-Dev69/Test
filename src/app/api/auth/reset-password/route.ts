import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { verifyOtp } from "@/lib/auth/otp";
import { hashPassword, isPasswordStrongEnough } from "@/lib/auth/password";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { jsonError, zodErrorResponse, isEmail } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`reset-password:${ip}`, RATE_LIMITS.passwordReset.limit, RATE_LIMITS.passwordReset.windowSeconds);
  if (!rl.allowed) return jsonError("تعداد تلاش‌ها بیش از حد مجاز است.", 429);

  const parsed = resetPasswordSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { destination, code, newPassword } = parsed.data;

  if (!isPasswordStrongEnough(newPassword)) {
    return jsonError("رمز عبور باید حداقل ۸ کاراکتر و شامل حرف و عدد باشد.", 422);
  }

  const verifyResult = await verifyOtp({ destination, purpose: "RESET_PASSWORD", code });
  if (!verifyResult.ok) return jsonError("کد تایید نامعتبر یا منقضی شده است.", 422);

  const user = await prisma.user.findFirst({
    where: isEmail(destination) ? { email: destination } : { phone: destination },
  });
  if (!user) return jsonError("کاربر یافت نشد.", 404);

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await prisma.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await logAuditEvent({ userId: user.id, action: "PASSWORD_RESET", entity: "User", entityId: user.id });

  return NextResponse.json({ ok: true });
}
