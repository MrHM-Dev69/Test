import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyDownloadToken } from "@/lib/storage/signed-url";
import { storage } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const fileId = url.searchParams.get("fileId") ?? undefined;
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const payload = verifyDownloadToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });

  const download = await prisma.download.findUnique({
    where: { userId_productId: { userId: payload.userId, productId: payload.productId } },
  });
  if (!download) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Re-check DB state at stream time too: limits/expiry may have changed
  // between token issuance and this request.
  if (download.downloadLimit !== null && download.downloadCount > download.downloadLimit) {
    return NextResponse.json({ error: "Download limit exceeded" }, { status: 403 });
  }
  if (download.expiresAt && download.expiresAt < new Date()) {
    return NextResponse.json({ error: "Download link expired" }, { status: 403 });
  }
  if (download.lastToken !== payload.jti) {
    // Token was superseded by a newer issuance — reject stale tokens.
    return NextResponse.json({ error: "Token superseded" }, { status: 403 });
  }

  const file = fileId
    ? await prisma.productFile.findFirst({ where: { id: fileId, productId: payload.productId } })
    : await prisma.productFile.findFirst({
        where: { productId: payload.productId },
        orderBy: { createdAt: "desc" },
      });

  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const bytes = await storage.getPrivateFile(file.storageKey);

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`,
      "Cache-Control": "private, no-store",
      "Content-Length": String(bytes.length),
    },
  });
}
