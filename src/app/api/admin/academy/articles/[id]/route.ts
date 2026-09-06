import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAcademyAccess } from "@/lib/admin/require-academy-access";
import { articleUpdateSchema } from "@/lib/validation/academy";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return jsonError("مقاله یافت نشد", 404);
  return NextResponse.json({ article });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return jsonError("مقاله یافت نشد", 404);

  const parsed = articleUpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const willPublishNow = parsed.data.isPublished && !existing.isPublished;

  const article = await prisma.article.update({
    where: { id },
    data: { ...parsed.data, ...(willPublishNow ? { publishedAt: new Date() } : {}) },
  });

  return NextResponse.json({ article });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  await prisma.article.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
