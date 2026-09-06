import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { skillSchema } from "@/lib/validation/personal";
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
  const parsed = skillSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.skill.findUnique({ where: { id } });
  if (!existing) return jsonError("مهارت یافت نشد.", 404);

  const { ipAddress, userAgent } = await getRequestMeta();
  const skill = await prisma.skill.update({ where: { id }, data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "SKILL_UPDATED",
    entity: "Skill",
    entityId: skill.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ skill });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const existing = await prisma.skill.findUnique({ where: { id } });
  if (!existing) return jsonError("مهارت یافت نشد.", 404);

  const { ipAddress, userAgent } = await getRequestMeta();
  await prisma.skill.delete({ where: { id } });

  await logAuditEvent({
    userId: access.user.id,
    action: "SKILL_DELETED",
    entity: "Skill",
    entityId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
