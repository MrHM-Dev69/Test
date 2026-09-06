import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validation/personal";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { requirePersonalAccess } from "@/lib/admin/require-personal-access";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const parsed = serviceSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) return jsonError("خدمت یافت نشد.", 404);

  const duplicate = await prisma.service.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  });
  if (duplicate) return jsonError("این نامک قبلاً استفاده شده است.", 409);

  const { ipAddress, userAgent } = await getRequestMeta();
  const service = await prisma.service.update({ where: { id }, data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "SERVICE_UPDATED",
    entity: "Service",
    entityId: service.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ service });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) return jsonError("خدمت یافت نشد.", 404);

  const { ipAddress, userAgent } = await getRequestMeta();
  await prisma.service.delete({ where: { id } });

  await logAuditEvent({
    userId: access.user.id,
    action: "SERVICE_DELETED",
    entity: "Service",
    entityId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
