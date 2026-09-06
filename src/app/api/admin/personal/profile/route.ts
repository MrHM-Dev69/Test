import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validation/personal";
import { zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { requirePersonalAccess } from "@/lib/admin/require-personal-access";

export async function GET() {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const profile = await prisma.profile.findFirst();
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const parsed = profileSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.profile.findFirst();
  const { ipAddress, userAgent } = await getRequestMeta();

  const profile = existing
    ? await prisma.profile.update({ where: { id: existing.id }, data: parsed.data })
    : await prisma.profile.create({ data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: existing ? "PROFILE_UPDATED" : "PROFILE_CREATED",
    entity: "Profile",
    entityId: profile.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ profile });
}
