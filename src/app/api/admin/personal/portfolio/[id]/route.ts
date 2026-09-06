import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { portfolioProjectSchema } from "@/lib/validation/personal";
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
  const parsed = portfolioProjectSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.portfolioProject.findUnique({ where: { id } });
  if (!existing) return jsonError("نمونه‌کار یافت نشد.", 404);

  const duplicate = await prisma.portfolioProject.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  });
  if (duplicate) return jsonError("این نامک قبلاً استفاده شده است.", 409);

  const { ipAddress, userAgent } = await getRequestMeta();
  const project = await prisma.portfolioProject.update({ where: { id }, data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "PORTFOLIO_PROJECT_UPDATED",
    entity: "PortfolioProject",
    entityId: project.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ project });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const existing = await prisma.portfolioProject.findUnique({ where: { id } });
  if (!existing) return jsonError("نمونه‌کار یافت نشد.", 404);

  const { ipAddress, userAgent } = await getRequestMeta();
  await prisma.portfolioProject.delete({ where: { id } });

  await logAuditEvent({
    userId: access.user.id,
    action: "PORTFOLIO_PROJECT_DELETED",
    entity: "PortfolioProject",
    entityId: id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
