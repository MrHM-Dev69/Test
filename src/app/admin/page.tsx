import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatToman, cn } from "@/lib/utils";
import { getDashboardData } from "./_lib/dashboard-data";
import { TrendAreaChart } from "./_components/dashboard-charts";

export const dynamic = "force-dynamic";

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "در انتظار",
  AWAITING_PAYMENT: "منتظر پرداخت",
  PAID: "پرداخت شده",
  PROCESSING: "در حال پردازش",
  COMPLETED: "تکمیل شده",
  CANCELLED: "لغو شده",
  REFUNDED: "بازگشت وجه",
  FAILED: "ناموفق",
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  NEW: "جدید",
  REVIEWING: "در حال بررسی",
  QUOTED: "قیمت‌گذاری شده",
  ACCEPTED: "پذیرفته شده",
  IN_PROGRESS: "در حال انجام",
  WAITING_FOR_CLIENT: "منتظر مشتری",
  COMPLETED: "تکمیل شده",
  DELIVERED: "تحویل شده",
  CANCELLED: "لغو شده",
};

function KpiCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <p className="text-sm text-muted">{title}</p>
        <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const { kpi } = data;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">داشبورد مدیریت</h1>
        <p className="mt-1 text-sm text-muted">نمای کلی عملکرد پلتفرم بر اساس داده‌های واقعی</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <KpiCard
          title="درآمد این ماه"
          value={formatToman(kpi.revenueThisMonth)}
          sub={
            <span className={cn(kpi.revenueChangePct >= 0 ? "text-emerald-400" : "text-red-400")}>
              {kpi.revenueChangePct >= 0 ? "▲" : "▼"} {Math.abs(kpi.revenueChangePct).toFixed(1)}٪ نسبت به ماه قبل
            </span>
          }
        />
        <KpiCard title="تعداد سفارش‌ها" value={kpi.ordersTotal.toLocaleString("fa-IR")} />
        <KpiCard title="مشتریان" value={kpi.customersCount.toLocaleString("fa-IR")} />
        <KpiCard
          title="محصولات"
          value={kpi.productsTotal.toLocaleString("fa-IR")}
          sub={`${kpi.productsPublished} منتشر شده / ${kpi.productsDraft} پیش‌نویس`}
        />
        <KpiCard title="دوره‌ها" value={kpi.coursesCount.toLocaleString("fa-IR")} />
        <KpiCard title="دانشجویان" value={kpi.studentsCount.toLocaleString("fa-IR")} />
        <KpiCard title="پروژه‌های در حال انجام" value={kpi.activeProjects.toLocaleString("fa-IR")} />
        <KpiCard title="درخواست‌های جدید" value={kpi.pendingProjects.toLocaleString("fa-IR")} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>روند درآمد (۳۰ روز اخیر)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendAreaChart data={data.charts.revenue} color="#e11d2e" valueKind="toman" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>وضعیت سفارش‌ها</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {kpi.ordersByStatus.length === 0 && <p className="text-sm text-muted">سفارشی ثبت نشده است.</p>}
            {kpi.ordersByStatus.map((s) => (
              <div key={s.status} className="flex items-center justify-between text-sm">
                <span className="text-muted">{ORDER_STATUS_LABELS[s.status] ?? s.status}</span>
                <Badge variant="secondary">{s.count.toLocaleString("fa-IR")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>سفارش‌ها در روز (۳۰ روز اخیر)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendAreaChart data={data.charts.orders} color="#38bdf8" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>ثبت‌نام دوره در روز (۳۰ روز اخیر)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendAreaChart data={data.charts.enrollments} color="#34d399" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>سفارش‌های اخیر</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-right text-muted">
                  <th className="pb-2 font-medium">شماره سفارش</th>
                  <th className="pb-2 font-medium">مشتری</th>
                  <th className="pb-2 font-medium">مبلغ</th>
                  <th className="pb-2 font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted">
                      سفارشی ثبت نشده است.
                    </td>
                  </tr>
                )}
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border/50">
                    <td className="py-2">
                      <Link href={`/admin/shop/orders/${o.id}`} className="text-accent hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2 text-muted">{o.user?.name ?? o.user?.email ?? "—"}</td>
                    <td className="py-2">{formatToman(Number(o.total))}</td>
                    <td className="py-2">
                      <Badge variant="secondary">{ORDER_STATUS_LABELS[o.status] ?? o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مشتریان اخیر</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.recentCustomers.length === 0 && <p className="text-sm text-muted">مشتری‌ای ثبت نشده است.</p>}
            {data.recentCustomers.map((c) => (
              <Link
                key={c.id}
                href={`/admin/customers/${c.id}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5"
              >
                <span className="text-sm text-foreground">{c.name ?? c.email ?? c.phone}</span>
                <span className="text-xs text-muted">
                  {new Intl.DateTimeFormat("fa-IR").format(c.createdAt)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>پروژه‌های اخیر</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.recentProjects.length === 0 && <p className="text-sm text-muted">درخواستی ثبت نشده است.</p>}
            {data.recentProjects.map((p) => (
              <Link
                key={p.id}
                href={`/admin/projects/${p.id}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5"
              >
                <span className="truncate text-sm text-foreground">{p.contactName}</span>
                <Badge variant="secondary">{PROJECT_STATUS_LABELS[p.status] ?? p.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>فعالیت‌های اخیر</CardTitle>
          </CardHeader>
          <CardContent className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {data.activityFeed.length === 0 && <p className="text-sm text-muted">فعالیتی ثبت نشده است.</p>}
            {data.activityFeed.map((a) => (
              <div key={a.id} className="text-xs">
                <span className="text-foreground">{a.user?.name ?? "سیستم"}</span>{" "}
                <span className="text-muted">
                  {a.action} · {a.entity}
                </span>
                <div className="text-muted/70">
                  {new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(a.createdAt)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>رویدادهای امنیتی</CardTitle>
          </CardHeader>
          <CardContent className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {data.securityEvents.failedLogins.length === 0 && data.securityEvents.auditLogs.length === 0 && (
              <p className="text-sm text-muted">رویداد امنیتی ثبت نشده است.</p>
            )}
            {data.securityEvents.failedLogins.map((l) => (
              <div key={l.id} className="text-xs">
                <Badge variant="destructive">ورود ناموفق</Badge>{" "}
                <span className="text-muted">{l.user?.name ?? l.user?.email ?? "—"}</span>
                <div className="text-muted/70">
                  {new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(l.createdAt)}
                </div>
              </div>
            ))}
            {data.securityEvents.auditLogs.map((a) => (
              <div key={a.id} className="text-xs">
                <Badge variant="warning">{a.action}</Badge>{" "}
                <span className="text-muted">{a.user?.name ?? "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
