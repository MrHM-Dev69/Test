import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { CartItems, type CartItemView } from "@/components/shop/cart-items";

export const metadata: Metadata = { title: "سبد خرید" };

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cart = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });
  const productIds = cart?.items.map((i) => i.productId) ?? [];
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } } })
    : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  const items: CartItemView[] = (cart?.items ?? []).map((item) => {
    const product = productMap.get(item.productId);
    const unitPrice = product ? Number(product.salePrice ?? product.price) : 0;
    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      total: unitPrice * item.quantity,
      product: product
        ? { title: product.title, slug: product.slug, coverImage: product.coverImage }
        : null,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">سبد خرید</h1>
      <CartItems items={items} subtotal={subtotal} />
    </div>
  );
}
