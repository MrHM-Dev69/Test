import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAcademyAccess } from "@/lib/admin/require-academy-access";
import { articleSchema } from "@/lib/validation/academy";
import { zodErrorResponse } from "@/lib/api-helpers";

export async function GET() {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const articles = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ articles });
}

export async function POST(req: NextRequest) {
  const access = await requireAcademyAccess();
  if (!access.ok) return access.response;

  const parsed = articleSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const article = await prisma.article.create({
    data: { ...parsed.data, publishedAt: parsed.data.isPublished ? new Date() : null },
  });

  return NextResponse.json({ article }, { status: 201 });
}
