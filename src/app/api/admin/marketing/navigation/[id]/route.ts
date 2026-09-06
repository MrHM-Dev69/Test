import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const patchSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    url: z.string().trim().min(1).max(300),
    location: z.enum(["header", "footer"]),
    order: z.number().int(),
  })
  .partial();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "marketing.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { id } = await params;
  const existing = await prisma.navigationItem.findUnique({ where: { id } });
  if (!existing) return jsonError("آیتم یافت نشد", 404);

  await prisma.navigationItem.update({ where: { id }, data: parsed.data });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "NAVIGATION_ITEM_UPDATED",
    entity: "NavigationItem",
    entityId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "marketing.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const { id } = await params;
  const existing = await prisma.navigationItem.findUnique({ where: { id } });
  if (!existing) return jsonError("آیتم یافت نشد", 404);

  // Detach any children before deleting a parent item, rather than leaving
  // them pointing at a now-missing row.
  await prisma.navigationItem.updateMany({ where: { parentId: id }, data: { parentId: null } });
  await prisma.navigationItem.delete({ where: { id } });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "NAVIGATION_ITEM_DELETED",
    entity: "NavigationItem",
    entityId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
