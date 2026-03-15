import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/resend'
import {
  assignmentReceivedTemplate,
  missionApprovedTemplate,
  missionCompletedTemplate,
  missionRejectedTemplate,
} from '@/lib/email/templates'
import type { NotificationPayload } from '@/types/jobs'

function buildUrl(appUrl: string, pathname: string) {
  return `${appUrl.replace(/\/$/, '')}${pathname}`
}

export async function processNotificationJob({
  type,
  userId,
  missionId,
  assignmentId,
  rejectionReason,
}: NotificationPayload) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.NEXT_PUBLIC_APP_URL) {
    console.warn('[NotificationWorker] Email delivery is not configured. Skipping notification.')
    return
  }

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const from = process.env.EMAIL_FROM

  let subject: string | null = null
  let html: string | null = null

  switch (type) {
    case 'ASSIGNMENT_RECEIVED':
      if (!mission || !assignmentId) {
        return
      }

      subject = 'You have a new mission!'
      html = assignmentReceivedTemplate(
        { goal: mission.goal || '', estimatedMinutes: mission.estimatedMinutes || 0 },
        buildUrl(appUrl, `/tester/assignments/${assignmentId}`)
      )
      break
    case 'MISSION_APPROVED':
      if (!mission || !missionId) {
        return
      }

      subject = 'Your mission has been approved!'
      html = missionApprovedTemplate(
        { title: mission.title || '' },
        buildUrl(appUrl, `/missions/${missionId}`)
      )
      break
    case 'MISSION_REJECTED':
      if (!mission || !missionId) {
        return
      }

      subject = 'Your mission needs changes'
      html = missionRejectedTemplate(
        { title: mission.title || '' },
        rejectionReason ?? mission.reviewNote ?? 'Please review the mission feedback.',
        buildUrl(appUrl, `/missions/${missionId}`)
      )
      break
    case 'MISSION_COMPLETED':
      if (!mission || !missionId) {
        return
      }

      subject = 'Your mission results are ready'
      html = missionCompletedTemplate(
        { title: mission.title || '' },
        buildUrl(appUrl, `/missions/${missionId}/feedback`)
      )
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
}
