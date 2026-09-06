import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatToman } from "@/lib/utils";

export const metadata: Metadata = { title: "سفارش‌های من" };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "در انتظار",
  AWAITING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  PROCESSING: "در حال پردازش",
  COMPLETED: "تکمیل‌شده",
  CANCELLED: "لغوشده",
  REFUNDED: "بازگشت‌داده‌شده",
  FAILED: "ناموفق",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  PENDING: "secondary",
  AWAITING_PAYMENT: "warning",
  PAID: "success",
  PROCESSING: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
  FAILED: "destructive",
};

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">سفارش‌های من</h1>
      {orders.length === 0 ? (
        <p className="text-muted">سفارشی ثبت نشده است.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/shop/orders/${order.id}`}>
              <Card className="flex items-center justify-between transition-colors hover:border-accent/40">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="mt-1 text-xs text-muted">
                    {order.items.length} قلم — {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-accent">{formatToman(order.total.toString())}</span>
                  <Badge variant={STATUS_VARIANTS[order.status] ?? "secondary"}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
