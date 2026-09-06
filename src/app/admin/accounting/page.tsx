import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatToman, cn } from "@/lib/utils";
import { getAdminUser, can } from "../_lib/guard";
import { Forbidden } from "../_components/forbidden";

export const dynamic = "force-dynamic";

function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export default async function AccountingDashboardPage() {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "accounting.manage")) return <Forbidden label="حسابداری" />;

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  const [
    incomeThisMonth,
    expenseThisMonth,
    incomeLastMonth,
    expenseLastMonth,
    incomeAllTime,
    expenseAllTime,
    unpaidInvoices,
    overdueInvoices,
    recentTransactions,
  ] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: "INCOME", occurredAt: { gte: thisMonthStart } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE", occurredAt: { gte: thisMonthStart } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "INCOME", occurredAt: { gte: lastMonthStart, lt: thisMonthStart } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE", occurredAt: { gte: lastMonthStart, lt: thisMonthStart } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "INCOME" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE" }, _sum: { amount: true } }),
    prisma.invoice.count({ where: { status: { in: ["ISSUED", "DRAFT"] } } }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
    prisma.transaction.findMany({ orderBy: { occurredAt: "desc" }, take: 10 }),
  ]);

  const incThis = Number(incomeThisMonth._sum.amount ?? 0);
  const expThis = Number(expenseThisMonth._sum.amount ?? 0);
  const incLast = Number(incomeLastMonth._sum.amount ?? 0);
  const expLast = Number(expenseLastMonth._sum.amount ?? 0);
  const netThis = incThis - expThis;
  const netLast = incLast - expLast;
  const netChangePct = netLast !== 0 ? ((netThis - netLast) / Math.abs(netLast)) * 100 : netThis > 0 ? 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">داشبورد مالی</h1>
          <p className="mt-1 text-sm text-muted">جمع‌بندی درآمد و هزینه‌های واقعی پلتفرم</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/accounting/transactions" className="text-accent hover:underline">
            تراکنش‌ها
          </Link>
          <Link href="/admin/accounting/invoices" className="text-accent hover:underline">
            فاکتورها
          </Link>
          <Link href="/admin/accounting/reports" className="text-accent hover:underline">
            گزارش‌ها
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">درآمد این ماه</p>
            <p className="mt-2 text-xl font-bold">{formatToman(incThis)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">هزینه این ماه</p>
            <p className="mt-2 text-xl font-bold">{formatToman(expThis)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">سود خالص این ماه</p>
            <p className="mt-2 text-xl font-bold">{formatToman(netThis)}</p>
            <p className={cn("mt-1 text-xs", netChangePct >= 0 ? "text-emerald-400" : "text-red-400")}>
              {netChangePct >= 0 ? "▲" : "▼"} {Math.abs(netChangePct).toFixed(1)}٪ نسبت به ماه قبل
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">فاکتورهای پرداخت‌نشده</p>
            <p className="mt-2 text-xl font-bold">{unpaidInvoices.toLocaleString("fa-IR")}</p>
            <p className="mt-1 text-xs text-red-400">{overdueInvoices.toLocaleString("fa-IR")} سررسید گذشته</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">مجموع درآمد کل</p>
            <p className="mt-2 text-xl font-bold">{formatToman(Number(incomeAllTime._sum.amount ?? 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">مجموع هزینه کل</p>
            <p className="mt-2 text-xl font-bold">{formatToman(Number(expenseAllTime._sum.amount ?? 0))}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تراکنش‌های اخیر</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">نوع</th>
                <th className="p-3 font-medium">دسته</th>
                <th className="p-3 font-medium">مبلغ</th>
                <th className="p-3 font-medium">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted">
                    تراکنشی ثبت نشده است.
                  </td>
                </tr>
              )}
              {recentTransactions.map((t) => (
                <tr key={t.id} className="border-b border-border/50">
                  <td className={cn("p-3", t.type === "INCOME" ? "text-emerald-400" : "text-red-400")}>
                    {t.type === "INCOME" ? "درآمد" : "هزینه"}
                  </td>
                  <td className="p-3 text-muted">{t.category}</td>
                  <td className="p-3">{formatToman(Number(t.amount))}</td>
                  <td className="p-3 text-muted">{new Intl.DateTimeFormat("fa-IR").format(t.occurredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
