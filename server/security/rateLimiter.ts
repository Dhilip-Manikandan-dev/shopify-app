interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL_MS = 60 * 1000;

// Periodic cleanup of expired rate limit entries
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (entry.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Lightweight, low-cost in-memory rate limiter for public storefront endpoints.
 * Window in seconds, max requests allowed.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = 60,
  windowSeconds = 60
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const current = rateLimitMap.get(identifier);

  if (!current || current.resetAt <= now) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetInSeconds: windowSeconds };
  }

  if (current.count >= maxRequests) {
    const resetInSeconds = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  current.count += 1;
  const remaining = maxRequests - current.count;
  const resetInSeconds = Math.ceil((current.resetAt - now) / 1000);

  return { allowed: true, remaining, resetInSeconds };
}
