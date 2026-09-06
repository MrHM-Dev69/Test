import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { skillSchema } from "@/lib/validation/personal";
import { zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { requirePersonalAccess } from "@/lib/admin/require-personal-access";

export async function GET() {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const skills = await prisma.skill.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
  return NextResponse.json({ skills });
}

export async function POST(req: NextRequest) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const parsed = skillSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { ipAddress, userAgent } = await getRequestMeta();
  const skill = await prisma.skill.create({ data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "SKILL_CREATED",
    entity: "Skill",
    entityId: skill.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ skill }, { status: 201 });
}
