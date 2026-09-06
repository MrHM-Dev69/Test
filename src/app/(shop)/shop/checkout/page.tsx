import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { formatToman } from "@/lib/utils";

export const metadata: Metadata = { title: "تسویه حساب" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cart = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });
  if (!cart || cart.items.length === 0) redirect("/shop/cart");

  const products = await prisma.product.findMany({
    where: { id: { in: cart.items.map((i) => i.productId) } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const rows = cart.items.map((item) => {
    const product = productMap.get(item.productId);
    const unitPrice = product ? Number(product.salePrice ?? product.price) : 0;
    return { title: product?.title ?? "محصول", quantity: item.quantity, total: unitPrice * item.quantity };
  });
  const subtotal = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">تسویه حساب</h1>

      <Card className="mb-6">
        <h2 className="mb-4 text-lg font-semibold">خلاصه سفارش</h2>
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span>
                {row.title} × {row.quantity}
              </span>
              <span className="text-muted">{formatToman(row.total)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 font-semibold">
          <span>جمع کل</span>
          <span className="text-accent">{formatToman(subtotal)}</span>
        </div>
      </Card>

      <Card>
        <CheckoutForm />
      </Card>
    </div>
  );
}
