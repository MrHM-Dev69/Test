import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { jsonError, zodErrorResponse } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit";

const schema = z.object({ code: z.string().length(6) });

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.twoFactorSecret) return jsonError("2FA setup has not been started.", 400);

  const valid = authenticator.verify({ token: parsed.data.code, secret: dbUser.twoFactorSecret });
  if (!valid) return jsonError("کد وارد شده نامعتبر است.", 422);

  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
  await logAuditEvent({ userId: user.id, action: "2FA_ENABLED", entity: "User", entityId: user.id });

  return NextResponse.json({ ok: true });
}
