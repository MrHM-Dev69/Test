import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  imageUrl: z.string().trim().min(1),
  linkUrl: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  placement: z.string().trim().min(1).max(60),
  order: z.number().int().default(0),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "marketing.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const banner = await prisma.banner.create({ data: parsed.data });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "BANNER_CREATED",
    entity: "Banner",
    entityId: banner.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, banner }, { status: 201 });
}
