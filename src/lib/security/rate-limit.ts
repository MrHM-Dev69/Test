// In-process sliding-window rate limiter.
//
// Honest limitation: this state lives in a single Node process's memory.
// It works correctly for a single-instance deployment (the common case for
// a personal-brand site) but does NOT share state across multiple server
// instances/containers. For a horizontally-scaled production deployment,
// swap the Map below for a Redis-backed store (e.g. Upstash) behind this
// same `checkRateLimit` function signature — nothing above this module
// needs to change.

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Periodically drop stale buckets so memory doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > 10 * 60_000) buckets.delete(key);
  }
}, 5 * 60_000).unref?.();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.ceil((bucket.windowStart + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

// Common named limits used across auth/payment endpoints.
export const RATE_LIMITS = {
  otpRequest: { limit: 5, windowSeconds: 60 * 10 },
  loginAttempt: { limit: 10, windowSeconds: 60 * 15 },
  passwordReset: { limit: 5, windowSeconds: 60 * 60 },
  paymentInitiate: { limit: 10, windowSeconds: 60 * 10 },
  downloadIssue: { limit: 30, windowSeconds: 60 * 10 },
  apiDefault: { limit: 120, windowSeconds: 60 },
  contactForm: { limit: 5, windowSeconds: 60 * 10 },
} as const;
