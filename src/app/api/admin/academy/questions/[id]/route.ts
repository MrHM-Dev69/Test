import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAcademyAccess } from "@/lib/admin/require-academy-access";
import { answerQuestionSchema } from "@/lib/validation/academy";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const question = await prisma.courseQuestion.findUnique({ where: { id } });
  if (!question) return jsonError("سوال یافت نشد", 404);

  const parsed = answerQuestionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const updated = await prisma.courseQuestion.update({
    where: { id },
    data: { answer: parsed.data.answer },
  });

  return NextResponse.json({ question: updated });
}
