import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const ALLOWED_KEYS = ["site_general", "seo_defaults"] as const;

const schema = z.object({
  key: z.enum(ALLOWED_KEYS),
  value: z.record(z.string(), z.unknown()),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "settings.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const value = parsed.data.value as Prisma.InputJsonValue;
  await prisma.setting.upsert({
    where: { key: parsed.data.key },
    update: { value },
    create: { key: parsed.data.key, value },
  });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "SETTING_UPDATED",
    entity: "Setting",
    entityId: parsed.data.key,
    metadata: parsed.data.value,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
