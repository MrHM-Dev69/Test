import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminUser, can } from "../../_lib/guard";
import { Forbidden } from "../../_components/forbidden";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 40;

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string; user?: string; from?: string; to?: string; page?: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "security.manage")) return <Forbidden label="گزارش فعالیت‌ها" />;

  const { action, entity, user, from, to, page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const where = {
    ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
    ...(entity ? { entity: { contains: entity, mode: "insensitive" as const } } : {}),
    ...(user
      ? {
          user: {
            OR: [
              { name: { contains: user, mode: "insensitive" as const } },
              { email: { contains: user, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
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
        <h1 className="text-2xl font-bold text-foreground">گزارش فعالیت‌ها</h1>
        <p className="mt-1 text-sm text-muted">{total.toLocaleString("fa-IR")} رویداد</p>
      </div>

      <form className="flex flex-wrap gap-2" action="/admin/security/activity-log">
        <input name="user" defaultValue={user ?? ""} placeholder="کاربر (نام یا ایمیل)" className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" />
        <input name="action" defaultValue={action ?? ""} placeholder="عملیات" className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" />
        <input name="entity" defaultValue={entity ?? ""} placeholder="موجودیت" className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" />
        <input type="date" name="from" defaultValue={from ?? ""} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" />
        <input type="date" name="to" defaultValue={to ?? ""} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" />
        <button type="submit" className="h-10 rounded-lg bg-accent px-4 text-sm text-white">
          فیلتر
        </button>
      </form>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">کاربر</th>
                <th className="p-3 font-medium">عملیات</th>
                <th className="p-3 font-medium">موجودیت</th>
                <th className="p-3 font-medium">IP</th>
                <th className="p-3 font-medium">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    رویدادی یافت نشد.
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-border/50">
                  <td className="p-3">{l.user?.name ?? l.user?.email ?? "سیستم"}</td>
                  <td className="p-3 text-muted">{l.action}</td>
                  <td className="p-3 text-muted">
                    {l.entity}
                    {l.entityId ? ` #${l.entityId.slice(0, 8)}` : ""}
                  </td>
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
              href={`/admin/security/activity-log?page=${p}`}
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
