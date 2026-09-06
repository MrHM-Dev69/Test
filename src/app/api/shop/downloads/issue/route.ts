import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { createDownloadToken } from "@/lib/storage/signed-url";

const schema = z.object({ productId: z.string().min(1) });

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const rl = checkRateLimit(
    `download-issue:${user.id}`,
    RATE_LIMITS.downloadIssue.limit,
    RATE_LIMITS.downloadIssue.windowSeconds,
  );
  if (!rl.allowed) return jsonError("درخواست‌های زیادی ارسال شده است. کمی بعد تلاش کنید.", 429);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { productId } = parsed.data;

  const download = await prisma.download.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  if (!download) return jsonError("شما مجاز به دانلود این محصول نیستید", 404);

  if (download.downloadLimit !== null && download.downloadCount >= download.downloadLimit) {
    return jsonError("سقف تعداد دانلود این فایل به پایان رسیده است", 403);
  }
  if (download.expiresAt && download.expiresAt < new Date()) {
    return jsonError("مهلت دانلود این فایل به پایان رسیده است", 403);
  }

  const { token, jti } = createDownloadToken({ userId: user.id, productId });

  await prisma.download.update({
    where: { id: download.id },
    data: { downloadCount: { increment: 1 }, lastToken: jti },
  });

  return NextResponse.json({ url: `/api/shop/downloads/stream?token=${encodeURIComponent(token)}` });
}
