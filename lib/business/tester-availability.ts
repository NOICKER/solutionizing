import { differenceInHours, differenceInMinutes } from 'date-fns'
import { prisma } from '@/lib/prisma'
import {
  deleteCachedValue,
  getCachedJson,
  getCachedValue,
  setCachedJson,
  setCachedValue,
} from '@/lib/redis'

export const TESTER_ONLINE_WINDOW_MINUTES = 15
export const TESTER_AVAILABILITY_CACHE_TTL_SECONDS = 60 * 5

const TESTER_AVAILABILITY_CACHE_KEY = 'assignment:tester-availability:v1'

type CachedTesterAvailability = {
  id: string
  userId: string
  reputationScore: number
  lastActiveAt: string
}

export function isTesterOnline(lastActiveAt: Date, now = new Date()) {
  return differenceInMinutes(now, lastActiveAt) <= TESTER_ONLINE_WINDOW_MINUTES
}

export function getTesterAvailabilityScore(lastActiveAt: Date, now = new Date()) {
  const minutesSinceLastActive = Math.max(0, differenceInMinutes(now, lastActiveAt))

  if (minutesSinceLastActive <= TESTER_ONLINE_WINDOW_MINUTES) return 100

  const hoursSinceLastActive = Math.max(0, differenceInHours(now, lastActiveAt))

  if (hoursSinceLastActive <= 6) return 85
  if (hoursSinceLastActive <= 24) return 70
  if (hoursSinceLastActive <= 72) return 50
  if (hoursSinceLastActive <= 7 * 24) return 30
  return 10
}

export async function getTesterAvailabilityPool() {
  const cachedPool = await getCachedJson<CachedTesterAvailability[]>(
    TESTER_AVAILABILITY_CACHE_KEY
  )

  if (cachedPool) {
    return cachedPool.map((tester) => ({
      ...tester,
      lastActiveAt: new Date(tester.lastActiveAt),
    }))
  }

  const testers = await prisma.testerProfile.findMany({
    where: {
      isAvailable: true,
      user: {
        isSuspended: false,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      userId: true,
      reputationScore: true,
      lastActiveAt: true,
    },
  })

  await setCachedJson(
    TESTER_AVAILABILITY_CACHE_KEY,
    testers.map((tester) => ({
      ...tester,
      lastActiveAt: tester.lastActiveAt.toISOString(),
    })),
    TESTER_AVAILABILITY_CACHE_TTL_SECONDS
  )

  return testers
}

export async function invalidateTesterAvailabilityCache() {
  await deleteCachedValue(TESTER_AVAILABILITY_CACHE_KEY)
}

export async function touchTesterPresence(testerProfileId: string, now = new Date()) {
  const throttleKey = `tester:presence:${testerProfileId}`
  const recentlyTouched = await getCachedValue(throttleKey)

  if (recentlyTouched) {
    return
  }

  await prisma.testerProfile.update({
    where: { id: testerProfileId },
    data: {
      lastActiveAt: now,
    },
  })

  await setCachedValue(
    throttleKey,
    now.toISOString(),
    TESTER_AVAILABILITY_CACHE_TTL_SECONDS
  )
}
