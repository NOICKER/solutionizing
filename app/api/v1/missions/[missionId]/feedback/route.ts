export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { computeFeedback } from '@/lib/business/feedback'
import { logApiRouteError } from '@/lib/api/log'
import { Prisma } from '@prisma/client'

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

    const feedback = await computeFeedback(mission.id)

    return ok(feedback)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
