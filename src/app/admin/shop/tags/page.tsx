import { redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { SimpleCrudList } from "@/components/admin/shop/simple-crud-list";

export const metadata = { title: "برچسب‌های فروشگاه" };

export default async function AdminTagsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="برچسب‌ها" />;

  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">برچسب‌های فروشگاه</h1>
      <SimpleCrudList
        apiBase="/api/admin/shop/tags"
        fields={[
          { name: "name", label: "نام برچسب" },
          { name: "slug", label: "اسلاگ (انگلیسی)" },
        ]}
        slugify
        items={tags}
        renderItem={(item) => <span className="text-sm">{String(item.name)}</span>}
      />
    </div>
  );
}
