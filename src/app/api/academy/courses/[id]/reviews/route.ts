import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().trim().min(3).max(2000),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError("لطفا ابتدا وارد شوید", 401);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (!enrollment) return jsonError("برای ثبت نظر باید در دوره ثبت‌نام کرده باشید", 403);

  const existing = await prisma.courseReview.findFirst({ where: { courseId, userId: user.id } });
  if (existing) return jsonError("شما قبلا برای این دوره نظر ثبت کرده‌اید", 409);

  const review = await prisma.courseReview.create({
    data: { courseId, userId: user.id, rating: parsed.data.rating, content: parsed.data.content },
  });

  return NextResponse.json({ ok: true, review }, { status: 201 });
}
