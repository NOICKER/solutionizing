export const dynamic = 'force-dynamic'
import { QuestionType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { checkMissionContent } from '@/lib/safety/contentCheck'
import { logApiRouteError } from '@/lib/api/log'

async function findOwnedMission(missionId: string, founderId: string) {
  return prisma.mission.findFirst({
    where: { id: missionId, founderId },
    include: {
      assets: { orderBy: { order: 'asc' } },
      questions: { orderBy: { order: 'asc' } },
    },
  })
}

export async function POST(
  request: Request,
  context: { params: { missionId: string } }
) {
  try {
    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    const mission = await findOwnedMission(
      context.params.missionId,
      founder.founderProfile.id
    )

    if (!mission) {
      return notFound('Mission')
    }

    if (mission.status !== 'DRAFT') {
      return badRequest('Only draft missions can be submitted')
    }

    if (mission.assets.length < 1) {
      return badRequest('Mission must include at least one asset')
    }

    if (mission.questions.length < 1 || mission.questions.length > 6) {
      return badRequest('Mission must include between 1 and 6 questions')
    }

    const invalidMultipleChoiceQuestion = mission.questions.find((question) => {
      return (
        question.type === QuestionType.MULTIPLE_CHOICE &&
        (question.options.length < 2 || question.options.length > 5)
      )
    })

    if (invalidMultipleChoiceQuestion) {
      return badRequest('Multiple choice questions must include 2 to 5 options')
    }

    const contentResult = checkMissionContent(
      mission.title,
      mission.goal,
      mission.questions
    )

    if (!contentResult.safe) {
      return badRequest(contentResult.reason ?? 'Mission content failed safety review')
    }

    const updatedMission = await prisma.mission.update({
      where: { id: mission.id },
      data: { status: 'PENDING_REVIEW' },
      include: {
        assets: { orderBy: { order: 'asc' } },
        questions: { orderBy: { order: 'asc' } },
      },
    })

    return ok({ mission: updatedMission })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
