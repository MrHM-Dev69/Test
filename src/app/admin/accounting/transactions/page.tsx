import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatToman, cn } from "@/lib/utils";
import { getAdminUser, can } from "../../_lib/guard";
import { Forbidden } from "../../_components/forbidden";
import Link from "next/link";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string; from?: string; to?: string; page?: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "accounting.manage")) return <Forbidden label="حسابداری" />;

  const { type, category, from, to, page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const where = {
    ...(type ? { type: type as never } : {}),
    ...(category ? { category } : {}),
    ...(from || to
      ? {
          occurredAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [total, transactions, categories] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.transaction.findMany({ distinct: ["category"], select: { category: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">تراکنش‌های مالی</h1>
        <p className="mt-1 text-sm text-muted">{total.toLocaleString("fa-IR")} تراکنش</p>
      </div>

      <form className="flex flex-wrap gap-2" action="/admin/accounting/transactions">
        <select name="type" defaultValue={type ?? ""} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground">
          <option value="">همه انواع</option>
          <option value="INCOME">درآمد</option>
          <option value="EXPENSE">هزینه</option>
        </select>
        <select name="category" defaultValue={category ?? ""} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground">
          <option value="">همه دسته‌ها</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>
              {c.category}
            </option>
          ))}
        </select>
        <input type="date" name="from" defaultValue={from ?? ""} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" />
        <input type="date" name="to" defaultValue={to ?? ""} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" />
        <button type="submit" className="h-10 rounded-lg bg-accent px-4 text-sm text-white">
          فیلتر
        </button>
      </form>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">نوع</th>
                <th className="p-3 font-medium">دسته</th>
                <th className="p-3 font-medium">توضیحات</th>
                <th className="p-3 font-medium">مبلغ</th>
                <th className="p-3 font-medium">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    تراکنشی یافت نشد.
                  </td>
                </tr>
              )}
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-border/50">
                  <td className="p-3">
                    <Badge variant={t.type === "INCOME" ? "success" : "destructive"}>
                      {t.type === "INCOME" ? "درآمد" : "هزینه"}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted">{t.category}</td>
                  <td className="p-3 text-muted">{t.description ?? "—"}</td>
                  <td className={cn("p-3 font-medium", t.type === "INCOME" ? "text-emerald-400" : "text-red-400")}>
                    {formatToman(Number(t.amount))}
                  </td>
                  <td className="p-3 text-muted">{new Intl.DateTimeFormat("fa-IR").format(t.occurredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/accounting/transactions?page=${p}`}
              className={`rounded-lg px-3 py-1 ${p === pageNum ? "bg-accent text-white" : "text-muted hover:bg-white/5"}`}
            >
              {p.toLocaleString("fa-IR")}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
