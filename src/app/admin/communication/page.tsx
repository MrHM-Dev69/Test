import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminUser, canAccessPrefix } from "../_lib/guard";
import { Forbidden } from "../_components/forbidden";

export const dynamic = "force-dynamic";

export default async function CommunicationHubPage() {
  const admin = await getAdminUser();
  if (!admin || !canAccessPrefix(admin, ["communication.", "support."])) {
    return <Forbidden label="ارتباطات" />;
  }

  const [openTickets, notificationsCount, smsCount] = await Promise.all([
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER"] } } }),
    prisma.notification.count(),
    prisma.smsLog.count(),
  ]);

  const links = [
    { href: "/admin/communication/notifications", title: "اعلان‌ها", desc: "ارسال اعلان به کاربران", count: notificationsCount },
    { href: "/admin/communication/sms", title: "پیامک", desc: "قالب‌ها، ارسال گروهی و گزارش پیامک", count: smsCount },
    { href: "/admin/communication/tickets", title: "تیکت‌های پشتیبانی", desc: "پاسخ‌گویی به تیکت‌های کاربران", count: openTickets },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ارتباطات</h1>
        <p className="mt-1 text-sm text-muted">اعلان، پیامک و پشتیبانی کاربران</p>
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
                <p className="mt-2 text-lg font-bold">{l.count.toLocaleString("fa-IR")}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
