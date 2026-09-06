import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { portfolioProjectSchema } from "@/lib/validation/personal";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { requirePersonalAccess } from "@/lib/admin/require-personal-access";

export async function GET() {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const projects = await prisma.portfolioProject.findMany({
    orderBy: [{ order: "asc" }, { date: "desc" }],
  });
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const parsed = portfolioProjectSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const duplicate = await prisma.portfolioProject.findUnique({ where: { slug: parsed.data.slug } });
  if (duplicate) return jsonError("این نامک قبلاً استفاده شده است.", 409);

  const { ipAddress, userAgent } = await getRequestMeta();
  const project = await prisma.portfolioProject.create({ data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "PORTFOLIO_PROJECT_CREATED",
    entity: "PortfolioProject",
    entityId: project.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ project }, { status: 201 });
}
