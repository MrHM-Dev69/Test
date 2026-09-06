import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActivePaymentProvider } from "@/lib/payments";
import { sendEmail, emailTemplates } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";
import { env } from "@/lib/env";

// Only GET is supported: the gateway redirects the user's browser back here
// with query params (ZarinPal's flow). middleware.ts enforces the CSRF
// double-submit header on every mutating (POST/PUT/PATCH/DELETE) /api/*
// request and this route is intentionally not in its exempt list (which we
// must not edit), so a gateway that calls back via server-to-server POST
// would need that exemption added there first.
function collectCallbackParams(request: NextRequest): Record<string, string> {
  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

async function handleCallback(request: NextRequest) {
  const courseOrderId = request.nextUrl.searchParams.get("courseOrderId");
  if (!courseOrderId) return NextResponse.redirect(new URL("/academy/courses", env.APP_URL));

  const courseOrder = await prisma.courseOrder.findUnique({ where: { id: courseOrderId } });
  if (!courseOrder) return NextResponse.redirect(new URL("/academy/courses", env.APP_URL));

  const course = await prisma.course.findUnique({ where: { id: courseOrder.courseId } });
  if (!course) return NextResponse.redirect(new URL("/academy/courses", env.APP_URL));

  const failRedirect = new URL(`/academy/courses/${course.slug}`, env.APP_URL);
  failRedirect.searchParams.set("payment", "failed");

  if (courseOrder.status === "PAID") {
    // Idempotent replay: already processed, just send them to the course.
    return NextResponse.redirect(new URL(`/academy/courses/${course.slug}/learn`, env.APP_URL));
  }
  if (courseOrder.status === "FAILED") {
    return NextResponse.redirect(failRedirect);
  }
  if (!courseOrder.authority) {
    await prisma.courseOrder.update({ where: { id: courseOrder.id }, data: { status: "FAILED" } });
    return NextResponse.redirect(failRedirect);
  }

  const callbackParams = collectCallbackParams(request);
  const provider = getActivePaymentProvider();
  const amountRial = Number(courseOrder.amount) * 10;

  let verifyResult;
  try {
    verifyResult = await provider.verify({
      authority: courseOrder.authority,
      amountRial,
      callbackParams,
    });
  } catch {
    await prisma.courseOrder.update({ where: { id: courseOrder.id }, data: { status: "FAILED" } });
    return NextResponse.redirect(failRedirect);
  }

  if (!verifyResult.ok) {
    await prisma.courseOrder.update({ where: { id: courseOrder.id }, data: { status: "FAILED" } });
    return NextResponse.redirect(failRedirect);
  }

  await prisma.courseOrder.update({
    where: { id: courseOrder.id },
    data: { status: "PAID", refId: verifyResult.refId },
  });

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: courseOrder.userId, courseId: course.id } },
  });

  if (!existingEnrollment) {
    await prisma.$transaction(async (tx) => {
      await tx.enrollment.create({
        data: { userId: courseOrder.userId, courseId: course.id, source: "PURCHASE" },
      });
      await tx.course.update({ where: { id: course.id }, data: { studentCount: { increment: 1 } } });
      await tx.transaction.create({
        data: {
          type: "INCOME",
          category: "course_sale",
          amount: courseOrder.amount,
          description: `فروش دوره ${course.title}`,
          referenceType: "CourseOrder",
          referenceId: courseOrder.id,
        },
      });
    });

    const user = await prisma.user.findUnique({ where: { id: courseOrder.userId } });
    if (user?.email) {
      await sendEmail({
        toEmail: user.email,
        subject: "ثبت‌نام در دوره",
        html: emailTemplates.courseEnrollment(course.title),
        templateKey: "courseEnrollment",
      });
    }

    await logAuditEvent({
      userId: courseOrder.userId,
      action: "academy.enrollment.created",
      entity: "Course",
      entityId: course.id,
      metadata: { source: "PURCHASE", courseOrderId: courseOrder.id },
    });
  }

  return NextResponse.redirect(new URL(`/academy/courses/${course.slug}/learn`, env.APP_URL));
}

export async function GET(request: NextRequest) {
  return handleCallback(request);
}
