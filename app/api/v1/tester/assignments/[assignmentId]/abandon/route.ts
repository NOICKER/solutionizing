export const dynamic = 'force-dynamic'
import { AssignmentStatus, MissionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { updateReputation } from '@/lib/business/reputation'
import { assignmentQueue } from '@/lib/queue'
import { logApiRouteError } from '@/lib/api/log'

type AbandonAssignmentResult = {
  missionId: string
  shouldReassign: boolean
}

export async function POST(
  request: Request,
  context: { params: { assignmentId: string } }
) {
  try {
    const tester = await requireRole('TESTER')

    if (!tester.testerProfile) {
      return notFound('Tester profile')
    }

    const result = await prisma.$transaction<AbandonAssignmentResult>(async (tx) => {
      const assignment = await tx.missionAssignment.findFirst({
        where: {
          id: context.params.assignmentId,
          testerId: tester.testerProfile!.id,
        },
        select: {
          id: true,
          missionId: true,
          status: true,
          mission: {
            select: {
              status: true,
              testersCompleted: true,
              testersRequired: true,
            },
          },
        },
      })

      if (!assignment) {
        throw notFound('Assignment')
      }

      if (
        assignment.status !== AssignmentStatus.ASSIGNED &&
        assignment.status !== AssignmentStatus.IN_PROGRESS
      ) {
        throw badRequest('Only assigned or in-progress assignments can be abandoned')
      }

      const now = new Date()

      await tx.missionAssignment.update({
        where: { id: assignment.id },
        data: {
          status: AssignmentStatus.ABANDONED,
          abandonedAt: now,
        },
      })

      await tx.testerProfile.update({
        where: { id: tester.testerProfile!.id },
        data: {
          isAvailable: true,
          totalAbandoned: { increment: 1 },
        },
      })

      return {
        missionId: assignment.missionId,
        shouldReassign:
          assignment.mission.status === MissionStatus.ACTIVE &&
          assignment.mission.testersCompleted < assignment.mission.testersRequired,
      }
    })

    await updateReputation(tester.testerProfile.id, 'ABANDON')

    if (result.shouldReassign) {
      await assignmentQueue.add('reassign', {
        missionId: result.missionId,
        isReassignment: true,
      })
    }

    return ok({ penaltyApplied: -4 })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
