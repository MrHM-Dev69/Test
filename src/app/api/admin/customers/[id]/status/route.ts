import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({ isActive: z.boolean() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "customers.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!target || target.role.name !== "CUSTOMER") return jsonError("مشتری یافت نشد", 404);

  await prisma.user.update({ where: { id }, data: { isActive: parsed.data.isActive } });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: parsed.data.isActive ? "CUSTOMER_ACTIVATED" : "CUSTOMER_DEACTIVATED",
    entity: "User",
    entityId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
