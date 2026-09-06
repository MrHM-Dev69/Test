import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OrderStatus, type RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";
import { fulfillOrder } from "@/lib/shop/fulfillment";

const schema = z.object({ status: z.nativeEnum(OrderStatus) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const { id } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return jsonError("Not found", 404);

  await prisma.order.update({ where: { id }, data: { status: parsed.data.status } });

  // Manually marking as PAID/COMPLETED (e.g. for a WALLET/manual bank transfer
  // order) also runs the same fulfillment as an automatic gateway payment.
  if (parsed.data.status === "COMPLETED" || parsed.data.status === "PAID") {
    await fulfillOrder(id);
  }

  await logAuditEvent({
    userId: user.id,
    action: "admin.order.status_change",
    entity: "Order",
    entityId: id,
    metadata: { newStatus: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}
