import { Redis as UpstashRedis } from '@upstash/redis'
import IORedis from 'ioredis'

type RedisGlobalState = {
  redis?: IORedis
  upstashRedis?: UpstashRedis
  localLocks?: Map<string, number>
  localCache?: Map<string, { value: string; expiresAt: number }>
  loggedInlineQueueWarning?: boolean
}

const globalForRedis = global as unknown as RedisGlobalState
const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashRedisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN

const REDIS_URL_CANDIDATES = [
  process.env.BULLMQ_REDIS_URL,
  process.env.REDIS_URL,
  process.env.UPSTASH_REDIS_REDIS_URL,
  process.env.UPSTASH_REDIS_URL,
  process.env.UPSTASH_REDIS_REST_URL,
]

function resolveRedisUrl() {
  for (const candidate of REDIS_URL_CANDIDATES) {
    if (!candidate) {
      continue
    }

    if (candidate.startsWith('redis://') || candidate.startsWith('rediss://')) {
      return candidate
    }
  }

  return null
}

const redisUrl = resolveRedisUrl()
const localLocks = globalForRedis.localLocks ?? new Map<string, number>()
const localCache = globalForRedis.localCache ?? new Map<string, { value: string; expiresAt: number }>()

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.localLocks = localLocks
  globalForRedis.localCache = localCache
}

export const isRedisConfigured = redisUrl !== null

function getUpstashRedisConnection() {
  if (!upstashRedisRestUrl || !upstashRedisRestToken) {
    return null
  }

  if (!globalForRedis.upstashRedis) {
    globalForRedis.upstashRedis = new UpstashRedis({
      url: upstashRedisRestUrl,
      token: upstashRedisRestToken,
    })
  }

  return globalForRedis.upstashRedis
}

export function requireRedisConnection() {
  if (!redisUrl) {
    throw new Error(
      'BullMQ requires a Redis TCP URL. Set BULLMQ_REDIS_URL or REDIS_URL to a redis:// or rediss:// value.'
    )
  }

  if (!globalForRedis.redis) {
    globalForRedis.redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      ...(redisUrl.startsWith('rediss://')
        ? {
            tls: { rejectUnauthorized: false },
          }
        : {}),
    })
  }

  return globalForRedis.redis
}

export async function closeRedisConnection() {
  if (!globalForRedis.redis) {
    return
  }

  await globalForRedis.redis.quit()
  delete globalForRedis.redis
}

function getLocalLockExpiry(key: string) {
  const expiry = localLocks.get(key)

  if (expiry && expiry <= Date.now()) {
    localLocks.delete(key)
    return undefined
  }

  return expiry
}

function getLocalCacheEntry(key: string) {
  const entry = localCache.get(key)

  if (entry && entry.expiresAt <= Date.now()) {
    localCache.delete(key)
    return undefined
  }

  return entry
}

export async function acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
  const upstashRedis = getUpstashRedisConnection()

  if (upstashRedis) {
    const result = await upstashRedis.set(key, 'LOCKED', { ex: ttlSeconds, nx: true })
    return result === 'OK'
  }

  if (getLocalLockExpiry(key)) {
    return false
  }

  localLocks.set(key, Date.now() + ttlSeconds * 1000)
  return true
}

export async function releaseLock(key: string): Promise<void> {
  const upstashRedis = getUpstashRedisConnection()

  if (upstashRedis) {
    await upstashRedis.del(key)
    return
  }

  localLocks.delete(key)
}

export async function getCachedValue(key: string): Promise<string | null> {
  const upstashRedis = getUpstashRedisConnection()

  if (upstashRedis) {
    const value = await upstashRedis.get<string | null>(key)
    return value ?? null
  }

  if (redisUrl) {
    const redis = requireRedisConnection()
    await redis.connect().catch(() => undefined)
    const value = await redis.get(key)
    return value ?? null
  }

  return getLocalCacheEntry(key)?.value ?? null
}

export async function setCachedValue(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  const upstashRedis = getUpstashRedisConnection()

  if (upstashRedis) {
    await upstashRedis.set(key, value, { ex: ttlSeconds })
    return
  }

  if (redisUrl) {
    const redis = requireRedisConnection()
    await redis.connect().catch(() => undefined)
    await redis.set(key, value, 'EX', ttlSeconds)
    return
  }

  localCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
}

export async function deleteCachedValue(key: string): Promise<void> {
  const upstashRedis = getUpstashRedisConnection()

  if (upstashRedis) {
    await upstashRedis.del(key)
    return
  }

  if (redisUrl) {
    const redis = requireRedisConnection()
    await redis.connect().catch(() => undefined)
    await redis.del(key)
    return
  }

  localCache.delete(key)
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const value = await getCachedValue(key)

  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    await deleteCachedValue(key)
    return null
  }
}

export async function setCachedJson(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  await setCachedValue(key, JSON.stringify(value), ttlSeconds)
}

export function logInlineQueueWarning() {
  if (globalForRedis.loggedInlineQueueWarning) {
    return
  }

  console.warn(
    '[Queue] Redis is not configured. Background jobs will run inline in the request process.'
  )
  globalForRedis.loggedInlineQueueWarning = true
}
