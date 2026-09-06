import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({ message: z.string().min(1).max(5000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "projects.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { id } = await params;
  const project = await prisma.projectRequest.findUnique({ where: { id } });
  if (!project) return jsonError("پروژه یافت نشد", 404);

  const created = await prisma.projectMessage.create({
    data: {
      projectId: id,
      senderName: admin.name ?? "پشتیبانی",
      isFromAdmin: true,
      message: parsed.data.message,
    },
  });

  if (project.userId) {
    await prisma.notification.create({
      data: {
        userId: project.userId,
        channel: "IN_APP",
        title: "پیام جدید در پروژه",
        body: parsed.data.message.slice(0, 140),
        link: `/dashboard/projects/${id}`,
      },
    }).catch(() => undefined);
  }

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "PROJECT_MESSAGE_SENT",
    entity: "ProjectRequest",
    entityId: id,
    metadata: { messageId: created.id },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, message: created });
}
