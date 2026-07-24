interface RateLimitStore {
  timestamps: number[]
}

const rateLimitMap = new Map<string, RateLimitStore>()

// Clean up stale entries every 5 minutes to prevent memory leaks
if (typeof globalThis !== 'undefined') {
  const globalAny = globalThis as any
  if (!globalAny.__rateLimitCleanerSet) {
    globalAny.__rateLimitCleanerSet = true
    setInterval(() => {
      const now = Date.now()
      for (const [key, store] of rateLimitMap.entries()) {
        const validTimestamps = store.timestamps.filter(ts => now - ts < 60000)
        if (validTimestamps.length === 0) {
          rateLimitMap.delete(key)
        } else {
          store.timestamps = validTimestamps
        }
      }
    }, 300000) // 5 minutes
  }
}

export function getClientIp(request: Request): string {
  // If it's a NextRequest, it might have an ip property
  if ('ip' in request && (request as any).ip) {
    return (request as any).ip
  }

  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }

  const xRealIp = request.headers.get('x-real-ip')
  if (xRealIp) {
    return xRealIp
  }

  return '127.0.0.1' // fallback
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now()
  const store = rateLimitMap.get(key) || { timestamps: [] }

  // Filter out expired timestamps
  const validTimestamps = store.timestamps.filter(ts => now - ts < windowMs)

  if (validTimestamps.length >= limit) {
    const oldestTimestamp = validTimestamps[0]
    const reset = oldestTimestamp + windowMs
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    }
  }

  validTimestamps.push(now)
  rateLimitMap.set(key, { timestamps: validTimestamps })

  return {
    success: true,
    limit,
    remaining: limit - validTimestamps.length,
    reset: now + windowMs,
  }
}
