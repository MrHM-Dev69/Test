import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { sendEmail, emailTemplates } from "@/lib/email";

const STATUS_VALUES = [
  "NEW",
  "REVIEWING",
  "QUOTED",
  "ACCEPTED",
  "IN_PROGRESS",
  "WAITING_FOR_CLIENT",
  "COMPLETED",
  "DELIVERED",
  "CANCELLED",
] as const;

const schema = z.object({
  status: z.enum(STATUS_VALUES),
  quotedPrice: z.number().nonnegative().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "projects.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { id } = await params;
  const project = await prisma.projectRequest.findUnique({ where: { id } });
  if (!project) return jsonError("پروژه یافت نشد", 404);

  const updated = await prisma.projectRequest.update({
    where: { id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.quotedPrice !== undefined ? { quotedPrice: parsed.data.quotedPrice } : {}),
    },
  });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "PROJECT_STATUS_CHANGED",
    entity: "ProjectRequest",
    entityId: id,
    metadata: { from: project.status, to: updated.status, quotedPrice: parsed.data.quotedPrice },
    ipAddress,
    userAgent,
  });

  // Best-effort notification — a delivery failure must not roll back the
  // status change or block the admin's response.
  await sendEmail({
    toEmail: updated.contactEmail,
    subject: "به‌روزرسانی وضعیت پروژه",
    html: emailTemplates.projectUpdate(updated.id, updated.status),
    templateKey: "project_update",
  }).catch(() => undefined);

  if (updated.userId) {
    await prisma.notification.create({
      data: {
        userId: updated.userId,
        channel: "IN_APP",
        title: "به‌روزرسانی پروژه",
        body: `وضعیت پروژه شما به «${updated.status}» تغییر کرد.`,
        link: `/dashboard/projects/${updated.id}`,
      },
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
