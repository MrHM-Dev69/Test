import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAcademyAccess } from "@/lib/admin/require-academy-access";
import { courseSchema } from "@/lib/validation/academy";
import { zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, _count: { select: { sections: true, enrollments: true } } },
  });
  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const parsed = courseSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const course = await prisma.course.create({ data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "academy.course.created",
    entity: "Course",
    entityId: course.id,
  });

  return NextResponse.json({ course }, { status: 201 });
}
