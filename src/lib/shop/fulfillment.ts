import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplates } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { formatToman } from "@/lib/utils";
import { env } from "@/lib/env";

/**
 * Fulfills a PAID order: creates Download + License rows for each item,
 * marks the order COMPLETED, logs a revenue Transaction, and notifies the
 * user (in-app + email + SMS). Idempotent — safe to call more than once for
 * the same order (e.g. once from the redirect callback, once from an async
 * webhook) because it only ever creates rows that don't already exist.
 */
export async function fulfillOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, user: true },
  });
  if (!order) return;

  // Already fulfilled — nothing further to do.
  if (order.status === "COMPLETED") return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.download.upsert({
        where: { userId_productId: { userId: order.userId, productId: item.productId } },
        update: {},
        create: {
          userId: order.userId,
          productId: item.productId,
          orderItemId: item.id,
          downloadLimit: item.product.downloadLimit,
          expiresAt: item.product.downloadExpiryDays
            ? new Date(Date.now() + item.product.downloadExpiryDays * 24 * 60 * 60 * 1000)
            : null,
        },
      });

      const existingLicense = await tx.license.findFirst({
        where: { productId: item.productId, userId: order.userId, orderId: order.id },
      });
      if (!existingLicense) {
        await tx.license.create({
          data: {
            key: crypto.randomBytes(16).toString("hex").toUpperCase(),
            productId: item.productId,
            userId: order.userId,
            orderId: order.id,
          },
        });
      }

      await tx.product.update({
        where: { id: item.productId },
        data: { salesCount: { increment: item.quantity } },
      });
    }

    const existingTx = await tx.transaction.findFirst({
      where: { referenceType: "Order", referenceId: order.id, category: "product_sale" },
    });
    if (!existingTx) {
      await tx.transaction.create({
        data: {
          type: "INCOME",
          category: "product_sale",
          amount: order.total,
          description: `فروش سفارش ${order.orderNumber}`,
          referenceType: "Order",
          referenceId: order.id,
        },
      });
    }

    await tx.order.update({ where: { id: order.id }, data: { status: "COMPLETED" } });
  });

  await prisma.notification.create({
    data: {
      userId: order.userId,
      title: "سفارش شما تکمیل شد",
      body: `سفارش ${order.orderNumber} با موفقیت پرداخت و تکمیل شد. اکنون می‌توانید فایل‌ها را دانلود کنید.`,
      link: `/shop/orders/${order.id}`,
    },
  });

  if (order.user.email) {
    await sendEmail({
      toEmail: order.user.email,
      subject: `تایید سفارش ${order.orderNumber}`,
      html: emailTemplates.orderConfirmation(order.orderNumber, formatToman(order.total.toString())),
      templateKey: "orderConfirmation",
    });
    await sendEmail({
      toEmail: order.user.email,
      subject: `تایید پرداخت ${order.orderNumber}`,
      html: emailTemplates.paymentConfirmation(order.orderNumber),
      templateKey: "paymentConfirmation",
    });
    for (const item of order.items) {
      await sendEmail({
        toEmail: order.user.email,
        subject: `${item.title} آماده دانلود است`,
        html: emailTemplates.downloadReady(item.title, `${env.APP_URL}/shop/downloads`),
        templateKey: "downloadReady",
      });
    }
  }

  if (order.user.phone) {
    await sendSms({
      toPhone: order.user.phone,
      templateKey: "paymentConfirmation",
      body: `سفارش ${order.orderNumber} با موفقیت پرداخت شد.`,
    });
  }
}
