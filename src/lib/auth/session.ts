import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { signSessionToken, verifySessionToken } from "@/lib/auth/jwt";
import type { User, Role } from "@prisma/client";

const SESSION_TTL_DAYS = 30;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  user: Pick<User, "id">,
  role: Pick<Role, "name">,
  meta: { ipAddress?: string; userAgent?: string },
) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      expiresAt,
    },
  });

  const jwt = await signSessionToken(
    { sub: user.id, sid: session.id, role: role.name },
    `${SESSION_TTL_DAYS}d`,
  );

  const cookieStore = await cookies();
  cookieStore.set(env.AUTH_SESSION_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });

  return session;
}

export interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
}

// Resolves the caller from the session cookie, re-checking the DB session
// row so a revoked/expired session is rejected even if the JWT itself
// hasn't expired yet.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.AUTH_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { id: payload.sid },
    include: { user: { include: { role: true } } },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (!session.user.isActive) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    phone: session.user.phone,
    role: session.user.role.name,
    isActive: session.user.isActive,
    twoFactorEnabled: session.user.twoFactorEnabled,
  };
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.AUTH_SESSION_COOKIE_NAME)?.value;
  if (token) {
    const payload = await verifySessionToken(token);
    if (payload) {
      await prisma.session.update({
        where: { id: payload.sid },
        data: { revokedAt: new Date() },
      }).catch(() => undefined);
    }
  }
  cookieStore.delete(env.AUTH_SESSION_COOKIE_NAME);
}

export async function getRequestMeta() {
  const h = await headers();
  const ipAddress =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined;
  const userAgent = h.get("user-agent") ?? undefined;
  return { ipAddress, userAgent };
}
