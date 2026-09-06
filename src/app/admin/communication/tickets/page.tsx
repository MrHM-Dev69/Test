import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminUser, canAccessPrefix } from "../../_lib/guard";
import { Forbidden } from "../../_components/forbidden";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "باز",
  IN_PROGRESS: "در حال بررسی",
  WAITING_FOR_CUSTOMER: "منتظر مشتری",
  RESOLVED: "حل شده",
  CLOSED: "بسته شده",
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin || !canAccessPrefix(admin, ["communication.", "support."])) return <Forbidden label="تیکت‌ها" />;

  const { status } = await searchParams;

  const tickets = await prisma.ticket.findMany({
    where: status ? { status: status as never } : {},
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { user: true, _count: { select: { messages: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">تیکت‌های پشتیبانی</h1>
        <p className="mt-1 text-sm text-muted">{tickets.length.toLocaleString("fa-IR")} تیکت</p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Link href="/admin/communication/tickets" className={!status ? "text-accent" : "text-muted"}>
          همه
        </Link>
        {Object.entries(STATUS_LABELS).map(([k, label]) => (
          <Link key={k} href={`/admin/communication/tickets?status=${k}`} className={status === k ? "text-accent" : "text-muted"}>
            {label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">موضوع</th>
                <th className="p-3 font-medium">کاربر</th>
                <th className="p-3 font-medium">پیام‌ها</th>
                <th className="p-3 font-medium">وضعیت</th>
                <th className="p-3 font-medium">آخرین بروزرسانی</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    تیکتی یافت نشد.
                  </td>
                </tr>
              )}
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-white/5">
                  <td className="p-3">
                    <Link href={`/admin/communication/tickets/${t.id}`} className="text-accent hover:underline">
                      {t.subject}
                    </Link>
                  </td>
                  <td className="p-3 text-muted">{t.user.name ?? t.user.email ?? "—"}</td>
                  <td className="p-3">{t._count.messages.toLocaleString("fa-IR")}</td>
                  <td className="p-3">
                    <Badge variant={t.status === "RESOLVED" || t.status === "CLOSED" ? "success" : "secondary"}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted">{new Intl.DateTimeFormat("fa-IR").format(t.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
