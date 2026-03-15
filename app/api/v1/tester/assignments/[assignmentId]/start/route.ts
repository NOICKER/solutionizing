import { AssignmentStatus, MissionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, apiError, badRequest, notFound, serverError } from '@/lib/api/response'
import { updateReputation } from '@/lib/business/reputation'
import { assignmentQueue } from '@/lib/queue'

type StartAssignmentResult =
  | {
      expired: true
      missionId: string
      penaltyApplied: boolean
      shouldReassign: boolean
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

      if (assignment.status !== AssignmentStatus.ASSIGNED) {
        throw badRequest('Only assigned missions can be started')
      }

      const now = new Date()

      if (assignment.timeoutAt < now) {
        const updatedAssignments = await tx.missionAssignment.updateMany({
          where: {
            id: assignment.id,
            status: AssignmentStatus.ASSIGNED,
            timeoutAt: {
              lte: now,
            },
          },
          data: {
            status: AssignmentStatus.TIMED_OUT,
            timedOutAt: now,
          },
        })

        if (updatedAssignments.count === 0) {
          return {
            expired: true,
            missionId: assignment.missionId,
            penaltyApplied: false,
            shouldReassign: false,
          }
        }

        await tx.testerProfile.update({
          where: { id: tester.testerProfile!.id },
          data: {
            isAvailable: true,
            totalTimedOut: { increment: 1 },
          },
        })

        return {
          expired: true,
          missionId: assignment.missionId,
          penaltyApplied: true,
          shouldReassign:
            assignment.mission.status === MissionStatus.ACTIVE &&
            assignment.mission.testersCompleted < assignment.mission.testersRequired,
        }
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
      if (result.penaltyApplied) {
        await updateReputation(tester.testerProfile.id, 'TIMEOUT')
      }

      if (result.penaltyApplied && result.shouldReassign) {
        await assignmentQueue.add('reassign', {
          missionId: result.missionId,
          isReassignment: true,
        })
      }

      return apiError('Assignment expired', 'ASSIGNMENT_EXPIRED', 410)
    }

    return ok(result.assignment)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[tester:assignments:start]', err)
    return serverError()
  }
}
