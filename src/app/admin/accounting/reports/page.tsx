import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatToman } from "@/lib/utils";
import { getAdminUser, can } from "../../_lib/guard";
import { Forbidden } from "../../_components/forbidden";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  product_sale: "فروش محصول",
  course_sale: "فروش دوره",
  project_revenue: "درآمد پروژه",
  invoice_payment: "پرداخت فاکتور",
  refund: "بازگشت وجه",
  operating_expense: "هزینه عملیاتی",
};

export default async function AccountingReportsPage() {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "accounting.manage")) return <Forbidden label="حسابداری" />;

  const [byCategory, monthlyRaw] = await Promise.all([
    prisma.transaction.groupBy({ by: ["type", "category"], _sum: { amount: true }, _count: { _all: true } }),
    prisma.$queryRaw<{ month: Date; type: string; total: bigint }[]>`
      SELECT date_trunc('month', "occurredAt") AS month, type, COALESCE(SUM(amount), 0) AS total
      FROM "Transaction"
      WHERE "occurredAt" >= now() - interval '12 months'
      GROUP BY 1, 2 ORDER BY 1
    `,
  ]);

  const productRevenue = byCategory.filter((c) => c.category === "product_sale" && c.type === "INCOME");
  const courseRevenue = byCategory.filter((c) => c.category === "course_sale" && c.type === "INCOME");
  const projectRevenue = byCategory.filter((c) => c.category === "project_revenue" && c.type === "INCOME");

  const monthlyMap = new Map<string, { income: number; expense: number }>();
  for (const row of monthlyRaw) {
    const key = new Date(row.month).toISOString().slice(0, 7);
    const entry = monthlyMap.get(key) ?? { income: 0, expense: 0 };
    if (row.type === "INCOME") entry.income += Number(row.total);
    else entry.expense += Number(row.total);
    monthlyMap.set(key, entry);
  }
  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">گزارش‌های مالی</h1>
        <p className="mt-1 text-sm text-muted">بر اساس تراکنش‌های واقعی ثبت‌شده</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>درآمد ماهانه (۱۲ ماه اخیر)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">ماه</th>
                <th className="p-3 font-medium">درآمد</th>
                <th className="p-3 font-medium">هزینه</th>
                <th className="p-3 font-medium">خالص</th>
              </tr>
            </thead>
            <tbody>
              {monthly.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted">
                    داده‌ای موجود نیست.
                  </td>
                </tr>
              )}
              {monthly.map((m) => (
                <tr key={m.month} className="border-b border-border/50">
                  <td className="p-3">{m.month}</td>
                  <td className="p-3 text-emerald-400">{formatToman(m.income)}</td>
                  <td className="p-3 text-red-400">{formatToman(m.expense)}</td>
                  <td className="p-3 font-medium">{formatToman(m.income - m.expense)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>درآمد محصولات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {formatToman(productRevenue.reduce((s, c) => s + Number(c._sum.amount ?? 0), 0))}
            </p>
            <p className="text-xs text-muted">
              {productRevenue.reduce((s, c) => s + c._count._all, 0).toLocaleString("fa-IR")} تراکنش
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>درآمد دوره‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {formatToman(courseRevenue.reduce((s, c) => s + Number(c._sum.amount ?? 0), 0))}
            </p>
            <p className="text-xs text-muted">
              {courseRevenue.reduce((s, c) => s + c._count._all, 0).toLocaleString("fa-IR")} تراکنش
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>درآمد پروژه‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {formatToman(projectRevenue.reduce((s, c) => s + Number(c._sum.amount ?? 0), 0))}
            </p>
            <p className="text-xs text-muted">
              {projectRevenue.reduce((s, c) => s + c._count._all, 0).toLocaleString("fa-IR")} تراکنش
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تفکیک بر اساس دسته</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">نوع</th>
                <th className="p-3 font-medium">دسته</th>
                <th className="p-3 font-medium">مجموع</th>
                <th className="p-3 font-medium">تعداد</th>
              </tr>
            </thead>
            <tbody>
              {byCategory.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted">
                    داده‌ای موجود نیست.
                  </td>
                </tr>
              )}
              {byCategory.map((c) => (
                <tr key={`${c.type}-${c.category}`} className="border-b border-border/50">
                  <td className="p-3">{c.type === "INCOME" ? "درآمد" : "هزینه"}</td>
                  <td className="p-3 text-muted">{CATEGORY_LABELS[c.category] ?? c.category}</td>
                  <td className="p-3">{formatToman(Number(c._sum.amount ?? 0))}</td>
                  <td className="p-3">{c._count._all.toLocaleString("fa-IR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
