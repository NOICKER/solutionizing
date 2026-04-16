export const dynamic = 'force-dynamic'
import { AssignmentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, apiError, notFound, serverError } from '@/lib/api/response'
import { assignmentQueue } from '@/lib/queue'
import { logApiRouteError } from '@/lib/api/log'
import { invalidateTesterAvailabilityCache } from '@/lib/business/tester-availability'

async function findOwnedMission(missionId: string, founderId: string) {
  return prisma.mission.findFirst({
    where: { id: missionId, founderId },
    include: {
      assets: { orderBy: { order: 'asc' } },
      questions: { orderBy: { order: 'asc' } },
    },
  })
}

async function rollbackMissionLaunch({
  founderId,
  founderProfileId,
  missionId,
  missionTitle,
  refundAmount,
}: {
  founderId: string
  founderProfileId: string
  missionId: string
  missionTitle: string
  refundAmount: number
}) {
  const releasableStatuses = [AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS]

  await prisma.$transaction(async (tx) => {
    const openAssignments = await tx.missionAssignment.findMany({
      where: {
        missionId,
        status: {
          in: releasableStatuses,
        },
      },
      select: {
        id: true,
        testerId: true,
      },
    })
    let deletedAssignmentCount = 0

    if (openAssignments.length > 0) {
      const deletedAssignments = await tx.missionAssignment.deleteMany({
        where: {
          id: {
            in: openAssignments.map((assignment) => assignment.id),
          },
          status: {
            in: releasableStatuses,
          },
        },
      })
      deletedAssignmentCount = deletedAssignments.count

      await tx.testerProfile.updateMany({
        where: {
          id: {
            in: [...new Set(openAssignments.map((assignment) => assignment.testerId))],
          },
        },
        data: {
          isAvailable: true,
        },
      })
    }

    const updatedFounderProfile = await tx.founderProfile.update({
      where: { id: founderProfileId },
      data: {
        coinBalance: { increment: refundAmount },
        totalMissions: { decrement: 1 },
      },
      select: { coinBalance: true },
    })

    await tx.coinTransaction.create({
      data: {
        userId: founderId,
        type: 'MISSION_REFUND',
        amount: refundAmount,
        balanceAfter: updatedFounderProfile.coinBalance,
        description: `Mission launch rollback: ${missionTitle}`,
        missionId,
      },
    })

    await tx.mission.update({
      where: { id: missionId },
      data: {
        status: 'APPROVED',
        launchedAt: null,
      },
    })

    if (openAssignments.length > 0) {
      await tx.mission.update({
        where: { id: missionId },
        data: {
          testersAssigned: { decrement: deletedAssignmentCount },
        },
      })
    }
  })

  await invalidateTesterAvailabilityCache()
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

    if (mission.status !== 'APPROVED') {
      return apiError('Mission must be approved before launch', 'MISSION_NOT_LAUNCHABLE', 400)
    }

    const founderProfileId = founder.founderProfile.id
    let updatedMission: Awaited<ReturnType<typeof findOwnedMission>> | null = null

    try {
      updatedMission = await prisma.$transaction(async (tx) => {
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
      if (err instanceof Response) {
        return err
      }

      if (updatedMission) {
        await rollbackMissionLaunch({
          founderId: founder.id,
          founderProfileId,
          missionId: mission.id,
          missionTitle: mission.title,
          refundAmount: mission.coinCostTotal,
        })
      }

      throw err
    }
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
