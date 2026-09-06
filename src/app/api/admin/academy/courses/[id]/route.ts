import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAcademyAccess } from "@/lib/admin/require-academy-access";
import { courseUpdateSchema } from "@/lib/validation/academy";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      category: true,
      sections: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" }, include: { attachments: true, quiz: { include: { questions: { orderBy: { order: "asc" } } } } } } } },
    },
  });
  if (!course) return jsonError("دوره یافت نشد", 404);
  return NextResponse.json({ course });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const parsed = courseUpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const course = await prisma.course.update({ where: { id }, data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "academy.course.updated",
    entity: "Course",
    entityId: id,
  });

  return NextResponse.json({ course });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  await prisma.course.delete({ where: { id } });

  await logAuditEvent({
    userId: access.user.id,
    action: "academy.course.deleted",
    entity: "Course",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
