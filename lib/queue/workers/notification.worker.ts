import { Worker } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { resend } from '@/lib/resend'
import type { NotificationPayload } from '@/types/jobs'

function buildUrl(appUrl: string, pathname: string) {
  return `${appUrl.replace(/\/$/, '')}${pathname}`
}

export const notificationWorker = new Worker<NotificationPayload>(
  'notification',
  async (job) => {
    const { type, userId, missionId, assignmentId, rejectionReason } = job.data

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    })

    if (!user) {
      return
    }

    const mission = missionId
      ? await prisma.mission.findUnique({
          where: { id: missionId },
          select: {
            id: true,
            title: true,
            goal: true,
            estimatedMinutes: true,
            reviewNote: true,
          },
        })
      : null

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const from = process.env.EMAIL_FROM ?? ''

    let subject: string | null = null
    let html: string | null = null

    switch (type) {
      case 'ASSIGNMENT_RECEIVED':
        if (!mission || !assignmentId) {
          return
        }

        subject = 'You have a new mission!'
        html = `
          <p>You have a new mission assignment.</p>
          <p>Goal: ${mission.goal}</p>
          <p>Estimated minutes: ${mission.estimatedMinutes}</p>
          <p><a href="${buildUrl(appUrl, `/tester/assignments/${assignmentId}`)}">Open assignment</a></p>
        `
        break
      case 'MISSION_APPROVED':
        if (!mission || !missionId) {
          return
        }

        subject = 'Your mission has been approved!'
        html = `
          <p>Your mission has been approved.</p>
          <p>Title: ${mission.title}</p>
          <p><a href="${buildUrl(appUrl, `/missions/${missionId}`)}">View mission</a></p>
        `
        break
      case 'MISSION_REJECTED':
        if (!mission || !missionId) {
          return
        }

        subject = 'Your mission needs changes'
        html = `
          <p>Your mission needs changes before it can move forward.</p>
          <p>Title: ${mission.title}</p>
          <p>Reason: ${rejectionReason ?? mission.reviewNote ?? 'Please review the mission feedback.'}</p>
          <p><a href="${buildUrl(appUrl, `/missions/${missionId}`)}">Review mission</a></p>
        `
        break
      case 'MISSION_COMPLETED':
        if (!mission || !missionId) {
          return
        }

        subject = 'Your mission results are ready'
        html = `
          <p>Your mission results are ready.</p>
          <p>Title: ${mission.title}</p>
          <p><a href="${buildUrl(appUrl, `/missions/${missionId}/feedback`)}">View feedback</a></p>
        `
        break
      default:
        return
    }

    await resend.emails.send({
      from,
      to: user.email,
      subject,
      html,
    })
  },
  { connection: redis }
)

notificationWorker.on('failed', (job, error) => {
  console.error(
    `[NotificationWorker] Job ${job?.id ?? 'unknown'} failed: ${
      error instanceof Error ? error.message : String(error)
    }`
  )
})
