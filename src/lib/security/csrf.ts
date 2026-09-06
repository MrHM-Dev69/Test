import crypto from "crypto";
import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = "__csrf";

// Double-submit-cookie pattern: a random token is set as a readable cookie
// and the client must echo it back in a request header on every
// state-changing request. Because our session cookie is httpOnly and
// SameSite=Lax, this is defense-in-depth against CSRF from third-party
// origins that can trigger simple form posts.
export async function ensureCsrfCookie(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  if (existing) return existing;

  const token = crypto.randomBytes(24).toString("hex");
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return token;
}

export async function verifyCsrf(headerToken: string | null): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== headerToken.length) return false;
  return crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
}

export const CSRF_HEADER_NAME = "x-csrf-token";
export { CSRF_COOKIE_NAME };
