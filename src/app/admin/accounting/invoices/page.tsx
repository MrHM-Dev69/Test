import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatToman } from "@/lib/utils";
import { getAdminUser, can } from "../../_lib/guard";
import { Forbidden } from "../../_components/forbidden";
import { CreateInvoiceForm, InvoiceRowActions } from "./invoice-actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "پیش‌نویس",
  ISSUED: "صادر شده",
  PAID: "پرداخت‌شده",
  OVERDUE: "سررسید گذشته",
  CANCELLED: "لغو شده",
};

export default async function InvoicesPage() {
  const admin = await getAdminUser();
  if (!admin || !can(admin, "accounting.manage")) return <Forbidden label="حسابداری" />;

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">فاکتورها</h1>
        <p className="mt-1 text-sm text-muted">{invoices.length.toLocaleString("fa-IR")} فاکتور</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ایجاد فاکتور دستی</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateInvoiceForm />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted">
                <th className="p-3 font-medium">شماره فاکتور</th>
                <th className="p-3 font-medium">کاربر</th>
                <th className="p-3 font-medium">مبلغ</th>
                <th className="p-3 font-medium">وضعیت</th>
                <th className="p-3 font-medium">سررسید</th>
                <th className="p-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    فاکتوری ثبت نشده است.
                  </td>
                </tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50">
                  <td className="p-3">{inv.invoiceNumber}</td>
                  <td className="p-3 text-muted">{inv.user.name ?? inv.user.email ?? "—"}</td>
                  <td className="p-3">{formatToman(Number(inv.amount))}</td>
                  <td className="p-3">
                    <Badge variant={inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "destructive" : "secondary"}>
                      {STATUS_LABELS[inv.status] ?? inv.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted">{inv.dueDate ? new Intl.DateTimeFormat("fa-IR").format(inv.dueDate) : "—"}</td>
                  <td className="p-3">
                    <InvoiceRowActions invoiceId={inv.id} status={inv.status} />
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
