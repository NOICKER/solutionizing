import { Worker } from 'bullmq'
import { requireRedisConnection } from '@/lib/redis'
import { processAssignmentJob } from '@/lib/queue/processors/assignment'
import { notificationQueue } from '@/lib/queue'
import type { AssignmentJobPayload } from '@/types/jobs'

export function createAssignmentWorker() {
  const worker = new Worker<AssignmentJobPayload>(
    'assignment',
    async (job) => {
      const assignments = await processAssignmentJob(job.data)

      // Enqueue notification jobs for each new assignment
      await Promise.all(
        assignments.map((assignment) =>
          notificationQueue.add('notify', {
            type: 'ASSIGNMENT_RECEIVED',
            userId: assignment.userId,
            missionId: assignment.missionId,
            assignmentId: assignment.assignmentId,
          })
        )
      )
    },
    { connection: requireRedisConnection() }
  )

  worker.on('failed', (job, error) => {
    console.error(
      `[AssignmentWorker] Job ${job?.id ?? 'unknown'} failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  })

  return worker
}
