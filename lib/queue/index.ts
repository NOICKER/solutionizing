import { Queue } from 'bullmq'
import { logInlineQueueWarning, isRedisConfigured, requireRedisConnection } from '@/lib/redis'
import { processAssignmentJob } from '@/lib/queue/processors/assignment'
import { processNotificationJob } from '@/lib/queue/processors/notification'
import { processTimeoutJob } from '@/lib/queue/processors/timeout'
import type {
  AssignmentJobPayload,
  NotificationPayload,
  TimeoutCheckPayload,
} from '@/types/jobs'

type QueueLike<Payload> = {
  add: (name: string, payload: Payload) => Promise<unknown>
}

type QueueGlobals = {
  bullmqAssignmentQueue?: Queue<AssignmentJobPayload>
  bullmqTimeoutQueue?: Queue<TimeoutCheckPayload>
  bullmqNotificationQueue?: Queue<NotificationPayload>
}

const globalForQueues = global as unknown as QueueGlobals

function getAssignmentBullmqQueue() {
  if (!globalForQueues.bullmqAssignmentQueue) {
    globalForQueues.bullmqAssignmentQueue = new Queue<AssignmentJobPayload>('assignment', {
      connection: requireRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    })
  }

  return globalForQueues.bullmqAssignmentQueue
}

function getTimeoutBullmqQueue() {
  if (!globalForQueues.bullmqTimeoutQueue) {
    globalForQueues.bullmqTimeoutQueue = new Queue<TimeoutCheckPayload>('timeout', {
      connection: requireRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'fixed', delay: 5000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
      },
    })
  }

  return globalForQueues.bullmqTimeoutQueue
}

function getNotificationBullmqQueue() {
  if (!globalForQueues.bullmqNotificationQueue) {
    globalForQueues.bullmqNotificationQueue = new Queue<NotificationPayload>('notification', {
      connection: requireRedisConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 200 },
      },
    })
  }

  return globalForQueues.bullmqNotificationQueue
}

function createQueue<Payload>(
  getBullmqQueue: () => Queue<Payload>,
  inlineProcessor: (payload: Payload) => Promise<void>
): QueueLike<Payload> {
  return {
    async add(name, payload) {
      if (!isRedisConfigured) {
        logInlineQueueWarning()
        return inlineProcessor(payload)
      }

      return getBullmqQueue().add(name, payload)
    },
  }
}

export const assignmentQueue = createQueue(getAssignmentBullmqQueue, processAssignmentJob)
export const timeoutQueue = createQueue(getTimeoutBullmqQueue, processTimeoutJob)
export const notificationQueue = createQueue(
  getNotificationBullmqQueue,
  processNotificationJob
)
