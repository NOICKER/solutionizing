export const dynamic = 'force-dynamic'
import { FlagStatus, Role } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, apiError, notFound, serverError } from '@/lib/api/response'
import { validateBody } from '@/lib/api/validate'
import { logApiRouteError } from '@/lib/api/log'
import { FLAG_REASON_VALUES } from '@/lib/flags'

const CreateMissionFlagSchema = z.object({
  assignmentId: z.string().trim().min(1),
  reason: z.enum(FLAG_REASON_VALUES),
  details: z.string().trim().max(300).optional(),
})

export async function POST(
  request: Request,
  context: { params: { missionId: string } }
) {
  try {
    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    const body = await validateBody(request, CreateMissionFlagSchema)

    const assignment = await prisma.missionAssignment.findFirst({
      where: {
        id: body.assignmentId,
        missionId: context.params.missionId,
        mission: {
          founderId: founder.founderProfile.id,
        },
      },
      select: {
        id: true,
        missionId: true,
        tester: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!assignment) {
      return notFound('Assignment')
    }

    const existingFlag = await prisma.missionFlag.findUnique({
      where: {
        assignmentId_reporterUserId_reason: {
          assignmentId: assignment.id,
          reporterUserId: founder.id,
          reason: body.reason,
        },
      },
      select: {
        id: true,
      },
    })

    if (existingFlag) {
      return apiError('This flag has already been added for the assignment.', 'FLAG_ALREADY_EXISTS', 409)
    }

    const createdFlag = await prisma.missionFlag.create({
      data: {
        missionId: assignment.missionId,
        assignmentId: assignment.id,
        reporterUserId: founder.id,
        targetUserId: assignment.tester.userId,
        reporterRole: Role.FOUNDER,
        targetRole: Role.TESTER,
        reason: body.reason,
        details: body.details?.trim() ? body.details.trim() : null,
        status: FlagStatus.PENDING,
      },
    })

    return ok({ flagged: true, flagId: createdFlag.id })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
