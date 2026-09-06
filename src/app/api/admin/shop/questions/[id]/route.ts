import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageShop } from "@/lib/auth/shop-permissions";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";

const schema = z.object({ answer: z.string().min(1).max(2000) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShop(user.role as RoleName)) return jsonError("Forbidden", 403);
  const { id } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  await prisma.question.update({
    where: { id },
    data: { answer: parsed.data.answer, answeredAt: new Date() },
  });

  await logAuditEvent({ userId: user.id, action: "admin.question.answer", entity: "Question", entityId: id });

  return NextResponse.json({ ok: true });
}
