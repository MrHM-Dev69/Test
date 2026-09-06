import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAcademyAccess } from "@/lib/admin/require-academy-access";
import { lessonSchema } from "@/lib/validation/academy";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id: sectionId } = await params;
  const section = await prisma.courseSection.findUnique({ where: { id: sectionId } });
  if (!section) return jsonError("بخش یافت نشد", 404);

  const parsed = lessonSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const maxOrder = await prisma.lesson.aggregate({ where: { sectionId }, _max: { order: true } });

  const lesson = await prisma.lesson.create({
    data: {
      sectionId,
      title: parsed.data.title,
      type: parsed.data.type,
      contentBody: parsed.data.contentBody,
      durationSeconds: parsed.data.durationSeconds,
      isPreview: parsed.data.isPreview ?? false,
      order: parsed.data.order ?? (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json({ lesson }, { status: 201 });
}
