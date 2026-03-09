import IORedis from 'ioredis'
const globalForRedis = global as unknown as { redis: IORedis }
export const redis = globalForRedis.redis || new IORedis(
  process.env.UPSTASH_REDIS_REST_URL!,
  {
    password: process.env.UPSTASH_REDIS_REST_TOKEN,
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null, // Required for BullMQ
  }
)
if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
export async function acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
  const result = await redis.set(key, 'LOCKED', 'EX', ttlSeconds, 'NX')
  return result === 'OK'
}
export async function releaseLock(key: string): Promise<void> {
  await redis.del(key)
}
