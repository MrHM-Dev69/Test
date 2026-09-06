import { redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card } from "@/components/ui/card";
import { RevenueChart } from "@/components/admin/shop/revenue-chart";
import { formatToman } from "@/lib/utils";

export const metadata = { title: "گزارش فروش" };

interface DailyRevenueRow {
  day: Date;
  total: bigint | number | string;
}

export default async function AdminSalesReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="گزارش فروش" />;

  // eslint-disable-next-line react-hooks/purity -- Server Component render is per-request, not memoized/re-rendered like client components
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<DailyRevenueRow[]>`
    SELECT date_trunc('day', "occurredAt") AS day, SUM("amount") AS total
    FROM "Transaction"
    WHERE "category" = 'product_sale' AND "type" = 'INCOME' AND "occurredAt" >= ${since}
    GROUP BY day
    ORDER BY day ASC
  `;

  const chartData = rows.map((r) => ({
    date: new Date(r.day).toLocaleDateString("fa-IR"),
    revenue: Number(r.total),
  }));

  const totalRevenue = chartData.reduce((sum, r) => sum + r.revenue, 0);
  const totalRefundsAgg = await prisma.transaction.aggregate({
    where: { category: "refund", type: "EXPENSE", occurredAt: { gte: since } },
    _sum: { amount: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">گزارش فروش (۹۰ روز اخیر)</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">درآمد کل</p>
          <p className="mt-2 text-2xl font-bold text-accent">{formatToman(totalRevenue)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">بازگشت وجه کل</p>
          <p className="mt-2 text-2xl font-bold text-red-400">
            {formatToman(Number(totalRefundsAgg._sum.amount ?? 0))}
          </p>
        </Card>
      </div>

      <Card>
        <RevenueChart data={chartData} />
      </Card>
    </div>
  );
}
