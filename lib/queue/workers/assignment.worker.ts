import { Worker } from 'bullmq'
import { requireRedisConnection } from '@/lib/redis'
import { processAssignmentJob } from '@/lib/queue/processors/assignment'
import type { AssignmentJobPayload } from '@/types/jobs'

export function createAssignmentWorker() {
  const worker = new Worker<AssignmentJobPayload>(
    'assignment',
    async (job) => processAssignmentJob(job.data),
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
