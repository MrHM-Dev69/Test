import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can, ADMIN_ROLES } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(1000),
  segment: z.enum(["ALL", "CUSTOMER", "ADMIN_STAFF"]),
  link: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "communication.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const where =
    parsed.data.segment === "CUSTOMER"
      ? { role: { name: "CUSTOMER" as const } }
      : parsed.data.segment === "ADMIN_STAFF"
        ? { role: { name: { in: ADMIN_ROLES } } }
        : {};

  const targets = await prisma.user.findMany({ where, select: { id: true } });
  if (targets.length === 0) return NextResponse.json({ ok: true, count: 0 });

  await prisma.notification.createMany({
    data: targets.map((t) => ({
      userId: t.id,
      channel: "IN_APP" as const,
      title: parsed.data.title,
      body: parsed.data.body,
      link: parsed.data.link,
    })),
  });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "NOTIFICATION_BROADCAST",
    entity: "Notification",
    metadata: { segment: parsed.data.segment, count: targets.length, title: parsed.data.title },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, count: targets.length });
}
