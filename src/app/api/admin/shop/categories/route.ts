import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ProductDomain, type RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  domain: z.nativeEnum(ProductDomain).default("GENERAL"),
  parentId: z.string().nullable().optional(),
  order: z.number().int().default(0),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return jsonError("این اسلاگ قبلاً استفاده شده است", 409);

  const category = await prisma.category.create({ data: parsed.data });
  return NextResponse.json({ category }, { status: 201 });
}
