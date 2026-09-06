import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({ key: z.string().trim().min(1).max(60), body: z.string().trim().min(1).max(320) });

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "communication.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.smsTemplate.findUnique({ where: { key: parsed.data.key } });
  if (existing) return jsonError("قالبی با این کلید از قبل وجود دارد", 409);

  const template = await prisma.smsTemplate.create({ data: parsed.data });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "SMS_TEMPLATE_CREATED",
    entity: "SmsTemplate",
    entityId: template.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, template }, { status: 201 });
}
