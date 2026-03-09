import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'
import type {
  AssignmentJobPayload,
  NotificationPayload,
  TimeoutCheckPayload,
} from '@/types/jobs'

const connection = redis

const globalForQueues = global as unknown as {
  assignmentQueue?: Queue<AssignmentJobPayload>
  timeoutQueue?: Queue<TimeoutCheckPayload>
  notificationQueue?: Queue<NotificationPayload>
}

export const assignmentQueue =
  globalForQueues.assignmentQueue ??
  new Queue<AssignmentJobPayload>('assignment', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    },
  })

export const timeoutQueue =
  globalForQueues.timeoutQueue ??
  new Queue<TimeoutCheckPayload>('timeout', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'fixed', delay: 5000 },
      removeOnComplete: { count: 50 },
    },
  })

export const notificationQueue =
  globalForQueues.notificationQueue ??
  new Queue<NotificationPayload>('notification', {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 200 },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForQueues.assignmentQueue = assignmentQueue
  globalForQueues.timeoutQueue = timeoutQueue
  globalForQueues.notificationQueue = notificationQueue
}
