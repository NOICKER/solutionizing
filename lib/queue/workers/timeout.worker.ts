import { AssignmentStatus, MissionStatus } from '@prisma/client'
import { Worker } from 'bullmq'
import { updateReputation } from '@/lib/business/reputation'
import { prisma } from '@/lib/prisma'
import { assignmentQueue } from '@/lib/queue'
import { redis } from '@/lib/redis'
import type { TimeoutCheckPayload } from '@/types/jobs'

export const timeoutWorker = new Worker<TimeoutCheckPayload>(
  'timeout',
  async (job) => {
    const { assignmentId } = job.data
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

    if (
      assignment.status === AssignmentStatus.COMPLETED ||
      assignment.status === AssignmentStatus.ABANDONED
    ) {
      return
    }

    if (
      assignment.status !== AssignmentStatus.ASSIGNED &&
      assignment.status !== AssignmentStatus.IN_PROGRESS
    ) {
      return
    }

    if (assignment.timeoutAt > now) {
      return
    }

    const timedOut = await prisma.$transaction(async (tx) => {
      const updatedAssignments = await tx.missionAssignment.updateMany({
        where: {
          id: assignment.id,
          status: {
            in: [AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS],
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

    const mission = await prisma.mission.findUnique({
      where: { id: assignment.missionId },
      select: {
        id: true,
        status: true,
        testersCompleted: true,
        testersRequired: true,
      },
    })

    if (!mission) {
      return
    }

    if (
      mission.status === MissionStatus.ACTIVE &&
      mission.testersCompleted < mission.testersRequired
    ) {
      await assignmentQueue.add('reassign', {
        missionId: assignment.missionId,
        isReassignment: true,
      })
    }
  },
  { connection: redis }
)

timeoutWorker.on('failed', (job, error) => {
  console.error(
    `[TimeoutWorker] Job ${job?.id ?? 'unknown'} failed: ${
      error instanceof Error ? error.message : String(error)
    }`
  )
})
