import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { recomputeEnrollmentProgress } from "@/lib/academy/queries";

const bodySchema = z.object({
  answers: z.array(z.number().int().min(0)),
});

const PASS_THRESHOLD = 0.7;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError("لطفا ابتدا وارد شوید", 401);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      type: true,
      section: { select: { courseId: true } },
      quiz: { include: { questions: { orderBy: { order: "asc" } } } },
    },
  });
  if (!lesson || lesson.type !== "QUIZ" || !lesson.quiz) return jsonError("آزمون یافت نشد", 404);

  const courseId = lesson.section.courseId;
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (!enrollment) return jsonError("شما در این دوره ثبت‌نام نکرده‌اید", 403);

  const questions = lesson.quiz.questions;
  const { answers } = parsed.data;

  // Grade strictly server-side against the stored correctIndex — never
  // trust a client-supplied score.
  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] === questions[i].correctIndex) correct += 1;
  }
  const total = questions.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = total > 0 && correct / total >= PASS_THRESHOLD;

  let progressPct = enrollment.progressPct;

  if (passed) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: { userId: user.id, lessonId, isCompleted: true, completedAt: new Date() },
      update: { isCompleted: true, completedAt: new Date() },
    });
    await prisma.enrollment.update({
      where: { userId_courseId: { userId: user.id, courseId } },
      data: { lastLessonId: lessonId },
    });
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
      }
    }
  }

  return NextResponse.json({ score, total: questions.length, correct, passed, progressPct });
}
