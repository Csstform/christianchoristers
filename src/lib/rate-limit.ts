type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory sliding window limiter (per process).
 * Suitable for a single app container; resets on restart.
 */
export function takeRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true; remaining: number } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(input.key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return { ok: true, remaining: input.limit - 1 };
  }

  if (existing.count >= input.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true, remaining: input.limit - existing.count };
}

export function clientKeyFromHeaders(
  headers: Headers | { get(name: string): string | null },
  fallback = "unknown",
): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return fallback;
}

/** Best-effort client IP for server actions (may be unavailable locally). */
export async function clientKeyFromAction(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    return clientKeyFromHeaders(h);
  } catch {
    return "local";
  }
}
