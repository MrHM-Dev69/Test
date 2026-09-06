import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: true },
  });

  if (!cart) {
    return NextResponse.json({ items: [], subtotal: 0 });
  }

  const productIds = cart.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const items = cart.items.map((item) => {
    const product = productMap.get(item.productId);
    const unitPrice = product ? Number(product.salePrice ?? product.price) : 0;
    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: product
        ? {
            id: product.id,
            title: product.title,
            slug: product.slug,
            coverImage: product.coverImage,
            price: Number(product.price),
            salePrice: product.salePrice ? Number(product.salePrice) : null,
            isFree: product.isFree,
          }
        : null,
      unitPrice,
      total: unitPrice * item.quantity,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);

  return NextResponse.json({ items, subtotal });
}

const addSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50).default(1),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const parsed = addSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { productId, quantity } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isPublished) return jsonError("Product not found", 404);

  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
  }

  return NextResponse.json({ ok: true });
}
