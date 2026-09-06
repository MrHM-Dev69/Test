import { redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { SimpleCrudList } from "@/components/admin/shop/simple-crud-list";

export const metadata = { title: "دسته‌بندی‌های فروشگاه" };

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="دسته‌بندی‌ها" />;

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">دسته‌بندی‌های فروشگاه</h1>
      <SimpleCrudList
        apiBase="/api/admin/shop/categories"
        fields={[
          { name: "name", label: "نام دسته" },
          { name: "slug", label: "اسلاگ (انگلیسی)" },
        ]}
        slugify
        items={categories}
        renderItem={(item) => {
          const count = (item as unknown as { _count: { products: number } })._count.products;
          return (
            <span className="text-sm">
              {String(item.name)} <span className="text-xs text-muted">({count} محصول)</span>
            </span>
          );
        }}
      />
    </div>
  );
}
