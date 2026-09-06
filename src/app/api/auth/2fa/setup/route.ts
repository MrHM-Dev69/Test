import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-helpers";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SHOP_MANAGER", "ACADEMY_MANAGER", "ACCOUNTANT", "SUPPORT", "EDITOR"];

// Generates (but does not yet activate) a TOTP secret for the current admin
// user. Activation happens only after /2fa/verify confirms a correct code,
// so a user can't lock themselves out with a mistyped secret.
export async function POST() {
  const user = await getCurrentUser();
  if (!user || !ADMIN_ROLES.includes(user.role)) return jsonError("Forbidden", 403);

  const secret = authenticator.generateSecret();
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret, twoFactorEnabled: false } });

  const otpauth = authenticator.keyuri(user.email ?? user.phone ?? user.id, env.AUTH_ADMIN_2FA_ISSUER, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);

  return NextResponse.json({ secret, qrDataUrl });
}
