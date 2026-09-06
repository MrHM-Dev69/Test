import { NextRequest, NextResponse } from "next/server";
import { otpRequestSchema } from "@/lib/validation/auth";
import { issueOtp, OtpCooldownError } from "@/lib/auth/otp";
import { sendSms } from "@/lib/sms";
import { sendEmail, emailTemplates } from "@/lib/email";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { jsonError, zodErrorResponse, isEmail } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`otp:${ip}`, RATE_LIMITS.otpRequest.limit, RATE_LIMITS.otpRequest.windowSeconds);
  if (!rl.allowed) {
    return jsonError(`تعداد درخواست‌ها بیش از حد مجاز است. ${rl.retryAfterSeconds} ثانیه دیگر تلاش کنید.`, 429);
  }

  const parsed = otpRequestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { destination, purpose } = parsed.data;

  if (purpose === "LOGIN" || purpose === "RESET_PASSWORD") {
    const existing = await prisma.user.findFirst({
      where: isEmail(destination) ? { email: destination } : { phone: destination },
    });
    if (!existing) {
      // Do not reveal account existence; respond identically either way.
      return NextResponse.json({ ok: true });
    }
  }

  try {
    const { code } = await issueOtp({ destination, purpose });

    if (isEmail(destination)) {
      await sendEmail({ toEmail: destination, subject: "کد تایید", html: emailTemplates.otp(code), templateKey: "otp" });
    } else {
      await sendSms({ toPhone: destination, body: `کد تایید شما: ${code}`, templateKey: "otp" });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof OtpCooldownError) {
      return jsonError(`لطفاً ${err.retryAfterSeconds} ثانیه دیگر دوباره تلاش کنید.`, 429);
    }
    throw err;
  }
}
