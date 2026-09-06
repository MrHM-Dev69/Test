import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api-helpers";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { sendEmail, emailTemplates } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";
import { getActivePaymentProvider } from "@/lib/payments";
import { env } from "@/lib/env";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError("لطفا ابتدا وارد شوید", 401);

  const rateLimit = checkRateLimit(
    `academy:enroll:${user.id}`,
    RATE_LIMITS.paymentInitiate.limit,
    RATE_LIMITS.paymentInitiate.windowSeconds,
  );
  if (!rateLimit.allowed) return jsonError("تعداد درخواست‌ها بیش از حد مجاز است", 429);

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.isPublished) return jsonError("دوره یافت نشد", 404);

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (existing) return jsonError("شما قبلا در این دوره ثبت‌نام کرده‌اید", 409);

  if (course.isFree) {
    await prisma.$transaction(async (tx) => {
      await tx.enrollment.create({
        data: { userId: user.id, courseId, source: "FREE" },
      });
      await tx.course.update({ where: { id: courseId }, data: { studentCount: { increment: 1 } } });
    });

    if (user.email) {
      await sendEmail({
        toEmail: user.email,
        subject: "ثبت‌نام در دوره",
        html: emailTemplates.courseEnrollment(course.title),
        templateKey: "courseEnrollment",
      });
    }

    await logAuditEvent({
      userId: user.id,
      action: "academy.enrollment.created",
      entity: "Course",
      entityId: courseId,
      metadata: { source: "FREE" },
    });

    return NextResponse.json({ ok: true });
  }

  // Paid course: kick off the CourseOrder -> payment provider flow.
  const priceToman = Number(course.salePrice ?? course.price);
  if (priceToman <= 0) return jsonError("قیمت دوره نامعتبر است", 400);
  const amountRial = priceToman * 10;

  const courseOrder = await prisma.courseOrder.create({
    data: { userId: user.id, courseId, amount: priceToman, status: "PENDING" },
  });

  try {
    const provider = getActivePaymentProvider();
    const callbackUrl = `${env.APP_URL}/api/academy/courses/payments/callback?courseOrderId=${courseOrder.id}`;
    const result = await provider.initiate({
      orderId: courseOrder.id,
      amountRial,
      description: `ثبت‌نام در دوره ${course.title}`,
      callbackUrl,
      payerEmail: user.email ?? undefined,
      payerPhone: user.phone ?? undefined,
    });

    await prisma.courseOrder.update({
      where: { id: courseOrder.id },
      data: { authority: result.authority },
    });

    return NextResponse.json({ redirectUrl: result.redirectUrl });
  } catch (err) {
    await prisma.courseOrder.update({ where: { id: courseOrder.id }, data: { status: "FAILED" } });
    const message = err instanceof Error ? err.message : "خطا در اتصال به درگاه پرداخت";
    return jsonError(message, 502);
  }
}
