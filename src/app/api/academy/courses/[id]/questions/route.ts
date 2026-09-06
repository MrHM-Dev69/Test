import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const bodySchema = z.object({
  question: z.string().trim().min(3).max(2000),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError("لطفا ابتدا وارد شوید", 401);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) return jsonError("دوره یافت نشد", 404);

  const question = await prisma.courseQuestion.create({
    data: { courseId, userId: user.id, question: parsed.data.question },
  });

  return NextResponse.json({ ok: true, question }, { status: 201 });
}
