"use client";

// Client-side helper: reads the __csrf cookie (set server-side via
// ensureCsrfCookie()) so components can attach it as the x-csrf-token
// header on mutating fetches, satisfying the check in src/middleware.ts.
export function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|; )__csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function csrfFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("x-csrf-token", getCsrfToken());
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, { ...init, headers, credentials: "same-origin" });
}
