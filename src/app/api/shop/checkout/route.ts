import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { logAuditEvent } from "@/lib/audit";
import { getActivePaymentProvider } from "@/lib/payments";
import { fulfillOrder } from "@/lib/shop/fulfillment";
import { env } from "@/lib/env";

const schema = z.object({ couponCode: z.string().trim().max(64).optional() });

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${stamp}-${rand}`;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const rl = checkRateLimit(`checkout:${user.id}`, RATE_LIMITS.paymentInitiate.limit, RATE_LIMITS.paymentInitiate.windowSeconds);
  if (!rl.allowed) return jsonError("درخواست‌های زیادی ارسال شده است. کمی بعد تلاش کنید.", 429);

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { couponCode } = parsed.data;

  const cart = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });
  if (!cart || cart.items.length === 0) return jsonError("سبد خرید خالی است", 400);

  const products = await prisma.product.findMany({
    where: { id: { in: cart.items.map((i) => i.productId) } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of cart.items) {
    const product = productMap.get(item.productId);
    if (!product || !product.isPublished) {
      return jsonError("یکی از محصولات سبد خرید دیگر در دسترس نیست", 400);
    }
  }

  const orderItemsData = cart.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const unitPrice = Number(product.salePrice ?? product.price);
    return {
      productId: product.id,
      title: product.title,
      unitPrice,
      quantity: item.quantity,
      total: unitPrice * item.quantity,
    };
  });

  const subtotal = orderItemsData.reduce((sum, i) => sum + i.total, 0);

  let discountTotal = 0;
  let couponId: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    const now = new Date();
    if (
      !coupon ||
      !coupon.isActive ||
      (coupon.startsAt && coupon.startsAt > now) ||
      (coupon.expiresAt && coupon.expiresAt < now) ||
      (coupon.maxRedemptions !== null && coupon.redeemedCount >= coupon.maxRedemptions) ||
      (coupon.minOrderTotal && subtotal < Number(coupon.minOrderTotal))
    ) {
      return jsonError("کد تخفیف نامعتبر یا منقضی شده است", 400);
    }
    couponId = coupon.id;
    discountTotal =
      coupon.discountType === "PERCENT"
        ? Math.round((subtotal * Number(coupon.discountValue)) / 100)
        : Math.min(subtotal, Number(coupon.discountValue));
  }

  const total = Math.max(0, subtotal - discountTotal);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.id,
        status: "PENDING",
        subtotal,
        discountTotal,
        total,
        couponId: couponId ?? undefined,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    if (couponId) {
      await tx.coupon.update({ where: { id: couponId }, data: { redeemedCount: { increment: 1 } } });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  await logAuditEvent({
    userId: user.id,
    action: "checkout.order_created",
    entity: "Order",
    entityId: order.id,
    metadata: { total, subtotal, discountTotal },
  });

  // Free order (all items free, or coupon covers full amount): fulfill immediately, no gateway involved.
  if (total === 0) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });
    await fulfillOrder(order.id);
    return NextResponse.json({ redirectUrl: `/shop/orders/${order.id}?paid=1` });
  }

  await prisma.order.update({ where: { id: order.id }, data: { status: "AWAITING_PAYMENT" } });

  const provider = getActivePaymentProvider();
  const providerNameMap: Record<string, "ZARINPAL" | "IDPAY" | "NEXTPAY" | "CUSTOM_GATEWAY" | "WALLET"> = {
    ZARINPAL: "ZARINPAL",
    IDPAY: "IDPAY",
    NEXTPAY: "NEXTPAY",
    CUSTOM_GATEWAY: "CUSTOM_GATEWAY",
  };
  const providerEnum = providerNameMap[provider.name] ?? "CUSTOM_GATEWAY";

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: providerEnum,
      status: "INITIATED",
      amount: total,
    },
  });

  try {
    const amountRial = total * 10;
    const initiated = await provider.initiate({
      orderId: order.id,
      amountRial,
      description: `پرداخت سفارش ${order.orderNumber}`,
      callbackUrl: `${env.APP_URL}/api/shop/payments/callback?orderId=${order.id}&paymentId=${payment.id}`,
      payerName: user.name ?? undefined,
      payerEmail: user.email ?? undefined,
      payerPhone: user.phone ?? undefined,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { authority: initiated.authority, status: "PENDING_VERIFICATION" },
    });

    return NextResponse.json({ redirectUrl: initiated.redirectUrl });
  } catch (err) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    const message = err instanceof Error ? err.message : "خطا در اتصال به درگاه پرداخت";
    return jsonError(message, 502);
  }
}
