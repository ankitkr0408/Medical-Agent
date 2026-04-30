// In-memory sliding window rate limiter — zero dependencies, zero cost
// Each bucket key = `${userId}:${route}` → tracks request timestamps

const buckets = new Map<string, number[]>()

interface RateLimitConfig {
  windowMs: number   // window size in ms
  maxRequests: number
}

// Route-specific limits — AI routes cost money, protect them hard
const LIMITS: Record<string, RateLimitConfig> = {
  analyze:      { windowMs: 60_000, maxRequests: 10 },   // 10/min per user
  consultation: { windowMs: 60_000, maxRequests: 8 },    // 8/min per user
  qa:           { windowMs: 60_000, maxRequests: 30 },   // 30/min per user
  default:      { windowMs: 60_000, maxRequests: 60 },
}

export function checkRateLimit(userId: string, route: keyof typeof LIMITS | string): {
  allowed: boolean
  remaining: number
  resetInMs: number
} {
  const config = LIMITS[route] ?? LIMITS.default
  const key = `${userId}:${route}`
  const now = Date.now()
  const windowStart = now - config.windowMs

  // Remove expired timestamps
  const existing = (buckets.get(key) ?? []).filter(ts => ts > windowStart)
  const remaining = Math.max(0, config.maxRequests - existing.length)

  if (existing.length >= config.maxRequests) {
    const resetInMs = config.windowMs - (now - existing[0])
    return { allowed: false, remaining: 0, resetInMs }
  }

  existing.push(now)
  buckets.set(key, existing)

  // Clean up old buckets every 10k entries to prevent memory leak
  if (buckets.size > 10_000) {
    for (const [k, timestamps] of buckets) {
      if (timestamps.every(ts => ts <= windowStart)) buckets.delete(k)
    }
  }

  return { allowed: true, remaining: remaining - 1, resetInMs: 0 }
}

export function rateLimitHeaders(result: ReturnType<typeof checkRateLimit>, max: number) {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Limit': String(max),
    ...(result.resetInMs > 0 && { 'Retry-After': String(Math.ceil(result.resetInMs / 1000)) }),
  }
}
