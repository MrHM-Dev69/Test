import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminUser, can } from "../../_lib/guard";
import { Forbidden } from "../../_components/forbidden";
import { SmsTemplateManager } from "./template-manager";
import { SmsBroadcastForm } from "./broadcast-form";

export const dynamic = "force-dynamic";

export default async function SmsAdminPage() {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "communication.manage")) return <Forbidden label="پیامک" />;

  const [templates, logs] = await Promise.all([
    prisma.smsTemplate.findMany({ orderBy: { key: "asc" } }),
    prisma.smsLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">پیامک</h1>
        <p className="mt-1 text-sm text-muted">قالب‌ها، ارسال گروهی و گزارش تحویل پیامک</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ارسال گروهی پیامک</CardTitle>
        </CardHeader>
        <CardContent>
          <SmsBroadcastForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قالب‌های پیامک</CardTitle>
        </CardHeader>
        <CardContent>
          <SmsTemplateManager templates={templates} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>گزارش ارسال‌ها</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">گیرنده</th>
                <th className="p-3 font-medium">متن</th>
                <th className="p-3 font-medium">وضعیت</th>
                <th className="p-3 font-medium">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted">
                    پیامکی ارسال نشده است.
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-border/50">
                  <td className="p-3" dir="ltr">
                    {l.toPhone}
                  </td>
                  <td className="max-w-xs truncate p-3 text-muted">{l.body}</td>
                  <td className="p-3">
                    <Badge variant={l.status === "FAILED" ? "destructive" : "success"}>{l.status}</Badge>
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
    </div>
  );
}
