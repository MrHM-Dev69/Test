import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";

const schema = z.object({
  amount: z.number().positive(),
  reason: z.string().max(500).optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const { id: orderId } = await params;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return jsonError("Not found", 404);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { amount, reason } = parsed.data;

  if (amount > Number(order.total)) {
    return jsonError("مبلغ بازگشتی نمی‌تواند بیشتر از مبلغ سفارش باشد", 400);
  }

  await prisma.$transaction([
    prisma.refund.create({
      data: { orderId, amount, reason, status: "APPROVED" },
    }),
    prisma.transaction.create({
      data: {
        type: "EXPENSE",
        category: "refund",
        amount,
        description: `بازگشت وجه سفارش ${order.orderNumber}${reason ? ` — ${reason}` : ""}`,
        referenceType: "Order",
        referenceId: orderId,
      },
    }),
    prisma.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } }),
  ]);

  await logAuditEvent({
    userId: user.id,
    action: "admin.order.refund",
    entity: "Order",
    entityId: orderId,
    metadata: { amount, reason },
  });

  return NextResponse.json({ ok: true });
}
