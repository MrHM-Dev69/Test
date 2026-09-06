import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

const secret = new TextEncoder().encode(env.AUTH_JWT_SECRET);

export interface SessionTokenPayload {
  sub: string; // userId
  sid: string; // session id (matches Session.id in DB, for revocation checks)
  role: string;
}

export async function signSessionToken(
  payload: SessionTokenPayload,
  expiresIn: string = "30d",
): Promise<string> {
  return new SignJWT({ role: payload.role, sid: payload.sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || typeof payload.sid !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return { sub: payload.sub, sid: payload.sid, role: payload.role };
  } catch {
    return null;
  }
}
