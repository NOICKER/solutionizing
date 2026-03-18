import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'
import { Prisma } from '@prisma/client'

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

    if (mission.status !== 'ACTIVE') {
      return badRequest('Only active missions can be paused')
    }

    const updatedMission = await prisma.mission.update({
      where: { id: mission.id },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
      },
      include: {
        assets: { orderBy: { order: 'asc' } },
        questions: { orderBy: { order: 'asc' } },
      },
    })

    return ok(updatedMission)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
