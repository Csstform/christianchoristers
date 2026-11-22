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

/**
 * Resolve a rate-limit key from request headers.
 *
 * Prefer Cloudflare's `CF-Connecting-IP` (set by CF, not client-spoofable at
 * the edge), then a reverse-proxy `X-Real-IP`. Only fall back to
 * `X-Forwarded-For` using the *last* hop — proxies append, so the leftmost
 * value is attacker-controlled when the client sends the header themselves.
 */
export function clientKeyFromHeaders(
  headers: Headers | { get(name: string): string | null },
  fallback = "unknown",
): string {
  const cfConnecting = headers.get("cf-connecting-ip")?.trim();
  if (cfConnecting) return cfConnecting;

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }

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
