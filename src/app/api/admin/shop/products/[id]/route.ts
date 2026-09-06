import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ProductDomain, ProductType, type RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";
import { storage } from "@/lib/storage";

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().min(1).optional(),
  shortDescription: z.string().max(300).optional(),
  categoryId: z.string().min(1).optional(),
  domain: z.nativeEnum(ProductDomain).optional(),
  productType: z.nativeEnum(ProductType).optional(),
  isFree: z.boolean().optional(),
  price: z.number().min(0).optional(),
  salePrice: z.number().min(0).nullable().optional(),
  coverImage: z.string().nullable().optional(),
  gallery: z.array(z.string()).optional(),
  version: z.string().nullable().optional(),
  changelog: z.string().nullable().optional(),
  license: z.string().nullable().optional(),
  downloadLimit: z.number().int().min(1).nullable().optional(),
  downloadExpiryDays: z.number().int().min(1).nullable().optional(),
  requirements: z.string().nullable().optional(),
  compatibility: z.string().nullable().optional(),
  documentationUrl: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, tags: { include: { tag: true } }, files: true, versions: true },
  });
  if (!product) return jsonError("Not found", 404);
  return NextResponse.json({ product });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const { id } = await params;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { tagIds, ...data } = parsed.data;

  if (data.slug) {
    const clashing = await prisma.product.findFirst({ where: { slug: data.slug, id: { not: id } } });
    if (clashing) return jsonError("این اسلاگ قبلاً استفاده شده است", 409);
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data });
    if (tagIds) {
      await tx.productTag.deleteMany({ where: { productId: id } });
      await tx.productTag.createMany({ data: tagIds.map((tagId) => ({ productId: id, tagId })) });
    }
  });

  await logAuditEvent({ userId: user.id, action: "admin.product.update", entity: "Product", entityId: id });

  const product = await prisma.product.findUnique({ where: { id }, include: { tags: true, files: true } });
  return NextResponse.json({ product });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const { id } = await params;

  const files = await prisma.productFile.findMany({ where: { productId: id } });
  for (const file of files) {
    await storage.deletePrivateFile(file.storageKey).catch(() => undefined);
  }

  await prisma.product.delete({ where: { id } });
  await logAuditEvent({ userId: user.id, action: "admin.product.delete", entity: "Product", entityId: id });

  return NextResponse.json({ ok: true });
}
