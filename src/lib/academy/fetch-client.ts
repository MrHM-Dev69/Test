"use client";

// Small client-side fetch helper that attaches the CSRF header required by
// middleware.ts for every mutating /api/* request. The token itself lives
// in a non-httpOnly cookie set by ensureCsrfCookie() in the layout.
function readCsrfCookie(): string | null {
  const match = document.cookie.match(/(?:^|; )__csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiRequest(
  input: string,
  init: { method: "POST" | "PATCH" | "DELETE" | "PUT"; body?: unknown },
) {
  const csrf = readCsrfCookie();
  const res = await fetch(input, {
    method: init.method,
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "x-csrf-token": csrf } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
