import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ProductDomain, ProductType, type RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";

const productSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد"),
  description: z.string().min(1),
  shortDescription: z.string().max(300).optional(),
  categoryId: z.string().min(1),
  domain: z.nativeEnum(ProductDomain).default("GENERAL"),
  productType: z.nativeEnum(ProductType).default("FREE_PRODUCT"),
  isFree: z.boolean().default(true),
  price: z.number().min(0).default(0),
  salePrice: z.number().min(0).nullable().optional(),
  coverImage: z.string().optional(),
  gallery: z.array(z.string()).default([]),
  version: z.string().optional(),
  changelog: z.string().optional(),
  license: z.string().optional(),
  downloadLimit: z.number().int().min(1).nullable().optional(),
  downloadExpiryDays: z.number().int().min(1).nullable().optional(),
  requirements: z.string().optional(),
  compatibility: z.string().optional(),
  documentationUrl: z.string().url().optional().or(z.literal("")),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  tagIds: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;

  const products = await prisma.product.findMany({
    where: q ? { title: { contains: q, mode: "insensitive" } } : undefined,
    include: { category: true, files: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);

  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { tagIds, ...data } = parsed.data;

  const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existing) return jsonError("این اسلاگ قبلاً استفاده شده است", 409);

  const product = await prisma.product.create({
    data: {
      ...data,
      documentationUrl: data.documentationUrl || undefined,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: "admin.product.create",
    entity: "Product",
    entityId: product.id,
  });

  return NextResponse.json({ product }, { status: 201 });
}
