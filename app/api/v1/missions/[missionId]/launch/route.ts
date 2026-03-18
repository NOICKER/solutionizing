import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, apiError, notFound, serverError } from '@/lib/api/response'
import { assignmentQueue } from '@/lib/queue'
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

    if (mission.status !== 'PENDING_REVIEW') {
      return apiError('Mission must be pending review before launch', 'MISSION_NOT_LAUNCHABLE', 400)
    }

    if (mission.reviewNote !== null) {
      return apiError('Mission has not been approved for launch', 'MISSION_NOT_LAUNCHABLE', 400)
    }

    const founderProfileId = founder.founderProfile.id
    const updatedMission = await prisma.$transaction(async (tx) => {
      const currentFounderProfile = await tx.founderProfile.findUnique({
        where: { id: founderProfileId },
        select: { coinBalance: true },
      })

      if (!currentFounderProfile) {
        throw notFound('Founder profile')
      }

      if (currentFounderProfile.coinBalance < mission.coinCostTotal) {
        throw apiError('Insufficient coins', 'INSUFFICIENT_COINS', 400)
      }

      const updatedFounderProfile = await tx.founderProfile.update({
        where: { id: founderProfileId },
        data: {
          coinBalance: { decrement: mission.coinCostTotal },
          totalMissions: { increment: 1 },
        },
        select: { coinBalance: true },
      })

      await tx.coinTransaction.create({
        data: {
          userId: founder.id,
          type: 'MISSION_DEDUCT',
          amount: -mission.coinCostTotal,
          balanceAfter: updatedFounderProfile.coinBalance,
          description: `Mission launched: ${mission.title}`,
          missionId: mission.id,
        },
      })

      return tx.mission.update({
        where: { id: mission.id },
        data: {
          status: 'ACTIVE',
          launchedAt: new Date(),
        },
        include: {
          assets: { orderBy: { order: 'asc' } },
          questions: { orderBy: { order: 'asc' } },
        },
      })
    })

    await assignmentQueue.add('assign', { missionId: mission.id })

    return ok(updatedMission)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
