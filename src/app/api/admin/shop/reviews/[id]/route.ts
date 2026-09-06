import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";

const schema = z.object({ isApproved: z.boolean() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const { id } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return jsonError("Not found", 404);

  await prisma.review.update({ where: { id }, data: { isApproved: parsed.data.isApproved } });

  if (parsed.data.isApproved) {
    const agg = await prisma.review.aggregate({
      where: { productId: review.productId, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.product.update({
      where: { id: review.productId },
      data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count },
    });
  }

  await logAuditEvent({
    userId: user.id,
    action: "admin.review.moderate",
    entity: "Review",
    entityId: id,
    metadata: { isApproved: parsed.data.isApproved },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const { id } = await params;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return jsonError("Not found", 404);

  await prisma.review.delete({ where: { id } });

  const agg = await prisma.review.aggregate({
    where: { productId: review.productId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: review.productId },
    data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count },
  });

  return NextResponse.json({ ok: true });
}
