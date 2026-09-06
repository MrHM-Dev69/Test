import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { recomputeEnrollmentProgress } from "@/lib/academy/queries";

const bodySchema = z.object({
  watchedSeconds: z.number().int().min(0).optional(),
  isCompleted: z.boolean(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError("لطفا ابتدا وارد شوید", 401);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { watchedSeconds, isCompleted } = parsed.data;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, section: { select: { courseId: true } } },
  });
  if (!lesson) return jsonError("درس یافت نشد", 404);

  const courseId = lesson.section.courseId;
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (!enrollment) return jsonError("شما در این دوره ثبت‌نام نکرده‌اید", 403);

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: {
      userId: user.id,
      lessonId,
      isCompleted,
      watchedSeconds: watchedSeconds ?? 0,
      completedAt: isCompleted ? new Date() : null,
    },
    update: {
      isCompleted,
      ...(watchedSeconds !== undefined ? { watchedSeconds } : {}),
      completedAt: isCompleted ? new Date() : undefined,
    },
  });

  await prisma.enrollment.update({
    where: { userId_courseId: { userId: user.id, courseId } },
    data: { lastLessonId: lessonId },
  });

  let progressPct = enrollment.progressPct;
  let certificateCreated = false;

  if (isCompleted) {
    const result = await recomputeEnrollmentProgress(user.id, courseId);
    progressPct = result.progressPct;

    if (progressPct >= 100 && !enrollment.completedAt) {
      const existingCert = await prisma.certificate2.findUnique({
        where: { enrollmentId: enrollment.id },
      });
      if (!existingCert) {
        await prisma.certificate2.create({
          data: {
            enrollmentId: enrollment.id,
            serialNumber: `CERT-${courseId.slice(0, 6)}-${Date.now()}`,
          },
        });
        certificateCreated = true;
      }
    }
  }

  return NextResponse.json({ ok: true, progressPct, certificateCreated });
}
