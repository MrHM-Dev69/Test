import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminUser, can, ADMIN_ROLES } from "../_lib/guard";
import { Forbidden } from "../_components/forbidden";

export const dynamic = "force-dynamic";

export default async function SecurityHubPage() {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "security.manage")) return <Forbidden label="امنیت" />;

  const [failedLogins24h, activeSessions, adminUsers] = await Promise.all([
    // eslint-disable-next-line react-hooks/purity -- Server Component render is per-request, not memoized/re-rendered like client components
    prisma.loginHistory.count({ where: { success: false, createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
    prisma.user.findMany({
      where: { role: { name: { in: ADMIN_ROLES } } },
      include: { role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const links = [
    { href: "/admin/security/activity-log", title: "گزارش فعالیت‌ها", desc: "تمام رویدادهای حساس ثبت‌شده در سیستم" },
    { href: "/admin/security/login-history", title: "تاریخچه ورود", desc: "ورودهای موفق و ناموفق تمام کاربران" },
    { href: "/admin/security/sessions", title: "نشست‌های فعال", desc: "مدیریت و خروج اجباری نشست‌های کاربران" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">امنیت</h1>
        <p className="mt-1 text-sm text-muted">نظارت بر رویدادهای امنیتی پلتفرم</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">ورود ناموفق (۲۴ ساعت اخیر)</p>
            <p className="mt-2 text-xl font-bold">{failedLogins24h.toLocaleString("fa-IR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">نشست‌های فعال</p>
            <p className="mt-2 text-xl font-bold">{activeSessions.toLocaleString("fa-IR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <p className="text-sm text-muted">کارکنان با 2FA فعال</p>
            <p className="mt-2 text-xl font-bold">
              {adminUsers.filter((u) => u.twoFactorEnabled).length.toLocaleString("fa-IR")} / {adminUsers.length.toLocaleString("fa-IR")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="h-full transition-colors hover:border-accent/40">
              <CardHeader>
                <CardTitle>{l.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted">{l.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>وضعیت احراز هویت دومرحله‌ای کارکنان</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">کاربر</th>
                <th className="p-3 font-medium">نقش</th>
                <th className="p-3 font-medium">2FA</th>
                <th className="p-3 font-medium">آخرین ورود</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((u) => (
                <tr key={u.id} className="border-b border-border/50">
                  <td className="p-3">{u.name ?? u.email ?? "—"}</td>
                  <td className="p-3 text-muted">{u.role.name}</td>
                  <td className="p-3">
                    <Badge variant={u.twoFactorEnabled ? "success" : "destructive"}>
                      {u.twoFactorEnabled ? "فعال" : "غیرفعال"}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted">
                    {u.lastLoginAt ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(u.lastLoginAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
