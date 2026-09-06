import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { educationSchema } from "@/lib/validation/personal";
import { zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { requirePersonalAccess } from "@/lib/admin/require-personal-access";

export async function GET() {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const items = await prisma.educationItem.findMany({
    orderBy: [{ order: "asc" }, { startDate: "desc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const parsed = educationSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { ipAddress, userAgent } = await getRequestMeta();
  const item = await prisma.educationItem.create({ data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "EDUCATION_ITEM_CREATED",
    entity: "EducationItem",
    entityId: item.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ item }, { status: 201 });
}
