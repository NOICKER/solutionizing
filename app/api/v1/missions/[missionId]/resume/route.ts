import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/middleware'
import { ok, apiError, badRequest, forbidden, notFound, serverError } from '@/lib/api/response'
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
    const authUser = await requireAuth()
    const founder = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        founderProfile: true,
      },
    })

    if (!founder) {
      return notFound('User')
    }

    if (founder.isSuspended) {
      return apiError('Account suspended', 'ACCOUNT_SUSPENDED', 403)
    }

    if (founder.isDeleted) {
      return apiError('Account deleted. Please contact support to reactivate.', 'ACCOUNT_DELETED', 403)
    }

    if (founder.role !== 'FOUNDER' || !founder.founderProfile) {
      return forbidden()
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

    return ok(updatedMission)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
