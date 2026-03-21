import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { assignmentQueue } from '@/lib/queue'
import { logApiRouteError } from '@/lib/api/log'

async function findOwnedMission(missionId: string, founderId: string) {
  return prisma.mission.findFirst({
    where: { id: missionId, founderId },
    include: {
      assets: { orderBy: { order: 'asc' } },
      questions: { orderBy: { order: 'asc' } },
    },
  })
}

export async function POST(
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

    if (mission.status !== 'PAUSED') {
      return badRequest('Only paused missions can be resumed')
    }

    const updatedMission = await prisma.mission.update({
      where: { id: mission.id },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
      },
      include: {
        assets: { orderBy: { order: 'asc' } },
        questions: { orderBy: { order: 'asc' } },
      },
    })

    // If there are still testers needed, add job to reassign
    if (mission.testersCompleted < mission.testersRequired) {
      await assignmentQueue.add('assign', { missionId: mission.id })
    }

    return ok(updatedMission)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
