import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const patchSchema = z
  .object({
    question: z.string().trim().min(1).max(300),
    answer: z.string().trim().min(1).max(3000),
    group: z.string().trim().max(80),
    order: z.number().int(),
  })
  .partial();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "marketing.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { id } = await params;
  const existing = await prisma.faqItem.findUnique({ where: { id } });
  if (!existing) return jsonError("سوال یافت نشد", 404);

  await prisma.faqItem.update({ where: { id }, data: parsed.data });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({ userId: admin.id, action: "FAQ_UPDATED", entity: "FaqItem", entityId: id, ipAddress, userAgent });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "marketing.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const { id } = await params;
  const existing = await prisma.faqItem.findUnique({ where: { id } });
  if (!existing) return jsonError("سوال یافت نشد", 404);

  await prisma.faqItem.delete({ where: { id } });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({ userId: admin.id, action: "FAQ_DELETED", entity: "FaqItem", entityId: id, ipAddress, userAgent });

  return NextResponse.json({ ok: true });
}
