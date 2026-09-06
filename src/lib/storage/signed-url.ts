import crypto from "crypto";
import { env } from "@/lib/env";

interface DownloadTokenPayload {
  userId: string;
  productId: string;
  jti: string; // unique per issuance, recorded on Download.lastToken for audit
  exp: number; // unix seconds
}

function sign(data: string): string {
  return crypto.createHmac("sha256", env.DOWNLOAD_SIGNING_SECRET).update(data).digest("hex");
}

// Produces a compact, tamper-evident, time-limited token — NOT a direct
// storage path. The download route re-derives the file from productId
// server-side and re-checks the Download permission row on every request,
// so this token alone (even if leaked before it expires) cannot be used to
// enumerate or fetch any file other than the one it was minted for.
export function createDownloadToken(input: {
  userId: string;
  productId: string;
  ttlSeconds?: number;
}): { token: string; jti: string; expiresAt: Date } {
  const jti = crypto.randomBytes(12).toString("hex");
  const exp = Math.floor(Date.now() / 1000) + (input.ttlSeconds ?? Number(env.DOWNLOAD_URL_TTL_SECONDS));
  const payload: DownloadTokenPayload = { userId: input.userId, productId: input.productId, jti, exp };
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString("base64url");
  const signature = sign(encoded);
  return { token: `${encoded}.${signature}`, jti, expiresAt: new Date(exp * 1000) };
}

export function verifyDownloadToken(token: string): DownloadTokenPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  if (expected.length !== signature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as DownloadTokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
