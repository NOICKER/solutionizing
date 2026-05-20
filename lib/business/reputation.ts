import type { RepTier } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const TIER_THRESHOLDS = {
  NEWCOMER: { min: 0, max: 30 },
  RELIABLE: { min: 31, max: 60 },
  TRUSTED: { min: 61, max: 80 },
  ELITE: { min: 81, max: 100 },
}

export const REP_DELTA = {
  COMPLETION: +2.0,
  RATING_5_STAR: +3.0,
  RATING_4_STAR: +1.0,
  RATING_3_STAR: 0.0,
  RATING_2_STAR: -2.0,
  RATING_1_STAR: -5.0,
  LOW_EFFORT_FLAG: -5.0,
  ABANDON: -4.0,
  TIMEOUT: -2.0,
  SHORT_TEXT_RESPONSE: -1.0,
} as const

type ReputationEvent = keyof typeof REP_DELTA

const REP_EVENT_REASONS: Record<ReputationEvent, string> = {
  COMPLETION: 'completed',
  RATING_5_STAR: 'founder rating',
  RATING_4_STAR: 'founder rating',
  RATING_3_STAR: 'founder rating',
  RATING_2_STAR: 'founder rating',
  RATING_1_STAR: 'founder rating',
  LOW_EFFORT_FLAG: 'low effort flag',
  ABANDON: 'abandoned',
  TIMEOUT: 'missed',
  SHORT_TEXT_RESPONSE: 'short response',
}

export function scoreToTier(score: number): RepTier {
  if (score <= 30) return 'NEWCOMER'
  if (score <= 60) return 'RELIABLE'
  if (score <= 80) return 'TRUSTED'
  return 'ELITE'
}

export async function updateReputation(
  testerId: string,
  event: ReputationEvent,
  options: {
    missionId?: string | null
  } = {}
): Promise<{ newScore: number; newTier: RepTier }> {
  const profile = await prisma.testerProfile.findUnique({
    where: { id: testerId },
  })

  if (!profile) {
    throw new Error('Tester not found')
  }

  const delta = REP_DELTA[event] ?? 0
  const newScore = Math.min(100, Math.max(0, profile.reputationScore + delta))
  const newTier = scoreToTier(newScore)
  const actualDelta = Math.round((newScore - profile.reputationScore) * 100)

  await prisma.$transaction(async (tx) => {
    await tx.testerProfile.update({
      where: { id: testerId },
      data: { reputationScore: newScore, reputationTier: newTier },
    })

    if (actualDelta !== 0) {
      await tx.testerRatingEvent.create({
        data: {
          testerId,
          delta: actualDelta,
          reason: REP_EVENT_REASONS[event],
          missionId: options.missionId ?? null,
        },
      })
    }
  })

  return { newScore, newTier }
}

export async function applyRatingToReputation(
  testerId: string,
  score: number,
  flaggedLowEffort: boolean,
  options: {
    missionId?: string | null
  } = {}
) {
  let event: ReputationEvent

  if (flaggedLowEffort) {
    event = 'LOW_EFFORT_FLAG'
  } else {
    const map: Record<number, ReputationEvent> = {
      5: 'RATING_5_STAR',
      4: 'RATING_4_STAR',
      3: 'RATING_3_STAR',
      2: 'RATING_2_STAR',
      1: 'RATING_1_STAR',
    }
    event = map[score] ?? 'RATING_3_STAR'
  }

  return updateReputation(testerId, event, options)
}
