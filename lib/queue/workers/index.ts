import type { Worker } from 'bullmq'
import { createAssignmentWorker } from '@/lib/queue/workers/assignment.worker'
import { createNotificationWorker } from '@/lib/queue/workers/notification.worker'
import { createTimeoutWorker } from '@/lib/queue/workers/timeout.worker'
import { closeRedisConnection, isRedisConfigured } from '@/lib/redis'

type WorkerRegistry = {
  started?: boolean
  workers?: Worker[]
}

const globalForWorkers = global as unknown as WorkerRegistry

export function startQueueWorkers() {
  if (!isRedisConfigured) {
    console.warn(
      '[QueueWorkers] Redis is not configured. Skipping BullMQ worker startup and relying on inline processing.'
    )
    return []
  }

  if (globalForWorkers.started && globalForWorkers.workers) {
    return globalForWorkers.workers
  }

  const workers = [
    createAssignmentWorker(),
    createTimeoutWorker(),
    createNotificationWorker(),
  ]

  globalForWorkers.started = true
  globalForWorkers.workers = workers

  console.log(`[QueueWorkers] Started ${workers.length} BullMQ workers.`)

  return workers
}

export async function stopQueueWorkers() {
  if (!globalForWorkers.workers || globalForWorkers.workers.length === 0) {
    return
  }

  await Promise.all(globalForWorkers.workers.map((worker) => worker.close()))
  globalForWorkers.started = false
  globalForWorkers.workers = []
  await closeRedisConnection()
}
