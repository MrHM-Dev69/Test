import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { getAdminUser, can } from "@/app/admin/_lib/guard";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "اسلاگ نامعتبر است")
    .max(60),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1),
  isPublished: z.boolean().default(true),
  seoTitle: z.string().trim().max(200).optional().or(z.literal("").transform(() => undefined)),
  seoDescription: z.string().trim().max(300).optional().or(z.literal("").transform(() => undefined)),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "settings.manage")) return jsonError("دسترسی غیرمجاز", 403);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const page = await prisma.page.upsert({
    where: { slug: parsed.data.slug },
    update: {
      title: parsed.data.title,
      body: parsed.data.body,
      isPublished: parsed.data.isPublished,
      seoTitle: parsed.data.seoTitle,
      seoDescription: parsed.data.seoDescription,
    },
    create: {
      slug: parsed.data.slug,
      title: parsed.data.title,
      body: parsed.data.body,
      isPublished: parsed.data.isPublished,
      seoTitle: parsed.data.seoTitle,
      seoDescription: parsed.data.seoDescription,
    },
  });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    userId: admin.id,
    action: "LEGAL_PAGE_SAVED",
    entity: "Page",
    entityId: page.id,
    metadata: { slug: page.slug },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true, page });
}
