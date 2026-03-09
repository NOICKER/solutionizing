import { AssignmentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { timeoutQueue } from '@/lib/queue'
import { ok, unauthorized, serverError } from '@/lib/api/response'

export async function GET(request: Request) {
  try {
    const secret = request.headers.get('x-cron-secret')

    if (secret !== process.env.CRON_SECRET) {
      return unauthorized()
    }

    const expiredAssignments = await prisma.missionAssignment.findMany({
      where: {
        status: {
          in: [AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS],
        },
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
    console.error('[cron:check-timeouts]', err)
    return serverError()
  }
}
