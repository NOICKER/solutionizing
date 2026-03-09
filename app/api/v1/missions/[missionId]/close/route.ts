import { AssignmentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'

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

      const openAssignments = await tx.missionAssignment.findMany({
        where: {
          missionId: mission.id,
          status: {
            in: [AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS],
          },
        },
        select: { testerId: true },
      })

      await tx.missionAssignment.updateMany({
        where: {
          missionId: mission.id,
          status: {
            in: [AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS],
          },
        },
        data: { status: AssignmentStatus.MISSION_FULL },
      })

      const testerIds = [...new Set(openAssignments.map((assignment) => assignment.testerId))]

      if (testerIds.length > 0) {
        await tx.testerProfile.updateMany({
          where: { id: { in: testerIds } },
          data: { isAvailable: true },
        })
      }

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
    console.error('[missions:close]', err)
    return serverError()
  }
}
