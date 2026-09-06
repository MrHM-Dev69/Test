import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";

// Security headers + CSP applied to every response, plus a CSRF gate for
// state-changing API requests. Runs at the edge before any route handler.

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_EXEMPT_PREFIXES = [
  "/api/shop/payments/webhook", // signed by the payment gateway, not the browser
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/otp",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    STATE_CHANGING_METHODS.has(request.method) &&
    pathname.startsWith("/api/") &&
    !CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    const csrfCookie = request.cookies.get("__csrf")?.value;
    const csrfHeader = request.headers.get("x-csrf-token");
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
  }

  const response = NextResponse.next();

  // Ensure the CSRF cookie exists for every navigation. Cookies can only be
  // written from middleware/proxy, Route Handlers, or Server Actions — never
  // from a plain Server Component render — so this is the one place that
  // guarantees every page has it, rather than each page trying (and failing)
  // to set it itself.
  if (!request.cookies.get("__csrf")?.value) {
    response.cookies.set("__csrf", crypto.randomBytes(24).toString("hex"), {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  }

  response.headers.set("Content-Security-Policy", CSP);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
