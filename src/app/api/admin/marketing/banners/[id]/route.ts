import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    imageUrl: z.string().trim().min(1).optional(),
    linkUrl: z.string().trim().optional(),
    placement: z.string().trim().min(1).max(60).optional(),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .partial();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "marketing.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { id } = await params;
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) return jsonError("بنر یافت نشد", 404);

  await prisma.banner.update({ where: { id }, data: parsed.data });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({ userId: admin.id, action: "BANNER_UPDATED", entity: "Banner", entityId: id, ipAddress, userAgent });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "marketing.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const { id } = await params;
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) return jsonError("بنر یافت نشد", 404);

  await prisma.banner.delete({ where: { id } });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({ userId: admin.id, action: "BANNER_DELETED", entity: "Banner", entityId: id, ipAddress, userAgent });

  return NextResponse.json({ ok: true });
}
