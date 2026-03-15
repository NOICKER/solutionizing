import IORedis from 'ioredis'

type RedisGlobalState = {
  redis?: IORedis
  localLocks?: Map<string, number>
  loggedInlineQueueWarning?: boolean
}

const globalForRedis = global as unknown as RedisGlobalState

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

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.localLocks = localLocks
}

export const isRedisConfigured = redisUrl !== null

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

export async function acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
  if (isRedisConfigured) {
    const result = await requireRedisConnection().set(key, 'LOCKED', 'EX', ttlSeconds, 'NX')
    return result === 'OK'
  }

  if (getLocalLockExpiry(key)) {
    return false
  }

  localLocks.set(key, Date.now() + ttlSeconds * 1000)
  return true
}

export async function releaseLock(key: string): Promise<void> {
  if (isRedisConfigured) {
    await requireRedisConnection().del(key)
    return
  }

  localLocks.delete(key)
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
