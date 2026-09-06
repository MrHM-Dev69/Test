import { notFound, redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card } from "@/components/ui/card";
import { ProductForm } from "@/components/admin/shop/product-form";

export const metadata = { title: "ویرایش محصول" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="محصولات فروشگاه" />;

  const { id } = await params;
  const [product, categories, tags] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { tags: true, files: true } }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ویرایش محصول: {product.title}</h1>
      <Card>
        <ProductForm
          initial={{
            id: product.id,
            title: product.title,
            slug: product.slug,
            description: product.description,
            shortDescription: product.shortDescription ?? "",
            categoryId: product.categoryId,
            domain: product.domain,
            productType: product.productType,
            isFree: product.isFree,
            price: Number(product.price),
            salePrice: product.salePrice ? Number(product.salePrice) : null,
            coverImage: product.coverImage ?? "",
            version: product.version ?? "",
            changelog: product.changelog ?? "",
            license: product.license ?? "",
            downloadLimit: product.downloadLimit,
            downloadExpiryDays: product.downloadExpiryDays,
            requirements: product.requirements ?? "",
            compatibility: product.compatibility ?? "",
            documentationUrl: product.documentationUrl ?? "",
            isPublished: product.isPublished,
            isFeatured: product.isFeatured,
            tagIds: product.tags.map((t) => t.tagId),
          }}
          categories={categories}
          tags={tags}
          initialFiles={product.files.map((f) => ({
            id: f.id,
            fileName: f.fileName,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes.toString(),
          }))}
        />
      </Card>
    </div>
  );
}
