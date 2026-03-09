import { AssignmentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, apiError, badRequest, notFound, serverError } from '@/lib/api/response'
import { updateReputation } from '@/lib/business/reputation'

type StartAssignmentResult =
  | {
      expired: true
    }
  | {
      expired: false
      assignment: {
        id: string
        missionId: string
        testerId: string
        status: AssignmentStatus
        assignedAt: Date
        startedAt: Date | null
        completedAt: Date | null
        abandonedAt: Date | null
        timedOutAt: Date | null
        timeoutAt: Date
        coinsEarned: number
      }
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

    const result = await prisma.$transaction<StartAssignmentResult>(async (tx) => {
      const assignment = await tx.missionAssignment.findFirst({
        where: {
          id: context.params.assignmentId,
          testerId: tester.testerProfile!.id,
        },
        select: {
          id: true,
          missionId: true,
          testerId: true,
          status: true,
          assignedAt: true,
          startedAt: true,
          completedAt: true,
          abandonedAt: true,
          timedOutAt: true,
          timeoutAt: true,
          coinsEarned: true,
        },
      })

      if (!assignment) {
        throw notFound('Assignment')
      }

      if (assignment.status !== AssignmentStatus.ASSIGNED) {
        throw badRequest('Only assigned missions can be started')
      }

      const now = new Date()

      if (assignment.timeoutAt < now) {
        await tx.missionAssignment.update({
          where: { id: assignment.id },
          data: {
            status: AssignmentStatus.TIMED_OUT,
            timedOutAt: now,
          },
        })

        await tx.testerProfile.update({
          where: { id: tester.testerProfile!.id },
          data: {
            isAvailable: true,
          },
        })

        return { expired: true }
      }

      const updatedAssignment = await tx.missionAssignment.update({
        where: { id: assignment.id },
        data: {
          status: AssignmentStatus.IN_PROGRESS,
          startedAt: now,
        },
        select: {
          id: true,
          missionId: true,
          testerId: true,
          status: true,
          assignedAt: true,
          startedAt: true,
          completedAt: true,
          abandonedAt: true,
          timedOutAt: true,
          timeoutAt: true,
          coinsEarned: true,
        },
      })

      return {
        expired: false,
        assignment: updatedAssignment,
      }
    })

    if (result.expired) {
      await updateReputation(tester.testerProfile.id, 'TIMEOUT')
      return apiError('Assignment expired', 'ASSIGNMENT_EXPIRED', 410)
    }

    return ok(result.assignment)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[tester:assignments:start]', err)
    return serverError()
  }
}
