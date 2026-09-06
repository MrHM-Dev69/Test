import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAcademyAccess } from "@/lib/admin/require-academy-access";
import { categorySchema } from "@/lib/validation/academy";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const parsed = categorySchema.partial().safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const category = await prisma.category.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ category });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const inUse = await prisma.course.count({ where: { categoryId: id } });
  if (inUse > 0) return jsonError("این دسته‌بندی برای دوره‌ای استفاده شده و قابل حذف نیست", 409);

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
