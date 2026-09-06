import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageAcademy } from "@/lib/auth/academy-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { CategoriesManager } from "./categories-manager";
import type { RoleName } from "@prisma/client";

export const metadata = { title: "دسته‌بندی‌ها" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageAcademy(user.role as RoleName)) return <Forbidden label="دسته‌بندی‌ها" />;

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { courses: true, products: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">دسته‌بندی‌ها</h1>
      <p className="text-sm text-muted">
        این دسته‌بندی با فروشگاه مشترک است؛ حذف یا ویرایش آن روی محصولات فروشگاه نیز اثر می‌گذارد.
      </p>
      <CategoriesManager categories={categories} />
    </div>
  );
}
