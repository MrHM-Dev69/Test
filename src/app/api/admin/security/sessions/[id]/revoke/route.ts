import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "security.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const { id } = await params;
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) return jsonError("نشست یافت نشد", 404);

  await prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "SESSION_REVOKED",
    entity: "Session",
    entityId: id,
    metadata: { targetUserId: session.userId },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
