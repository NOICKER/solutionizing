export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, apiError, badRequest, notFound, serverError } from '@/lib/api/response'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { computeFeedback } from '@/lib/business/feedback'
import { SynthesisError, synthesizeFeedback } from '@/lib/ai/synthesize'
import { logApiRouteError } from '@/lib/api/log'
import { getCachedJson, isRedisCacheConfigured, setCachedJson } from '@/lib/redis'

const SYNTHESIS_CACHE_TTL_SECONDS = 60 * 60

type SynthesisResult = Awaited<ReturnType<typeof synthesizeFeedback>>

function getSynthesisCacheKey(missionId: string) {
  return `synthesis:${missionId}`
}

function computeHealthScore(synthesis: SynthesisResult) {
  const BASE = { HIGH: 85, MEDIUM: 60, LOW: 35 }
  const score = Math.max(0, Math.min(100,
    BASE[synthesis.signalStrength] - (synthesis.frictionPoints.length * 7)
  ))

  return score
}

function logSynthesisCacheStatus(status: 'HIT' | 'MISS', cacheKey: string) {
  if (process.env.NODE_ENV !== 'production') {
    const message =
      status === 'HIT'
        ? `[Synthesis] cache HIT: ${cacheKey}`
        : `[Synthesis] cache MISS: ${cacheKey}`
    console.log(message)
  }
}

async function readCachedSynthesis(cacheKey: string): Promise<SynthesisResult | null> {
  if (!isRedisCacheConfigured) {
    logSynthesisCacheStatus('MISS', cacheKey)
    return null
  }

  try {
    const cached = await getCachedJson<SynthesisResult>(cacheKey)
    logSynthesisCacheStatus(cached ? 'HIT' : 'MISS', cacheKey)
    return cached
  } catch (error) {
    logSynthesisCacheStatus('MISS', cacheKey)
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Synthesis] cache read failed; generating fresh synthesis.', error)
    }
    return null
  }
}

async function writeCachedSynthesis(cacheKey: string, synthesis: SynthesisResult) {
  if (!isRedisCacheConfigured) {
    return
  }

  try {
    await setCachedJson(cacheKey, synthesis, SYNTHESIS_CACHE_TTL_SECONDS)
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Synthesis] cache write failed; response will still be returned.', error)
    }
  }
}

async function findOwnedMission(missionId: string, founderId: string) {
  return prisma.mission.findFirst({
    where: { id: missionId, founderId },
    select: {
      id: true,
      testersCompleted: true,
    },
  })
}

export async function GET(
  request: Request,
  context: { params: { missionId: string } }
) {
  try {
    const rateLimited = await enforceRateLimit(request, 'mission-synthesize')
    if (rateLimited) return rateLimited

    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    const mission = await findOwnedMission(
      context.params.missionId,
      founder.founderProfile.id
    )

    if (!mission) {
      return notFound('Mission')
    }

    if (mission.testersCompleted === 0) {
      return badRequest('No completed responses yet')
    }

    // Serverless functions lose module memory on cold starts, so Redis keeps synthesis cache shared across invocations.
    const cacheKey = getSynthesisCacheKey(mission.id)
    const cached = await readCachedSynthesis(cacheKey)
    if (cached) {
      return ok(cached)
    }

    const feedback = await computeFeedback(mission.id)
    const synthesis = await synthesizeFeedback(feedback)
    const score = computeHealthScore(synthesis)

    await prisma.mission.update({
      where: { id: mission.id },
      data: { healthScore: score }
    })

    await writeCachedSynthesis(cacheKey, synthesis)

    return ok(synthesis)
  } catch (err) {
    if (err instanceof SynthesisError) {
      return apiError('Synthesis failed — please try again.', err.code, err.status)
    }
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
