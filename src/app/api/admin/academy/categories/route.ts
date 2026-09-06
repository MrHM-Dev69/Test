import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAcademyAccess } from "@/lib/admin/require-academy-access";
import { categorySchema } from "@/lib/validation/academy";
import { zodErrorResponse } from "@/lib/api-helpers";

export async function GET() {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { courses: true, products: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const parsed = categorySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const category = await prisma.category.create({ data: parsed.data });
  return NextResponse.json({ category }, { status: 201 });
}
