import crypto from "crypto";
import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = "__csrf";

// Double-submit-cookie pattern: a random token is set as a readable cookie
// and the client must echo it back in a request header on every
// state-changing request. Because our session cookie is httpOnly and
// SameSite=Lax, this is defense-in-depth against CSRF from third-party
// origins that can trigger simple form posts.
//
// The cookie itself is actually written by src/proxy.ts on every request
// (cookies can only be written from middleware/proxy, a Route Handler, or a
// Server Action — never from a plain Server Component render). This helper
// is safe to call from any of those contexts: it writes the cookie when
// called from one that permits it (a Route Handler / Server Action), and
// simply reads back the value proxy.ts already set otherwise.
export async function ensureCsrfCookie(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  if (existing) return existing;

  const token = crypto.randomBytes(24).toString("hex");
  try {
    cookieStore.set(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  } catch {
    // Called from a plain Server Component render (e.g. a page/layout) —
    // proxy.ts already guarantees the cookie exists on the response, so
    // there is nothing to do here.
  }
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
