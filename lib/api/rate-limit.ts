import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { tooManyRequests } from '@/lib/api/response'

type RateLimitPolicy = 'auth-login' | 'auth-register'

type RateLimitGlobalState = typeof globalThis & {
  __solutionizingRateLimitRedis?: Redis
  __solutionizingRateLimiters?: Partial<Record<RateLimitPolicy, Ratelimit>>
  __solutionizingRateLimitWarningLogged?: boolean
}

const rateLimitConfigs: Record<
  RateLimitPolicy,
  {
    limit: number
    prefix: string
  }
> = {
  'auth-login': {
    limit: 10,
    prefix: 'rl:auth:login',
  },
  'auth-register': {
    limit: 5,
    prefix: 'rl:auth:register',
  },
}

const globalForRateLimit = globalThis as RateLimitGlobalState

function logMissingConfigWarning() {
  if (globalForRateLimit.__solutionizingRateLimitWarningLogged) {
    return
  }

  console.warn(
    '[rate-limit] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not configured. Auth rate limiting is disabled.'
  )
  globalForRateLimit.__solutionizingRateLimitWarningLogged = true
}

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    logMissingConfigWarning()
    return null
  }

  if (!globalForRateLimit.__solutionizingRateLimitRedis) {
    globalForRateLimit.__solutionizingRateLimitRedis = new Redis({ url, token })
  }

  return globalForRateLimit.__solutionizingRateLimitRedis
}

function getRateLimiter(policy: RateLimitPolicy) {
  const redis = getRedisClient()

  if (!redis) {
    return null
  }

  const existingLimiter = globalForRateLimit.__solutionizingRateLimiters?.[policy]

  if (existingLimiter) {
    return existingLimiter
  }

  const config = rateLimitConfigs[policy]
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, '1 m'),
    prefix: config.prefix,
  })

  globalForRateLimit.__solutionizingRateLimiters = {
    ...globalForRateLimit.__solutionizingRateLimiters,
    [policy]: limiter,
  }

  return limiter
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')

  if (forwardedFor) {
    const firstForwardedIp = forwardedFor.split(',')[0]?.trim()

    if (firstForwardedIp) {
      return firstForwardedIp
    }
  }

  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-vercel-forwarded-for') ??
    'unknown'
  )
}

export async function enforceRateLimit(request: Request, policy: RateLimitPolicy) {
  const limiter = getRateLimiter(policy)

  if (!limiter) {
    return null
  }

  try {
    const { pending, success } = await limiter.limit(getRequestIp(request))

    void pending.catch((error) => {
      console.error('[rate-limit] async sync failed', error)
    })

    if (!success) {
      return tooManyRequests()
    }
  } catch (error) {
    console.error('[rate-limit] failed to evaluate request', error)
  }

  return null
}
