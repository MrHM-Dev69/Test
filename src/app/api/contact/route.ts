import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactFormSchema } from "@/lib/validation/personal";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { getRequestMeta } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { ipAddress } = await getRequestMeta();

  const rl = checkRateLimit(
    `contact:${ipAddress ?? "unknown"}`,
    RATE_LIMITS.contactForm.limit,
    RATE_LIMITS.contactForm.windowSeconds,
  );
  if (!rl.allowed) {
    return jsonError(`تعداد درخواست‌ها بیش از حد مجاز است. ${rl.retryAfterSeconds} ثانیه صبر کنید.`, 429);
  }

  const parsed = contactFormSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { name, email, phone, subject, message } = parsed.data;

  const contactMessage = await prisma.contactMessage.create({
    data: { name, email, phone, subject, message },
  });

  // Notify every admin/super-admin user via the in-app notification center.
  const admins = await prisma.user.findMany({
    where: { role: { name: { in: ["SUPER_ADMIN", "ADMIN"] } }, isActive: true },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        channel: "IN_APP" as const,
        title: "پیام جدید از فرم تماس",
        body: `${name} (${email}) یک پیام جدید ارسال کرد: ${subject ?? message.slice(0, 60)}`,
        link: "/admin/personal/contact-messages",
      })),
    });
  }

  // Best-effort email to the profile's contact address; failures are logged
  // by sendEmail itself (EmailLog) and never block the user-facing response.
  const profile = await prisma.profile.findFirst({ select: { email: true } });
  if (profile?.email) {
    await sendEmail({
      toEmail: profile.email,
      subject: subject ? `پیام جدید از فرم تماس: ${subject}` : "پیام جدید از فرم تماس",
      html: `
        <div style="font-family: sans-serif; direction: rtl;">
          <h2>پیام جدید از فرم تماس سایت</h2>
          <p><strong>نام:</strong> ${escapeHtml(name)}</p>
          <p><strong>ایمیل:</strong> ${escapeHtml(email)}</p>
          ${phone ? `<p><strong>تلفن:</strong> ${escapeHtml(phone)}</p>` : ""}
          ${subject ? `<p><strong>موضوع:</strong> ${escapeHtml(subject)}</p>` : ""}
          <p><strong>پیام:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
        </div>
      `,
      templateKey: "contact_form_notification",
    });
  }

  return NextResponse.json({ ok: true, id: contactMessage.id }, { status: 201 });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
