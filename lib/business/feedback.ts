import { AssignmentStatus, QuestionType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100
}

function percentage(count: number, total: number) {
  if (total === 0) return 0
  return roundToTwo((count / total) * 100)
}

function normalizeChoice(value: string) {
  return value.trim().toLowerCase()
}

export async function computeFeedback(missionId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      questions: { orderBy: { order: 'asc' } },
      assignments: {
        where: { status: AssignmentStatus.COMPLETED },
        include: { responses: true },
      },
    },
  })

  if (!mission) {
    throw new Error('Mission not found')
  }

  const completedAssignments = mission.assignments

  if (completedAssignments.length === 0) {
    return {
      summary: { completedCount: 0 },
      byQuestion: [],
      timingMetrics: null,
    }
  }

  const allResponses = completedAssignments.flatMap((assignment) => assignment.responses)
  const ratingValues = allResponses
    .map((response) => response.responseRating)
    .filter((value): value is number => value !== null)
  const yesNoQuestionIds = new Set(
    mission.questions
      .filter((question) => question.type === QuestionType.YES_NO)
      .map((question) => question.id)
  )
  const yesNoChoices = allResponses
    .filter((response) => {
      return yesNoQuestionIds.has(response.questionId) && response.responseChoice !== null
    })
    .map((response) => normalizeChoice(response.responseChoice!))
  const yesCount = yesNoChoices.filter((choice) => choice === 'yes').length
  const textResponses = allResponses
    .map((response) => response.responseText?.trim())
    .filter((value): value is string => Boolean(value))
  const representativeQuote =
    textResponses
      .filter((value) => value.length > 20)
      .sort((left, right) => right.length - left.length)[0] ?? null

  const byQuestion = mission.questions.map((question) => {
    const questionResponses = allResponses.filter(
      (response) => response.questionId === question.id
    )

    if (question.type === QuestionType.RATING_1_5) {
      const values = questionResponses
        .map((response) => response.responseRating)
        .filter((value): value is number => value !== null)

      return {
        questionId: question.id,
        order: question.order,
        text: question.text,
        type: question.type,
        responseCount: values.length,
        averageRating:
          values.length === 0
            ? null
            : roundToTwo(values.reduce((sum, value) => sum + value, 0) / values.length),
      }
    }

    if (
      question.type === QuestionType.MULTIPLE_CHOICE ||
      question.type === QuestionType.YES_NO
    ) {
      const optionLabels =
        question.type === QuestionType.YES_NO ? ['yes', 'no'] : question.options
      const choices = questionResponses
        .map((response) => response.responseChoice)
        .filter((value): value is string => value !== null)
        .map((value) => value.trim())

      return {
        questionId: question.id,
        order: question.order,
        text: question.text,
        type: question.type,
        responseCount: choices.length,
        breakdown: optionLabels.map((option) => {
          const normalizedOption =
            question.type === QuestionType.YES_NO ? normalizeChoice(option) : option.trim()
          const count = choices.filter((choice) => {
            const normalizedChoice =
              question.type === QuestionType.YES_NO ? normalizeChoice(choice) : choice.trim()
            return normalizedChoice === normalizedOption
          }).length

          return {
            option,
            count,
            percentage: percentage(count, choices.length),
          }
        }),
      }
    }

    const textSamples = questionResponses
      .map((response) => response.responseText?.trim())
      .filter((value): value is string => Boolean(value))

    return {
      questionId: question.id,
      order: question.order,
      text: question.text,
      type: question.type,
      responseCount: textSamples.length,
      sampleResponses: textSamples.slice(0, 5),
    }
  })

  const completionDurations = completedAssignments
    .filter((assignment) => assignment.startedAt !== null && assignment.completedAt !== null)
    .map((assignment) => {
      return Math.max(
        0,
        Math.round((assignment.completedAt!.getTime() - assignment.startedAt!.getTime()) / 1000)
      )
    })

  return {
    summary: {
      completedCount: completedAssignments.length,
      clarityScore:
        ratingValues.length === 0
          ? null
          : roundToTwo(ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length),
      recommendationLikelihood:
        yesNoChoices.length === 0 ? null : percentage(yesCount, yesNoChoices.length),
      representativeQuote,
    },
    byQuestion,
    timingMetrics: {
      avgCompletionSeconds:
        completionDurations.length === 0
          ? null
          : roundToTwo(
              completionDurations.reduce((sum, value) => sum + value, 0) /
                completionDurations.length
            ),
    },
  }
}
