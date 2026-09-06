import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({
  code: z.string().min(2).max(40).toUpperCase(),
  description: z.string().max(300).optional(),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().positive(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  minOrderTotal: z.number().min(0).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.coupon.findUnique({ where: { code: parsed.data.code } });
  if (existing) return jsonError("این کد تخفیف قبلاً وجود دارد", 409);

  const { startsAt, expiresAt, ...rest } = parsed.data;
  const coupon = await prisma.coupon.create({
    data: {
      ...rest,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    },
  });
  return NextResponse.json({ coupon }, { status: 201 });
}
