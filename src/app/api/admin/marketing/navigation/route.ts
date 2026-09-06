import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({
  label: z.string().trim().min(1).max(80),
  url: z.string().trim().min(1).max(300),
  location: z.enum(["header", "footer"]),
  parentId: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "marketing.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const count = await prisma.navigationItem.count();
  const item = await prisma.navigationItem.create({ data: { ...parsed.data, order: count } });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "NAVIGATION_ITEM_CREATED",
    entity: "NavigationItem",
    entityId: item.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, item }, { status: 201 });
}
