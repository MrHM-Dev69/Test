import type { Metadata } from "next";
import { listProducts, type ProductListParams } from "@/lib/shop/queries";
import { ProductCard } from "@/components/shop/product-card";
import { ProductFilters } from "@/components/shop/product-filters";
import { Pagination } from "@/components/shop/pagination";

export const metadata: Metadata = {
  title: "محصولات ویژه",
  description: "خرید محصولات ویژه دیجیتال.",
};

interface PageProps {
  searchParams: Promise<ProductListParams>;
}

export default async function PremiumProductsPage({ searchParams }: PageProps) {
  const params = { ...(await searchParams), free: "paid" as const };
  const { items, page, totalPages, total } = await listProducts(params);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold">محصولات ویژه</h1>
      <p className="mb-8 text-sm text-muted">{total} محصول</p>

      <div className="mb-8">
        <ProductFilters basePath="/shop/premium" current={params} />
      </div>

      {items.length === 0 ? (
        <p className="text-muted">محصولی یافت نشد.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((product) => (
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

      <Pagination basePath="/shop/premium" page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
