import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAcademyAccess } from "@/lib/admin/require-academy-access";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const patchSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  type: z.enum(["VIDEO", "ARTICLE", "QUIZ", "ATTACHMENT"]).optional(),
  contentBody: z.string().trim().optional(),
  durationSeconds: z.number().int().min(0).optional(),
  isPreview: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const lesson = await prisma.lesson.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ lesson });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) return jsonError("درس یافت نشد", 404);

  await prisma.lesson.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
