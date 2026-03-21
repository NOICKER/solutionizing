export const dynamic = 'force-dynamic'
import { AssignmentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { releaseOpenAssignmentsForMission } from '@/lib/business/mission-assignments'
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

    if (mission.status !== 'ACTIVE' && mission.status !== 'PAUSED') {
      return badRequest('Only active or paused missions can be closed')
    }

    const unspentTesters = mission.testersRequired - mission.testersCompleted
    const refundAmount = unspentTesters * mission.coinPerTester

    if (unspentTesters <= 0) {
      return badRequest('Mission is already fully completed')
    }

    const founderProfileId = founder.founderProfile.id
    const updatedMission = await prisma.$transaction(async (tx) => {
      const updatedFounderProfile = await tx.founderProfile.update({
        where: { id: founderProfileId },
        data: {
          coinBalance: { increment: refundAmount },
        },
        select: { coinBalance: true },
      })

      await tx.coinTransaction.create({
        data: {
          userId: founder.id,
          type: 'MISSION_REFUND',
          amount: refundAmount,
          balanceAfter: updatedFounderProfile.coinBalance,
          description: `Mission refund: ${mission.title}`,
          missionId: mission.id,
        },
      })

      await releaseOpenAssignmentsForMission(
        tx,
        mission.id,
        AssignmentStatus.MISSION_FULL
      )

      return tx.mission.update({
        where: { id: mission.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        include: {
          assets: { orderBy: { order: 'asc' } },
          questions: { orderBy: { order: 'asc' } },
        },
      })
    })

    return ok({
      mission: updatedMission,
      refundAmount,
    })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
