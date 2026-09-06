import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAcademyAccess } from "@/lib/admin/require-academy-access";
import { sectionSchema } from "@/lib/validation/academy";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id: courseId } = await params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return jsonError("دوره یافت نشد", 404);

  const parsed = sectionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const maxOrder = await prisma.courseSection.aggregate({
    where: { courseId },
    _max: { order: true },
  });

  const section = await prisma.courseSection.create({
    data: {
      courseId,
      title: parsed.data.title,
      order: parsed.data.order ?? (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json({ section }, { status: 201 });
}
