import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api-helpers";
import { createDownloadToken } from "@/lib/storage/signed-url";

// Free products: no cart/checkout/payment involved. Grants (or reuses) a
// Download row immediately and mints a signed one-time download URL.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || !product.isPublished) return jsonError("Product not found", 404);
  if (!product.isFree) return jsonError("این محصول رایگان نیست", 400);

  const download = await prisma.download.upsert({
    where: { userId_productId: { userId: user.id, productId: product.id } },
    update: {},
    create: {
      userId: user.id,
      productId: product.id,
      downloadLimit: product.downloadLimit,
      expiresAt: product.downloadExpiryDays
        ? new Date(Date.now() + product.downloadExpiryDays * 24 * 60 * 60 * 1000)
        : null,
    },
  });

  if (download.downloadLimit !== null && download.downloadCount >= download.downloadLimit) {
    return jsonError("سقف تعداد دانلود این فایل به پایان رسیده است", 403);
  }
  if (download.expiresAt && download.expiresAt < new Date()) {
    return jsonError("مهلت دانلود این فایل به پایان رسیده است", 403);
  }

  const { token, jti } = createDownloadToken({ userId: user.id, productId: product.id });
  await prisma.download.update({
    where: { id: download.id },
    data: { downloadCount: { increment: 1 }, lastToken: jti },
  });

  return NextResponse.json({ url: `/api/shop/downloads/stream?token=${encodeURIComponent(token)}` });
}
