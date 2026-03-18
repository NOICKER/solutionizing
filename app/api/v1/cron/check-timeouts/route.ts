import { AssignmentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { timeoutQueue } from '@/lib/queue'
import { ok, unauthorized, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

export async function GET(request: Request) {
  try {
    const secret = request.headers.get('x-cron-secret')
    const authorization = request.headers.get('authorization')
    const bearerToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null

    if (secret !== process.env.CRON_SECRET && bearerToken !== process.env.CRON_SECRET) {
      return unauthorized()
    }

    const expiredAssignments = await prisma.missionAssignment.findMany({
      where: {
        status: AssignmentStatus.ASSIGNED,
        timeoutAt: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
      },
    })

    await Promise.all(
      expiredAssignments.map((assignment) =>
        timeoutQueue.add('check-timeout', { assignmentId: assignment.id })
      )
    )

    return ok({ processed: expiredAssignments.length })
  } catch (err) {
    logApiRouteError(request, err)
    return serverError()
  }
}

