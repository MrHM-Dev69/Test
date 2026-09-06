import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatToman } from "@/lib/utils";
import { getAdminUser, can } from "../../_lib/guard";
import { Forbidden } from "../../_components/forbidden";
import { CustomerActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin || !(can(admin, "customers.manage") || can(admin, "customers.view"))) {
    return <Forbidden label="مشتریان" />;
  }

  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      orders: { orderBy: { createdAt: "desc" }, take: 20, include: { items: true } },
      enrollments: { orderBy: { createdAt: "desc" }, take: 20, include: { course: true } },
      tickets: { orderBy: { createdAt: "desc" }, take: 20 },
      addresses: { orderBy: { createdAt: "desc" } },
      loginHistory: { orderBy: { createdAt: "desc" }, take: 20 },
      sessions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!customer || customer.role.name !== "CUSTOMER") notFound();

  const totalSpent = customer.orders
    .filter((o) => ["COMPLETED", "PAID"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{customer.name ?? "بدون نام"}</h1>
          <p className="mt-1 text-sm text-muted">
            {customer.email ?? "—"} · {customer.phone ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={customer.isActive ? "success" : "destructive"}>
            {customer.isActive ? "فعال" : "غیرفعال"}
          </Badge>
          {customer.twoFactorEnabled && <Badge variant="default">2FA فعال</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">مجموع خرید</p>
            <p className="mt-2 text-xl font-bold">{formatToman(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">تعداد سفارش</p>
            <p className="mt-2 text-xl font-bold">{customer.orders.length.toLocaleString("fa-IR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">دوره‌های ثبت‌نام‌شده</p>
            <p className="mt-2 text-xl font-bold">{customer.enrollments.length.toLocaleString("fa-IR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">تیکت‌ها</p>
            <p className="mt-2 text-xl font-bold">{customer.tickets.length.toLocaleString("fa-IR")}</p>
          </CardContent>
        </Card>
      </div>

      <CustomerActions
        customerId={customer.id}
        isActive={customer.isActive}
        currentRole={customer.role.name}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>سفارش‌ها</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {customer.orders.length === 0 && <p className="text-sm text-muted">سفارشی ثبت نشده است.</p>}
            {customer.orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm">
                <span>{o.orderNumber}</span>
                <span className="text-muted">{formatToman(Number(o.total))}</span>
                <Badge variant="secondary">{o.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ثبت‌نام دوره‌ها</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {customer.enrollments.length === 0 && <p className="text-sm text-muted">ثبت‌نامی ثبت نشده است.</p>}
            {customer.enrollments.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm">
                <span>{e.course.title}</span>
                <span className="text-muted">{e.progressPct.toFixed(0)}٪</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تیکت‌های پشتیبانی</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {customer.tickets.length === 0 && <p className="text-sm text-muted">تیکتی ثبت نشده است.</p>}
            {customer.tickets.map((t) => (
              <Link
                key={t.id}
                href={`/admin/communication/tickets/${t.id}`}
                className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm hover:bg-white/5"
              >
                <span>{t.subject}</span>
                <Badge variant="secondary">{t.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>آدرس‌ها</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {customer.addresses.length === 0 && <p className="text-sm text-muted">آدرسی ثبت نشده است.</p>}
            {customer.addresses.map((a) => (
              <div key={a.id} className="rounded-lg border border-border/50 px-3 py-2 text-sm">
                <p>{a.fullName}</p>
                <p className="text-muted">
                  {a.province} {a.city} — {a.line1}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تاریخچه ورود</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {customer.loginHistory.length === 0 && <p className="text-sm text-muted">ورودی ثبت نشده است.</p>}
            {customer.loginHistory.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm">
                <span className="text-muted">{l.ipAddress ?? "—"}</span>
                <span className="text-xs text-muted">
                  {new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(l.createdAt)}
                </span>
                <Badge variant={l.success ? "success" : "destructive"}>{l.success ? "موفق" : "ناموفق"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نشست‌های فعال</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {customer.sessions.filter((s) => !s.revokedAt && s.expiresAt > new Date()).length === 0 && (
              <p className="text-sm text-muted">نشست فعالی وجود ندارد.</p>
            )}
            {customer.sessions
              .filter((s) => !s.revokedAt && s.expiresAt > new Date())
              .map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm">
                  <span className="text-muted">{s.deviceLabel ?? s.userAgent?.slice(0, 40) ?? "—"}</span>
                  <span className="text-xs text-muted">{s.ipAddress ?? "—"}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
