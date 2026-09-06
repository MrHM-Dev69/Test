import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { testimonialSchema } from "@/lib/validation/personal";
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
  const parsed = testimonialSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) return jsonError("نظر یافت نشد.", 404);

  const { ipAddress, userAgent } = await getRequestMeta();
  const testimonial = await prisma.testimonial.update({ where: { id }, data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "TESTIMONIAL_UPDATED",
    entity: "Testimonial",
    entityId: testimonial.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ testimonial });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) return jsonError("نظر یافت نشد.", 404);

  const { ipAddress, userAgent } = await getRequestMeta();
  await prisma.testimonial.delete({ where: { id } });

  await logAuditEvent({
    userId: access.user.id,
    action: "TESTIMONIAL_DELETED",
    entity: "Testimonial",
    entityId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
