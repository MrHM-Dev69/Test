import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { experienceSchema } from "@/lib/validation/personal";
import { zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { requirePersonalAccess } from "@/lib/admin/require-personal-access";

export async function GET() {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const experiences = await prisma.experience.findMany({
    orderBy: [{ order: "asc" }, { startDate: "desc" }],
  });
  return NextResponse.json({ experiences });
}

export async function POST(req: NextRequest) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const parsed = experienceSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { ipAddress, userAgent } = await getRequestMeta();
  const experience = await prisma.experience.create({ data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "EXPERIENCE_CREATED",
    entity: "Experience",
    entityId: experience.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ experience }, { status: 201 });
}
