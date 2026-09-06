import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "customers.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return jsonError("کاربر یافت نشد", 404);

  const result = await prisma.session.updateMany({
    where: { userId: id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "CUSTOMER_SESSIONS_REVOKED",
    entity: "User",
    entityId: id,
    metadata: { count: result.count },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, revoked: result.count });
}
