import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validation/personal";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { requirePersonalAccess } from "@/lib/admin/require-personal-access";

export async function GET() {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const services = await prisma.service.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const parsed = serviceSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const duplicate = await prisma.service.findUnique({ where: { slug: parsed.data.slug } });
  if (duplicate) return jsonError("این نامک قبلاً استفاده شده است.", 409);

  const { ipAddress, userAgent } = await getRequestMeta();
  const service = await prisma.service.create({ data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "SERVICE_CREATED",
    entity: "Service",
    entityId: service.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ service }, { status: 201 });
}
