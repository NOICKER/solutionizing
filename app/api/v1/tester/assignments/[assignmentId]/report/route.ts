import { MissionStatus } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, apiError, notFound, serverError } from '@/lib/api/response'
import { validateBody } from '@/lib/api/validate'
import { logApiRouteError } from '@/lib/api/log'

const ReportMissionSchema = z.object({
  reason: z.string().min(10).max(500),
})

export async function POST(
  request: Request,
  context: { params: { assignmentId: string } }
) {
  try {
    const tester = await requireRole('TESTER')

    if (!tester.testerProfile) {
      return notFound('Tester profile')
    }

    const body = await validateBody(request, ReportMissionSchema)

    const assignment = await prisma.missionAssignment.findFirst({
      where: {
        id: context.params.assignmentId,
        testerId: tester.testerProfile.id,
      },
      select: {
        missionId: true,
      },
    })

    if (!assignment) {
      return notFound('Assignment')
    }

    const existingReport = await prisma.missionReport.findUnique({
      where: {
        missionId_testerId: {
          missionId: assignment.missionId,
          testerId: tester.testerProfile.id,
        },
      },
      select: {
        id: true,
      },
    })

    if (existingReport) {
      return apiError('Mission already reported', 'ALREADY_REPORTED', 409)
    }

    await prisma.$transaction(async (tx) => {
      await tx.missionReport.create({
        data: {
          missionId: assignment.missionId,
          testerId: tester.testerProfile!.id,
          reason: body.reason,
        },
      })

      const updatedMission = await tx.mission.update({
        where: { id: assignment.missionId },
        data: {
          reportCount: { increment: 1 },
        },
        select: {
          id: true,
          reportCount: true,
        },
      })

      if (updatedMission.reportCount >= 3) {
        await tx.mission.update({
          where: { id: updatedMission.id },
          data: {
            status: MissionStatus.PAUSED,
            pausedAt: new Date(),
          },
        })
      }
    })

    return ok({ reported: true })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
