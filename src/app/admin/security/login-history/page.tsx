import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminUser, can } from "../../_lib/guard";
import { Forbidden } from "../../_components/forbidden";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 40;

export default async function LoginHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; page?: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "security.manage")) return <Forbidden label="تاریخچه ورود" />;

  const { result, page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const where = result === "success" ? { success: true } : result === "failed" ? { success: false } : {};

  const [total, entries] = await Promise.all([
    prisma.loginHistory.count({ where }),
    prisma.loginHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">تاریخچه ورود</h1>
        <p className="mt-1 text-sm text-muted">{total.toLocaleString("fa-IR")} رویداد</p>
      </div>

      <div className="flex gap-2 text-xs">
        <Link href="/admin/security/login-history" className={!result ? "text-accent" : "text-muted"}>
          همه
        </Link>
        <Link href="/admin/security/login-history?result=success" className={result === "success" ? "text-accent" : "text-muted"}>
          موفق
        </Link>
        <Link href="/admin/security/login-history?result=failed" className={result === "failed" ? "text-accent" : "text-muted"}>
          ناموفق
        </Link>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">کاربر</th>
                <th className="p-3 font-medium">وضعیت</th>
                <th className="p-3 font-medium">دلیل</th>
                <th className="p-3 font-medium">IP</th>
                <th className="p-3 font-medium">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    رویدادی یافت نشد.
                  </td>
                </tr>
              )}
              {entries.map((l) => (
                <tr key={l.id} className="border-b border-border/50">
                  <td className="p-3">{l.user?.name ?? l.user?.email ?? "—"}</td>
                  <td className="p-3">
                    <Badge variant={l.success ? "success" : "destructive"}>{l.success ? "موفق" : "ناموفق"}</Badge>
                  </td>
                  <td className="p-3 text-muted">{l.reason ?? "—"}</td>
                  <td className="p-3 text-muted" dir="ltr">
                    {l.ipAddress ?? "—"}
                  </td>
                  <td className="p-3 text-muted">
                    {new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(l.createdAt)}
                  </td>
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
              href={`/admin/security/login-history?${result ? `result=${result}&` : ""}page=${p}`}
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
