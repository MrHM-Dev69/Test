import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActivePaymentProvider } from "@/lib/payments";
import { fulfillOrder } from "@/lib/shop/fulfillment";
import { logAuditEvent } from "@/lib/audit";
import { env } from "@/lib/env";

// GET because payment gateways redirect the customer's browser back here
// with a plain GET request carrying their own query params (Authority,
// Status, trans_id, ...). We never trust these values for the actual
// payment decision — they are only handed to provider.verify(), which
// makes its own signed server-to-server call to the gateway.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  const paymentId = url.searchParams.get("paymentId");

  if (!orderId || !paymentId) {
    return NextResponse.redirect(`${env.APP_URL}/shop`);
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!payment || !order || payment.orderId !== order.id) {
    return NextResponse.redirect(`${env.APP_URL}/shop`);
  }

  // Idempotency guard: already verified/fulfilled, don't re-verify with the gateway.
  if (payment.status === "VERIFIED") {
    return NextResponse.redirect(`${env.APP_URL}/shop/orders/${order.id}?paid=1`, 303);
  }

  const callbackParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    callbackParams[key] = value;
  });

  const provider = getActivePaymentProvider();
  const amountRial = Number(payment.amount) * 10;

  try {
    const result = await provider.verify({
      authority: payment.authority ?? callbackParams.Authority ?? callbackParams.authority ?? "",
      amountRial,
      callbackParams,
    });

    if (result.ok) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "VERIFIED",
          refId: result.refId,
          rawResponse: result.raw as object,
          verifiedAt: new Date(),
        },
      });
      await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });
      await fulfillOrder(order.id);

      await logAuditEvent({
        userId: order.userId,
        action: "payment.verified",
        entity: "Payment",
        entityId: payment.id,
        metadata: { orderId: order.id, refId: result.refId },
      });

      return NextResponse.redirect(`${env.APP_URL}/shop/orders/${order.id}?paid=1`, 303);
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", rawResponse: result.raw as object },
    });
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });

    await logAuditEvent({
      userId: order.userId,
      action: "payment.failed",
      entity: "Payment",
      entityId: payment.id,
      metadata: { orderId: order.id, errorCode: result.errorCode },
    });

    return NextResponse.redirect(`${env.APP_URL}/shop/orders/${order.id}?paid=0`, 303);
  } catch {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return NextResponse.redirect(`${env.APP_URL}/shop/orders/${order.id}?paid=0`, 303);
  }
}
