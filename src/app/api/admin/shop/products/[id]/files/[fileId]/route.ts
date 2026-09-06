import { NextRequest, NextResponse } from "next/server";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { jsonError } from "@/lib/api-helpers";
import { storage } from "@/lib/storage";
import { logAuditEvent } from "@/lib/audit";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const { id: productId, fileId } = await params;

  const file = await prisma.productFile.findFirst({ where: { id: fileId, productId } });
  if (!file) return jsonError("Not found", 404);

  await storage.deletePrivateFile(file.storageKey).catch(() => undefined);
  await prisma.productFile.delete({ where: { id: fileId } });

  await logAuditEvent({ userId: user.id, action: "admin.product.file_delete", entity: "ProductFile", entityId: fileId });

  return NextResponse.json({ ok: true });
}
