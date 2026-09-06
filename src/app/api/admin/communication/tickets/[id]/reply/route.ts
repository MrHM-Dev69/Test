import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, canAccessPrefix } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({ message: z.string().trim().min(1).max(5000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !canAccessPrefix(admin, ["communication.", "support."])) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return jsonError("تیکت یافت نشد", 404);

  const message = await prisma.ticketMessage.create({
    data: { ticketId: id, userId: admin.id, isFromAdmin: true, message: parsed.data.message },
  });

  await prisma.ticket.update({
    where: { id },
    data: { status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status },
  });

  await prisma.notification.create({
    data: {
      userId: ticket.userId,
      channel: "IN_APP",
      title: "پاسخ جدید در تیکت",
      body: parsed.data.message.slice(0, 140),
      link: `/dashboard/tickets/${id}`,
    },
  }).catch(() => undefined);

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "TICKET_REPLIED",
    entity: "Ticket",
    entityId: id,
    metadata: { messageId: message.id },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, message });
}
