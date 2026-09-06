import { notFound, redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { Forbidden } from "@/app/admin/_components/forbidden";
import { Card } from "@/components/ui/card";
import { OrderStatusControl, RefundForm } from "@/components/admin/shop/order-actions";
import { formatToman } from "@/lib/utils";

export const metadata = { title: "جزئیات سفارش" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageShop(user.role as RoleName)) return <Forbidden label="سفارش‌ها" />;

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true, items: true, payments: true, refunds: true, coupon: true },
  });
  if (!order) notFound();

  const alreadyRefunded = order.refunds.reduce((sum, r) => sum + Number(r.amount), 0);
  const refundable = Math.max(0, Number(order.total) - alreadyRefunded);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">سفارش {order.orderNumber}</h1>
        <OrderStatusControl orderId={order.id} currentStatus={order.status} />
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">مشتری</h2>
        <p className="text-sm">{order.user.name ?? "—"}</p>
        <p className="text-sm text-muted">{order.user.email ?? order.user.phone}</p>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">اقلام</h2>
        <div className="flex flex-col gap-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.title} × {item.quantity}
              </span>
              <span className="text-muted">{formatToman(item.total.toString())}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span>جمع جزء</span>
            <span>{formatToman(order.subtotal.toString())}</span>
          </div>
          {Number(order.discountTotal) > 0 && (
            <div className="flex justify-between">
              <span>تخفیف {order.coupon ? `(${order.coupon.code})` : ""}</span>
              <span>-{formatToman(order.discountTotal.toString())}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>مبلغ نهایی</span>
            <span className="text-accent">{formatToman(order.total.toString())}</span>
          </div>
        </div>
      </Card>

      {order.payments.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">پرداخت‌ها</h2>
          <div className="flex flex-col gap-2 text-sm">
            {order.payments.map((p) => (
              <div key={p.id} className="flex flex-col gap-0.5 border-b border-border pb-2 last:border-0">
                <div className="flex justify-between">
                  <span>{p.provider}</span>
                  <span>{p.status}</span>
                </div>
                {p.refId && <span className="text-xs text-muted">کد پیگیری: {p.refId}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {order.refunds.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">بازگشت وجه‌ها</h2>
          <div className="flex flex-col gap-2 text-sm">
            {order.refunds.map((r) => (
              <div key={r.id} className="flex justify-between">
                <span>{r.reason ?? "—"}</span>
                <span>{formatToman(r.amount.toString())}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {refundable > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">ثبت بازگشت وجه</h2>
          <RefundForm orderId={order.id} maxAmount={refundable} />
        </Card>
      )}
    </div>
  );
}
