import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listProducts, type ProductListParams } from "@/lib/shop/queries";
import { ProductCard } from "@/components/shop/product-card";
import { ProductFilters } from "@/components/shop/product-filters";
import { Pagination } from "@/components/shop/pagination";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ProductListParams>;
}

async function getCategory(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "دسته‌بندی یافت نشد" };
  return {
    title: category.name,
    description: category.description ?? `محصولات دسته ${category.name}`,
    alternates: { canonical: `/shop/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const sp = await searchParams;
  const queryParams = { ...sp, category: slug };
  const { items, page, totalPages, total } = await listProducts(queryParams);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <BreadcrumbJsonLd
        items={[
          { name: "خانه", url: "/" },
          { name: "فروشگاه", url: "/shop" },
          { name: category.name, url: `/shop/categories/${category.slug}` },
        ]}
      />
      <h1 className="mb-2 text-3xl font-bold">{category.name}</h1>
      <p className="mb-8 text-sm text-muted">{total} محصول</p>

      <div className="mb-8">
        <ProductFilters basePath={`/shop/categories/${slug}`} current={queryParams} />
      </div>

      {items.length === 0 ? (
        <p className="text-muted">محصولی در این دسته یافت نشد.</p>
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

      <Pagination
        basePath={`/shop/categories/${slug}`}
        page={page}
        totalPages={totalPages}
        searchParams={queryParams}
      />
    </div>
  );
}
