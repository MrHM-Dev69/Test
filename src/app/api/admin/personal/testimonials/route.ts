import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { testimonialSchema } from "@/lib/validation/personal";
import { zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";
import { getRequestMeta } from "@/lib/auth/session";
import { requirePersonalAccess } from "@/lib/admin/require-personal-access";

export async function GET() {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const testimonials = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ testimonials });
}

export async function POST(req: NextRequest) {
  const access = await requirePersonalAccess();
  if (!access.ok) return access.response;

  const parsed = testimonialSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { ipAddress, userAgent } = await getRequestMeta();
  const testimonial = await prisma.testimonial.create({ data: parsed.data });

  await logAuditEvent({
    userId: access.user.id,
    action: "TESTIMONIAL_CREATED",
    entity: "Testimonial",
    entityId: testimonial.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ testimonial }, { status: 201 });
}
