import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card, CardTitle } from "@/components/ui/card";
import { formatToman } from "@/lib/utils";
import type { RoleName } from "@prisma/client";

export const metadata = { title: "داشبورد فروشگاه" };

export default async function ShopAdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="فروشگاه" />;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalProducts,
    ordersToday,
    pendingOrders,
    productsWithoutFiles,
    revenueAgg,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "AWAITING_PAYMENT", "PROCESSING"] } } }),
    prisma.product.count({
      where: { productType: { not: "SERVICE" }, files: { none: {} } },
    }),
    prisma.transaction.aggregate({
      where: { category: "product_sale", type: "INCOME", occurredAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
  ]);

  const revenueThisMonth = Number(revenueAgg._sum.amount ?? 0);

  const stats = [
    { label: "تعداد محصولات", value: totalProducts.toLocaleString("fa-IR") },
    { label: "سفارش‌های امروز", value: ordersToday.toLocaleString("fa-IR") },
    { label: "سفارش‌های در انتظار", value: pendingOrders.toLocaleString("fa-IR") },
    { label: "درآمد این ماه", value: formatToman(revenueThisMonth) },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">داشبورد فروشگاه</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-accent">{s.value}</p>
          </Card>
        ))}
      </div>

      {productsWithoutFiles > 0 && (
        <Card className="mt-6 border-amber-500/40">
          <CardTitle className="text-amber-400">هشدار</CardTitle>
          <p className="mt-2 text-sm text-muted">
            {productsWithoutFiles} محصول بدون فایل پیوست‌شده وجود دارد.{" "}
            <Link href="/admin/shop/products" className="text-accent hover:underline">
              مشاهده محصولات
            </Link>
          </p>
        </Card>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/shop/products/new" className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover">
          افزودن محصول جدید
        </Link>
        <Link href="/admin/shop/orders" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-white/5">
          مدیریت سفارش‌ها
        </Link>
        <Link href="/admin/shop/reports" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-white/5">
          گزارش فروش
        </Link>
      </div>
    </div>
  );
}
