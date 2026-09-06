import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({
  initialValue: z.number().positive(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const giftCards = await prisma.giftCard.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ giftCards });
}

// Issuance only — this creates a redeemable code with a balance. Redeeming
// a gift card's balance against an order total at checkout is not wired up
// yet (see report handoff note); this endpoint only mints the card.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const code = `GIFT-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
  const giftCard = await prisma.giftCard.create({
    data: {
      code,
      initialValue: parsed.data.initialValue,
      balance: parsed.data.initialValue,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
    },
  });
  return NextResponse.json({ giftCard }, { status: 201 });
}
