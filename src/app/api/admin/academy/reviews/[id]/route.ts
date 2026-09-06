import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAcademyAccess } from "@/lib/admin/require-academy-access";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const patchSchema = z.object({ isApproved: z.boolean() });

async function recalcCourseRating(courseId: string) {
  const agg = await prisma.courseReview.aggregate({
    where: { courseId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.course.update({
    where: { id: courseId },
    data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count.rating },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const review = await prisma.courseReview.findUnique({ where: { id } });
  if (!review) return jsonError("نظر یافت نشد", 404);

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const updated = await prisma.courseReview.update({
    where: { id },
    data: { isApproved: parsed.data.isApproved },
  });
  await recalcCourseRating(review.courseId);

  return NextResponse.json({ review: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const review = await prisma.courseReview.findUnique({ where: { id } });
  if (!review) return jsonError("نظر یافت نشد", 404);

  await prisma.courseReview.delete({ where: { id } });
  await recalcCourseRating(review.courseId);

  return NextResponse.json({ ok: true });
}
