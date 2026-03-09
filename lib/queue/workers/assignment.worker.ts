import { Worker } from 'bullmq'
import { assignTestersToMission } from '@/lib/business/assignment'
import { notificationQueue } from '@/lib/queue'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import type { AssignmentJobPayload } from '@/types/jobs'

export const assignmentWorker = new Worker<AssignmentJobPayload>(
  'assignment',
  async (job) => {
    const { missionId } = job.data

    console.log(`[AssignmentWorker] Processing mission ${missionId}`)
    await assignTestersToMission(missionId)

    const assignments = await prisma.missionAssignment.findMany({
      where: {
        missionId,
        status: 'ASSIGNED',
      },
      select: {
        id: true,
        tester: {
          select: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    await Promise.all(
      assignments.map((assignment) =>
        notificationQueue.add('notify', {
          type: 'ASSIGNMENT_RECEIVED',
          userId: assignment.tester.user.id,
          missionId,
          assignmentId: assignment.id,
        })
      )
    )
  },
  { connection: redis }
)

assignmentWorker.on('failed', (job, error) => {
  console.error(
    `[AssignmentWorker] Job ${job?.id ?? 'unknown'} failed: ${
      error instanceof Error ? error.message : String(error)
    }`
  )
})
