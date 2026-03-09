import type { RepTier } from '@prisma/client'
import { prisma } from '@/lib/prisma'
// Score boundaries for tiers
export const TIER_THRESHOLDS = {
  NEWCOMER: { min: 0,  max: 30  },
  RELIABLE: { min: 31, max: 60  },
  TRUSTED:  { min: 61, max: 80  },
  ELITE:    { min: 81, max: 100 },
}
// Score deltas for every event type
export const REP_DELTA: Record<string, number> = {
  COMPLETION:          +2.0,
  RATING_5_STAR:       +3.0,
  RATING_4_STAR:       +1.0,
  RATING_3_STAR:        0.0,
  RATING_2_STAR:       -2.0,
  RATING_1_STAR:       -5.0,
  LOW_EFFORT_FLAG:     -5.0,
  ABANDON:             -4.0,
  TIMEOUT:             -2.0,
  SHORT_TEXT_RESPONSE: -1.0,
}
// Compute new tier from score
export function scoreToTier(score: number): RepTier {
  if (score <= 30) return 'NEWCOMER'
  if (score <= 60) return 'RELIABLE'
  if (score <= 80) return 'TRUSTED'
  return 'ELITE'
}
// Apply reputation update — call after any reputation event
export async function updateReputation(
  testerId: string,
  event: keyof typeof REP_DELTA
): Promise<{ newScore: number; newTier: RepTier }> {
  const profile = await prisma.testerProfile.findUnique({
    where: { id: testerId }
  })
  if (!profile) throw new Error('Tester not found')
  const delta = REP_DELTA[event] ?? 0
  // Clamp score to 0–100
  const newScore = Math.min(100, Math.max(0, profile.reputationScore + delta))
  const newTier = scoreToTier(newScore)
  await prisma.testerProfile.update({
    where: { id: testerId },
    data: { reputationScore: newScore, reputationTier: newTier }
  })
  return { newScore, newTier }
}
// Apply rating from founder — called after TesterRating is created
export async function applyRatingToReputation(
  testerId: string,
  score: number,
  flaggedLowEffort: boolean
) {
  let event: string
  if (flaggedLowEffort) {
    event = 'LOW_EFFORT_FLAG'
  } else {
    const map: Record<number,string> = {
      5:'RATING_5_STAR', 4:'RATING_4_STAR',
      3:'RATING_3_STAR', 2:'RATING_2_STAR', 1:'RATING_1_STAR'
    }
    event = map[score] ?? 'RATING_3_STAR'
  }
  return updateReputation(testerId, event)
}
