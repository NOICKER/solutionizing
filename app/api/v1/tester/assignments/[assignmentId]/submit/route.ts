import { AssignmentStatus, MissionStatus, QuestionType } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, apiError, badRequest, notFound, serverError } from '@/lib/api/response'
import { validateBody } from '@/lib/api/validate'
import { updateReputation } from '@/lib/business/reputation'

const SubmissionResponseSchema = z.object({
  questionId: z.string().cuid(),
  responseText: z.string().max(1000).optional(),
  responseRating: z.number().int().min(1).max(5).optional(),
  responseChoice: z.string().max(100).optional(),
  timeTakenSeconds: z.number().int().min(0).max(600).optional(),
})

const SubmitAssignmentSchema = z.object({
  responses: z.array(SubmissionResponseSchema),
})

type SubmitAssignmentResult =
  | {
      outcome: 'mission_full'
    }
  | {
      outcome: 'completed'
      coinsEarned: number
    }

function validateSubmissionResponses(
  questions: Array<{
    id: string
    type: QuestionType
    options: string[]
    isRequired: boolean
  }>,
  responses: Array<{
    questionId: string
    responseText?: string
    responseRating?: number
    responseChoice?: string
    timeTakenSeconds?: number
  }>
) {
  const questionMap = new Map(questions.map((question) => [question.id, question]))
  const responseMap = new Map<
    string,
    {
      questionId: string
      responseText?: string
      responseRating?: number
      responseChoice?: string
      timeTakenSeconds?: number
    }
  >()

  for (const response of responses) {
    if (responseMap.has(response.questionId)) {
      throw badRequest('Duplicate responses are not allowed', {
        questionId: response.questionId,
      })
    }

    const question = questionMap.get(response.questionId)

    if (!question) {
      throw badRequest('Submission contains an unknown question', {
        questionId: response.questionId,
      })
    }

    responseMap.set(response.questionId, response)
  }

  for (const question of questions) {
    if (question.isRequired && !responseMap.has(question.id)) {
      throw badRequest('Missing response for required question', {
        questionId: question.id,
      })
    }
  }

  for (const response of responses) {
    const question = questionMap.get(response.questionId)

    if (!question) {
      throw badRequest('Submission contains an unknown question', {
        questionId: response.questionId,
      })
    }

    const responseText = response.responseText?.trim()
    const responseChoice = response.responseChoice?.trim()

    switch (question.type) {
      case QuestionType.TEXT_SHORT:
        if (!responseText || responseText.length < 5) {
          throw badRequest('Short text responses must be at least 5 characters', {
            questionId: question.id,
          })
        }
        break
      case QuestionType.TEXT_LONG:
        if (!responseText || responseText.length < 10) {
          throw badRequest('Long text responses must be at least 10 characters', {
            questionId: question.id,
          })
        }
        break
      case QuestionType.RATING_1_5:
        if (
          response.responseRating === undefined ||
          response.responseRating < 1 ||
          response.responseRating > 5
        ) {
          throw badRequest('Rating responses must be between 1 and 5', {
            questionId: question.id,
          })
        }
        break
      case QuestionType.MULTIPLE_CHOICE:
        if (!responseChoice || !question.options.includes(responseChoice)) {
          throw badRequest('Multiple choice response is invalid', {
            questionId: question.id,
          })
        }
        break
      case QuestionType.YES_NO:
        if (responseChoice !== 'yes' && responseChoice !== 'no') {
          throw badRequest('Yes/no responses must be exactly "yes" or "no"', {
            questionId: question.id,
          })
        }
        break
      default:
        break
    }
  }
}

export async function POST(
  request: Request,
  context: { params: { assignmentId: string } }
) {
  try {
    const tester = await requireRole('TESTER')

    if (!tester.testerProfile) {
      return notFound('Tester profile')
    }

    const body = await validateBody(request, SubmitAssignmentSchema)

    const result = await prisma.$transaction<SubmitAssignmentResult>(async (tx) => {
      const assignment = await tx.missionAssignment.findFirst({
        where: {
          id: context.params.assignmentId,
          testerId: tester.testerProfile!.id,
        },
        select: {
          id: true,
          missionId: true,
          testerId: true,
          status: true,
        },
      })

      if (!assignment) {
        throw notFound('Assignment')
      }

      if (assignment.status !== AssignmentStatus.IN_PROGRESS) {
        throw apiError(
          'Assignment must be in progress before submission',
          'ASSIGNMENT_NOT_IN_PROGRESS',
          400
        )
      }

      const mission = await tx.mission.findUnique({
        where: { id: assignment.missionId },
        select: {
          id: true,
          title: true,
          status: true,
          coinPerTester: true,
          testersCompleted: true,
          testersRequired: true,
        },
      })

      if (!mission) {
        throw notFound('Mission')
      }

      if (mission.testersCompleted >= mission.testersRequired) {
        await tx.missionAssignment.update({
          where: { id: assignment.id },
          data: {
            status: AssignmentStatus.MISSION_FULL,
          },
        })

        await tx.testerProfile.update({
          where: { id: tester.testerProfile!.id },
          data: {
            isAvailable: true,
          },
        })

        return { outcome: 'mission_full' }
      }

      const questions = await tx.missionQuestion.findMany({
        where: { missionId: mission.id },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          type: true,
          options: true,
          isRequired: true,
        },
      })

      validateSubmissionResponses(questions, body.responses)

      const now = new Date()

      await tx.missionResponse.createMany({
        data: body.responses.map((response) => ({
          assignmentId: assignment.id,
          questionId: response.questionId,
          responseText: response.responseText?.trim() ?? null,
          responseRating: response.responseRating ?? null,
          responseChoice: response.responseChoice?.trim() ?? null,
          timeTakenSeconds: response.timeTakenSeconds ?? null,
        })),
      })

      await tx.missionAssignment.update({
        where: { id: assignment.id },
        data: {
          status: AssignmentStatus.COMPLETED,
          completedAt: now,
          coinsEarned: mission.coinPerTester,
        },
      })

      const updatedTesterProfile = await tx.testerProfile.update({
        where: { id: tester.testerProfile!.id },
        data: {
          coinBalance: { increment: mission.coinPerTester },
          totalCompleted: { increment: 1 },
          isAvailable: true,
          lastActiveAt: now,
        },
        select: {
          coinBalance: true,
        },
      })

      await tx.coinTransaction.create({
        data: {
          userId: tester.id,
          type: 'TESTER_EARN',
          amount: mission.coinPerTester,
          balanceAfter: updatedTesterProfile.coinBalance,
          description: `Mission completed: ${mission.title}`,
          missionId: mission.id,
          assignmentId: assignment.id,
        },
      })

      await tx.mission.update({
        where: { id: mission.id },
        data: {
          testersCompleted: { increment: 1 },
          ...(mission.testersCompleted + 1 >= mission.testersRequired
            ? {
                status: MissionStatus.COMPLETED,
                completedAt: now,
              }
            : {}),
        },
      })

      return {
        outcome: 'completed',
        coinsEarned: mission.coinPerTester,
      }
    })

    if (result.outcome === 'mission_full') {
      return apiError('Mission is already full', 'MISSION_FULL', 409)
    }

    const reputation = await updateReputation(tester.testerProfile.id, 'COMPLETION')

    return ok({
      coinsEarned: result.coinsEarned,
      newReputationScore: reputation.newScore,
      newTier: reputation.newTier,
    })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[tester:assignments:submit]', err)
    return serverError()
  }
}
