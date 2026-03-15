import { Worker } from 'bullmq'
import { requireRedisConnection } from '@/lib/redis'
import { processTimeoutJob } from '@/lib/queue/processors/timeout'
import type { TimeoutCheckPayload } from '@/types/jobs'

export function createTimeoutWorker() {
  const worker = new Worker<TimeoutCheckPayload>(
    'timeout',
    async (job) => processTimeoutJob(job.data),
    { connection: requireRedisConnection() }
  )

  worker.on('failed', (job, error) => {
    console.error(
      `[TimeoutWorker] Job ${job?.id ?? 'unknown'} failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  })

  return worker
}
