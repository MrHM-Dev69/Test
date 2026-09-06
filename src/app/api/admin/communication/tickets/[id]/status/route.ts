import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, canAccessPrefix } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"]),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !canAccessPrefix(admin, ["communication.", "support."])) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return jsonError("تیکت یافت نشد", 404);

  await prisma.ticket.update({ where: { id }, data: { status: parsed.data.status } });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "TICKET_STATUS_CHANGED",
    entity: "Ticket",
    entityId: id,
    metadata: { from: ticket.status, to: parsed.data.status },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
