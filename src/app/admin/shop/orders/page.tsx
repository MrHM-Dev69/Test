import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderStatus, type RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatToman } from "@/lib/utils";

export const metadata = { title: "سفارش‌های فروشگاه" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="سفارش‌ها" />;

  const { status } = await searchParams;
  const statuses = Object.values(OrderStatus);
  const validStatus = status && (statuses as string[]).includes(status) ? (status as OrderStatus) : undefined;

  const orders = await prisma.order.findMany({
    where: validStatus ? { status: validStatus } : undefined,
    include: { user: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">سفارش‌های فروشگاه</h1>

      <form method="get" className="mb-6 flex items-end gap-3">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="">همه وضعیت‌ها</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-lg bg-accent px-4 text-sm text-white hover:bg-accent-hover">
          فیلتر
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <Link key={order.id} href={`/admin/shop/orders/${order.id}`}>
            <Card className="flex items-center justify-between transition-colors hover:border-accent/40">
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="mt-1 text-xs text-muted">
                  {order.user.name ?? order.user.email ?? order.user.phone} — {order.items.length} قلم
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-accent">{formatToman(order.total.toString())}</span>
                <Badge>{order.status}</Badge>
              </div>
            </Card>
          </Link>
        ))}
        {orders.length === 0 && <p className="text-muted">سفارشی یافت نشد.</p>}
      </div>
    </div>
  );
}
