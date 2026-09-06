import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DownloadButton } from "@/components/shop/download-button";
import { formatToman } from "@/lib/utils";

export const metadata: Metadata = { title: "جزئیات سفارش" };

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}

export default async function OrderDetailPage({ params, searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { paid } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payments: { orderBy: { createdAt: "desc" } }, coupon: true },
  });

  if (!order || order.userId !== user.id) notFound();

  const downloads = await prisma.download.findMany({
    where: { userId: user.id, productId: { in: order.items.map((i) => i.productId) } },
  });
  const downloadableProductIds = new Set(downloads.map((d) => d.productId));

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {paid === "1" && (
        <div className="mb-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          پرداخت با موفقیت انجام شد.
        </div>
      )}
      {paid === "0" && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          پرداخت ناموفق بود. در صورت کسر وجه، مبلغ ظرف ۷۲ ساعت بازمی‌گردد.
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">سفارش {order.orderNumber}</h1>
        <Badge>{order.status}</Badge>
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 text-lg font-semibold">اقلام سفارش</h2>
        <div className="flex flex-col gap-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {item.title} × {item.quantity}
                </p>
                <p className="text-xs text-muted">{formatToman(item.total.toString())}</p>
              </div>
              {order.status === "COMPLETED" && downloadableProductIds.has(item.productId) && (
                <DownloadButton productId={item.productId} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">جمع جزء</span>
            <span>{formatToman(order.subtotal.toString())}</span>
          </div>
          {Number(order.discountTotal) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">تخفیف {order.coupon ? `(${order.coupon.code})` : ""}</span>
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
          <h2 className="mb-4 text-lg font-semibold">پرداخت‌ها</h2>
          <div className="flex flex-col gap-2 text-sm">
            {order.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span>{p.provider}</span>
                <span className="text-muted">{p.status}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
