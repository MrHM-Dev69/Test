import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError } from "@/lib/api-helpers";

// The login route derives its brute-force lock from a rolling count of
// failed LoginHistory rows in the last 15 minutes (see
// src/app/api/auth/login/route.ts) — there is no separate lockout flag on
// User. Resetting the lockout therefore clears those recent failure rows so
// the count drops below the threshold; the reset action itself is audited.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "customers.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return jsonError("کاربر یافت نشد", 404);

  const result = await prisma.loginHistory.deleteMany({
    where: { userId: id, success: false, createdAt: { gt: new Date(Date.now() - 15 * 60_000) } },
  });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "CUSTOMER_LOGIN_LOCKOUT_RESET",
    entity: "User",
    entityId: id,
    metadata: { clearedFailures: result.count },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, cleared: result.count });
}
