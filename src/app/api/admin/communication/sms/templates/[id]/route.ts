import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError } from "@/lib/api-helpers";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "communication.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const { id } = await params;
  const existing = await prisma.smsTemplate.findUnique({ where: { id } });
  if (!existing) return jsonError("قالب یافت نشد", 404);

  await prisma.smsTemplate.delete({ where: { id } });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "SMS_TEMPLATE_DELETED",
    entity: "SmsTemplate",
    entityId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
