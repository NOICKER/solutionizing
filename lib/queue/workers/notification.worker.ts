import { Worker } from 'bullmq'
import { requireRedisConnection } from '@/lib/redis'
import { processNotificationJob } from '@/lib/queue/processors/notification'
import type { NotificationPayload } from '@/types/jobs'

export function createNotificationWorker() {
  const worker = new Worker<NotificationPayload>(
    'notification',
    async (job) => processNotificationJob(job.data),
    { connection: requireRedisConnection() }
  )

  worker.on('failed', (job, error) => {
    console.error(
      `[NotificationWorker] Job ${job?.id ?? 'unknown'} failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  })

  return worker
}
