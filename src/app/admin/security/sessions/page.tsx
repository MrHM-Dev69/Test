import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminUser, can } from "../../_lib/guard";
import { Forbidden } from "../../_components/forbidden";
import { RevokeSessionButton } from "./revoke-button";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "security.manage")) return <Forbidden label="نشست‌های فعال" />;

  const sessions = await prisma.session.findMany({
    where: { revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">نشست‌های فعال</h1>
        <p className="mt-1 text-sm text-muted">{sessions.length.toLocaleString("fa-IR")} نشست فعال</p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">کاربر</th>
                <th className="p-3 font-medium">دستگاه</th>
                <th className="p-3 font-medium">IP</th>
                <th className="p-3 font-medium">ایجاد شده در</th>
                <th className="p-3 font-medium">انقضا</th>
                <th className="p-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    نشست فعالی وجود ندارد.
                  </td>
                </tr>
              )}
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="p-3">{s.user.name ?? s.user.email ?? "—"}</td>
                  <td className="max-w-[220px] truncate p-3 text-muted">{s.deviceLabel ?? s.userAgent ?? "—"}</td>
                  <td className="p-3 text-muted" dir="ltr">
                    {s.ipAddress ?? "—"}
                  </td>
                  <td className="p-3 text-muted">{new Intl.DateTimeFormat("fa-IR").format(s.createdAt)}</td>
                  <td className="p-3 text-muted">{new Intl.DateTimeFormat("fa-IR").format(s.expiresAt)}</td>
                  <td className="p-3">
                    <RevokeSessionButton sessionId={s.id} />
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
