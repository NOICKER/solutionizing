import { AssignmentStatus, MissionStatus } from '@prisma/client'
import { updateReputation } from '@/lib/business/reputation'
import { prisma } from '@/lib/prisma'
import type { TimeoutCheckPayload } from '@/types/jobs'

export async function processTimeoutJob({ assignmentId }: TimeoutCheckPayload) {
  const now = new Date()

  const assignment = await prisma.missionAssignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      missionId: true,
      testerId: true,
      status: true,
      timeoutAt: true,
      mission: {
        select: {
          id: true,
          status: true,
          testersCompleted: true,
          testersRequired: true,
        },
      },
    },
  })

  if (!assignment) {
    return
  }

  if (assignment.status !== AssignmentStatus.ASSIGNED) {
    return
  }

  if (assignment.timeoutAt > now) {
    return
  }

  const timedOut = await prisma.$transaction(async (tx) => {
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
      return false
    }

    await tx.testerProfile.update({
      where: { id: assignment.testerId },
      data: {
        isAvailable: true,
        totalTimedOut: { increment: 1 },
      },
    })

    return true
  })

  if (!timedOut) {
    return
  }

  await updateReputation(assignment.testerId, 'TIMEOUT')

  if (
    assignment.mission.status === MissionStatus.ACTIVE &&
    assignment.mission.testersCompleted < assignment.mission.testersRequired
  ) {
    const { assignmentQueue } = require('../index') as {
      assignmentQueue: {
        add: (name: string, payload: {
          missionId: string
          isReassignment?: boolean
        }) => Promise<unknown>
      }
    }

    await assignmentQueue.add('reassign', {
      missionId: assignment.missionId,
      isReassignment: true,
    })
  }
}
