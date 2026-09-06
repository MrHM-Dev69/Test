import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { certificateSchema } from "@/lib/validation/personal";
import { zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { requirePersonalAccess } from "@/lib/admin/require-personal-access";

export async function GET() {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const certificates = await prisma.certificate.findMany({
    orderBy: [{ order: "asc" }, { issueDate: "desc" }],
  });
  return NextResponse.json({ certificates });
}

export async function POST(req: NextRequest) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const parsed = certificateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { ipAddress, userAgent } = await getRequestMeta();
  const certificate = await prisma.certificate.create({ data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "CERTIFICATE_CREATED",
    entity: "Certificate",
    entityId: certificate.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ certificate }, { status: 201 });
}
