import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActivePaymentProvider } from "@/lib/payments";
import { fulfillOrder } from "@/lib/shop/fulfillment";
import { logAuditEvent } from "@/lib/audit";

// Async server-to-server webhook some gateways send in addition to the
// browser redirect callback. Must verify the signature before trusting
// anything in the body, and must be idempotent since gateways retry.
//
// NOTE: this route is not on the CSRF-exempt prefix list in src/middleware.ts
// (only "/api/payments/webhook" is exempt there, not "/api/shop/payments/webhook").
// Gateways cannot supply our CSRF cookie/header, so as currently configured
// this route will be rejected by the CSRF gate before it ever runs. This
// needs a one-line addition to CSRF_EXEMPT_PREFIXES in middleware.ts by
// whoever owns that file — flagged in the handoff report, not fixed here
// since middleware.ts is out of scope for this agent.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader =
    request.headers.get("x-sandbox-signature") ??
    request.headers.get("x-zarinpal-signature") ??
    request.headers.get("x-idpay-signature") ??
    request.headers.get("x-signature");

  const provider = getActivePaymentProvider();

  let signatureValid = false;
  try {
    signatureValid = provider.verifyWebhookSignature(rawBody, signatureHeader);
  } catch {
    signatureValid = false;
  }
  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId : undefined;
  const paymentId = typeof body.paymentId === "string" ? body.paymentId : undefined;
  const authority =
    (typeof body.authority === "string" && body.authority) ||
    (typeof body.Authority === "string" && body.Authority) ||
    undefined;

  const payment = paymentId
    ? await prisma.payment.findUnique({ where: { id: paymentId } })
    : authority
      ? await prisma.payment.findFirst({ where: { authority } })
      : null;

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Idempotency guard: already verified, ack without re-processing.
  if (payment.status === "VERIFIED") {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId ?? payment.orderId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const callbackParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") callbackParams[key] = value;
  }

  try {
    const result = await provider.verify({
      authority: payment.authority ?? authority ?? "",
      amountRial: Number(payment.amount) * 10,
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
          webhookVerified: true,
        },
      });
      await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });
      await fulfillOrder(order.id);

      await logAuditEvent({
        userId: order.userId,
        action: "payment.webhook_verified",
        entity: "Payment",
        entityId: payment.id,
        metadata: { orderId: order.id },
      });

      return NextResponse.json({ ok: true });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", rawResponse: result.raw as object },
    });
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return NextResponse.json({ ok: false });
  } catch {
    return NextResponse.json({ error: "Verification error" }, { status: 500 });
  }
}
