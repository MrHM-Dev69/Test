import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminUser, can } from "../../_lib/guard";
import { Forbidden } from "../../_components/forbidden";
import { BroadcastForm } from "./broadcast-form";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "communication.manage")) return <Forbidden label="اعلان‌ها" />;

  const recent = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">اعلان‌ها</h1>
        <p className="mt-1 text-sm text-muted">ارسال اعلان درون‌برنامه‌ای به کاربران</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ارسال اعلان جدید</CardTitle>
        </CardHeader>
        <CardContent>
          <BroadcastForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>اعلان‌های اخیر</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {recent.length === 0 && <p className="text-sm text-muted">اعلانی ارسال نشده است.</p>}
          {recent.map((n) => (
            <div key={n.id} className="rounded-lg border border-border/50 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">{n.title}</p>
                <span className="text-xs text-muted">{n.user?.name ?? n.user?.email ?? "—"}</span>
              </div>
              <p className="mt-1 text-muted">{n.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
