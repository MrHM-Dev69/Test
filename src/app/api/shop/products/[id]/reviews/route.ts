import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  content: z.string().trim().max(2000).optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const approved = await prisma.review.findMany({
    where: { productId: id, isApproved: true },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  let ownPending: (typeof approved)[number] | null = null;
  if (user) {
    const own = await prisma.review.findFirst({
      where: { productId: id, userId: user.id, isApproved: false },
      include: { user: { select: { name: true } } },
    });
    ownPending = own ?? null;
  }

  return NextResponse.json({ reviews: approved, ownPending });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id: productId } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return jsonError("Product not found", 404);

  const [download, completedOrderItem] = await Promise.all([
    prisma.download.findUnique({ where: { userId_productId: { userId: user.id, productId } } }),
    prisma.orderItem.findFirst({
      where: { productId, order: { userId: user.id, status: "COMPLETED" } },
    }),
  ]);

  if (!download && !completedOrderItem) {
    return jsonError("برای ثبت نظر باید این محصول را خریداری یا دانلود کرده باشید", 403);
  }

  const existing = await prisma.review.findFirst({ where: { productId, userId: user.id } });
  if (existing) {
    return jsonError("شما قبلاً برای این محصول نظر ثبت کرده‌اید", 409);
  }

  const review = await prisma.review.create({
    data: {
      productId,
      userId: user.id,
      rating: parsed.data.rating,
      title: parsed.data.title,
      content: parsed.data.content,
      isApproved: false,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
