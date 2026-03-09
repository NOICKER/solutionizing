import { MissionStatus } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { validateBody } from '@/lib/api/validate'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { notificationQueue } from '@/lib/queue'

const RejectMissionSchema = z.object({
  reason: z.string().min(10),
})

export async function POST(
  request: Request,
  context: { params: { missionId: string } }
) {
  try {
    const admin = await requireRole('ADMIN')
    const body = await validateBody(request, RejectMissionSchema)

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

    const updatedMission = await prisma.mission.update({
      where: { id: mission.id },
      data: {
        status: MissionStatus.REJECTED,
        reviewNote: body.reason,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    })

    await notificationQueue.add('notify', {
      type: 'MISSION_REJECTED',
      userId: mission.founder.userId,
      missionId: mission.id,
      rejectionReason: body.reason,
    })

    return ok(updatedMission)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[admin:missions:reject]', err)
    return serverError()
  }
}
