import { NextRequest, NextResponse } from "next/server";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { jsonError } from "@/lib/api-helpers";
import { validateUpload } from "@/lib/uploads/validate";
import { storage } from "@/lib/storage";
import { logAuditEvent } from "@/lib/audit";

// Multipart upload of a downloadable product file. Never exposes storageKey
// in the response — only metadata safe to show admins.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const { id: productId } = await params;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return jsonError("Product not found", 404);

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError("Invalid form data", 400);

  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("فایلی ارسال نشده است", 400);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const validation = validateUpload({
    category: "archive",
    originalName: file.name,
    sizeBytes: buffer.length,
    buffer,
  });
  if (!validation.ok || !validation.safeFileName) {
    return jsonError(validation.error ?? "فایل نامعتبر است", 422);
  }

  const storageKey = `products/${productId}/${validation.safeFileName}`;
  await storage.putPrivateFile(storageKey, buffer, file.type || "application/octet-stream");

  const productFile = await prisma.productFile.create({
    data: {
      productId,
      fileName: file.name,
      storageKey,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: BigInt(buffer.length),
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: "admin.product.file_upload",
    entity: "ProductFile",
    entityId: productFile.id,
    metadata: { productId, fileName: file.name },
  });

  return NextResponse.json({
    file: {
      id: productFile.id,
      fileName: productFile.fileName,
      mimeType: productFile.mimeType,
      sizeBytes: productFile.sizeBytes.toString(),
      createdAt: productFile.createdAt,
    },
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const { id: productId } = await params;

  const files = await prisma.productFile.findMany({ where: { productId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({
    files: files.map((f) => ({
      id: f.id,
      fileName: f.fileName,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes.toString(),
      createdAt: f.createdAt,
    })),
  });
}
