import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAcademyAccess } from "@/lib/admin/require-academy-access";
import { adminGrantSchema } from "@/lib/validation/academy";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { sendEmail, emailTemplates } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const parsed = adminGrantSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { identifier, courseId } = parsed.data;
  const [user, course] = await Promise.all([
    prisma.user.findFirst({ where: { OR: [{ email: identifier }, { phone: identifier }] } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);
  if (!user) return jsonError("کاربری با این ایمیل یا شماره تماس یافت نشد", 404);
  if (!course) return jsonError("دوره یافت نشد", 404);
  const userId = user.id;

  const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (existing) return jsonError("این کاربر قبلا در این دوره ثبت‌نام کرده است", 409);

  const enrollment = await prisma.$transaction(async (tx) => {
    const created = await tx.enrollment.create({ data: { userId, courseId, source: "ADMIN_GRANT" } });
    await tx.course.update({ where: { id: courseId }, data: { studentCount: { increment: 1 } } });
    return created;
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
    userId: access.user.id,
    action: "academy.enrollment.admin_granted",
    entity: "Enrollment",
    entityId: enrollment.id,
    metadata: { targetUserId: userId, courseId },
  });

  return NextResponse.json({ enrollment }, { status: 201 });
}
