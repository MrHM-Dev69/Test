import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ProductCard } from "@/components/shop/product-card";

export const metadata: Metadata = { title: "علاقه‌مندی‌ها" };

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">علاقه‌مندی‌ها</h1>
      {items.length === 0 ? (
        <p className="text-muted">لیست علاقه‌مندی‌های شما خالی است.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(({ product }) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                slug: product.slug,
                title: product.title,
                shortDescription: product.shortDescription,
                coverImage: product.coverImage,
                isFree: product.isFree,
                price: Number(product.price),
                salePrice: product.salePrice ? Number(product.salePrice) : null,
                avgRating: product.avgRating,
                reviewCount: product.reviewCount,
                category: product.category,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
