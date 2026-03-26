export const dynamic = 'force-dynamic'
import { MissionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { assignmentQueue, notificationQueue } from '@/lib/queue'
import { logApiRouteError } from '@/lib/api/log'

export async function POST(
  request: Request,
  context: { params: { missionId: string } }
) {
  try {
    const admin = await requireRole('ADMIN')

    const mission = await prisma.mission.findUnique({
      where: { id: context.params.missionId },
      include: {
        founder: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!mission) {
      return notFound('Mission')
    }

    if (mission.status !== MissionStatus.PENDING_REVIEW) {
      return badRequest('Mission is not pending review')
    }

    const launchedAt = new Date()

    const updatedMission = await prisma.mission.update({
      where: { id: mission.id },
      data: {
        status: MissionStatus.ACTIVE,
        reviewedBy: admin.id,
        reviewedAt: launchedAt,
        launchedAt,
        reviewNote: null,
      },
    })

    await assignmentQueue.add('assign', {
      missionId: mission.id,
    })

    await notificationQueue.add('notify', {
      type: 'MISSION_APPROVED',
      userId: mission.founder.userId,
      missionId: mission.id,
    })

    return ok(updatedMission)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
