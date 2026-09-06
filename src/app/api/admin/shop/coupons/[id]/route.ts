import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({
  description: z.string().max(300).nullable().optional(),
  discountType: z.enum(["PERCENT", "FIXED"]).optional(),
  discountValue: z.number().positive().optional(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  minOrderTotal: z.number().min(0).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const { id } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { startsAt, expiresAt, ...rest } = parsed.data;

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...rest,
      startsAt: startsAt === undefined ? undefined : startsAt ? new Date(startsAt) : null,
      expiresAt: expiresAt === undefined ? undefined : expiresAt ? new Date(expiresAt) : null,
    },
  });
  return NextResponse.json({ coupon });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const { id } = await params;
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
