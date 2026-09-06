import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { educationSchema } from "@/lib/validation/personal";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { requirePersonalAccess } from "@/lib/admin/require-personal-access";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const parsed = educationSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.educationItem.findUnique({ where: { id } });
  if (!existing) return jsonError("مورد تحصیلی یافت نشد.", 404);

  const { ipAddress, userAgent } = await getRequestMeta();
  const item = await prisma.educationItem.update({ where: { id }, data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "EDUCATION_ITEM_UPDATED",
    entity: "EducationItem",
    entityId: item.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const existing = await prisma.educationItem.findUnique({ where: { id } });
  if (!existing) return jsonError("مورد تحصیلی یافت نشد.", 404);

  const { ipAddress, userAgent } = await getRequestMeta();
  await prisma.educationItem.delete({ where: { id } });

  await logAuditEvent({
    userId: access.user.id,
    action: "EDUCATION_ITEM_DELETED",
    entity: "EducationItem",
    entityId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
