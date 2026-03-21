import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { computeFeedback } from '@/lib/business/feedback'
import { synthesizeFeedback } from '@/lib/ai/synthesize'
import { logApiRouteError } from '@/lib/api/log'

const synthesisCache = new Map<string, { result: any; expires: number }>()

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

    // Check cache
    const cached = synthesisCache.get(mission.id)
    if (cached && cached.expires > Date.now()) {
      return ok(cached.result)
    }

    const feedback = await computeFeedback(mission.id)
    const synthesis = await synthesizeFeedback(feedback)

    // Cache for 1 hour
    synthesisCache.set(mission.id, {
      result: synthesis,
      expires: Date.now() + 60 * 60 * 1000
    })

    return ok(synthesis)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}