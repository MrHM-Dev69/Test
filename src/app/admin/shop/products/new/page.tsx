import { redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card } from "@/components/ui/card";
import { ProductForm } from "@/components/admin/shop/product-form";

export const metadata = { title: "محصول جدید" };

export default async function NewProductPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="محصولات فروشگاه" />;

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (categories.length === 0) {
    return (
      <Card>
        <p className="text-muted">
          ابتدا باید حداقل یک دسته‌بندی بسازید. به بخش دسته‌بندی‌ها بروید.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">محصول جدید</h1>
      <Card>
        <ProductForm categories={categories} tags={tags} />
      </Card>
    </div>
  );
}
