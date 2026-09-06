import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { experienceSchema } from "@/lib/validation/personal";
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
  const parsed = experienceSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.experience.findUnique({ where: { id } });
  if (!existing) return jsonError("سابقه کاری یافت نشد.", 404);

  const { ipAddress, userAgent } = await getRequestMeta();
  const experience = await prisma.experience.update({ where: { id }, data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "EXPERIENCE_UPDATED",
    entity: "Experience",
    entityId: experience.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ experience });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const existing = await prisma.experience.findUnique({ where: { id } });
  if (!existing) return jsonError("سابقه کاری یافت نشد.", 404);

  const { ipAddress, userAgent } = await getRequestMeta();
  await prisma.experience.delete({ where: { id } });

  await logAuditEvent({
    userId: access.user.id,
    action: "EXPERIENCE_DELETED",
    entity: "Experience",
    entityId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
