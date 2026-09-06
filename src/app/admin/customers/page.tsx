import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getAdminUser, can } from "../_lib/guard";
import { Forbidden } from "../_components/forbidden";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await getAdminUser();
  if (!user || !(can(user, "customers.manage") || can(user, "customers.view"))) {
    return <Forbidden label="مشتریان" />;
  }

  const { q = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const where = {
    role: { name: "CUSTOMER" as const },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, customers] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { orders: true, enrollments: true, tickets: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">مشتریان</h1>
        <p className="mt-1 text-sm text-muted">{total.toLocaleString("fa-IR")} مشتری ثبت‌شده</p>
      </div>

      <form className="flex gap-2" action="/admin/customers">
        <Input name="q" defaultValue={q} placeholder="جستجو بر اساس نام، ایمیل یا شماره تماس..." className="max-w-sm" />
      </form>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">نام</th>
                <th className="p-3 font-medium">ایمیل</th>
                <th className="p-3 font-medium">تلفن</th>
                <th className="p-3 font-medium">سفارش‌ها</th>
                <th className="p-3 font-medium">ثبت‌نام‌ها</th>
                <th className="p-3 font-medium">تیکت‌ها</th>
                <th className="p-3 font-medium">وضعیت</th>
                <th className="p-3 font-medium">تاریخ عضویت</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted">
                    مشتری‌ای یافت نشد.
                  </td>
                </tr>
              )}
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-white/5">
                  <td className="p-3">
                    <Link href={`/admin/customers/${c.id}`} className="text-accent hover:underline">
                      {c.name ?? "—"}
                    </Link>
                  </td>
                  <td className="p-3 text-muted">{c.email ?? "—"}</td>
                  <td className="p-3 text-muted">{c.phone ?? "—"}</td>
                  <td className="p-3">{c._count.orders.toLocaleString("fa-IR")}</td>
                  <td className="p-3">{c._count.enrollments.toLocaleString("fa-IR")}</td>
                  <td className="p-3">{c._count.tickets.toLocaleString("fa-IR")}</td>
                  <td className="p-3">
                    <Badge variant={c.isActive ? "success" : "destructive"}>
                      {c.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted">{new Intl.DateTimeFormat("fa-IR").format(c.createdAt)}</td>
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
              href={`/admin/customers?q=${encodeURIComponent(q)}&page=${p}`}
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
