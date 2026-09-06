import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAcademyAccess } from "@/lib/admin/require-academy-access";
import { quizSchema } from "@/lib/validation/academy";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

// Creates or fully replaces the quiz (and its questions) attached to a
// QUIZ-type lesson. Simple upsert-and-replace rather than incremental
// question editing, which keeps ordering/index consistency trivial.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id: lessonId } = await params;
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return jsonError("درس یافت نشد", 404);

  const parsed = quizSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  for (const q of parsed.data.questions) {
    if (q.correctIndex >= q.choices.length) {
      return jsonError("شاخص پاسخ صحیح خارج از محدوده گزینه‌هاست", 400);
    }
  }

  const quiz = await prisma.$transaction(async (tx) => {
    await tx.lesson.update({ where: { id: lessonId }, data: { type: "QUIZ" } });
    const existing = await tx.quiz.findUnique({ where: { lessonId } });
    if (existing) {
      await tx.quizQuestion.deleteMany({ where: { quizId: existing.id } });
      await tx.quizQuestion.createMany({
        data: parsed.data.questions.map((q) => ({ ...q, quizId: existing.id })),
      });
      return tx.quiz.findUnique({ where: { id: existing.id }, include: { questions: { orderBy: { order: "asc" } } } });
    }
    return tx.quiz.create({
      data: {
        lessonId,
        questions: { create: parsed.data.questions },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });
  });

  return NextResponse.json({ quiz });
}
