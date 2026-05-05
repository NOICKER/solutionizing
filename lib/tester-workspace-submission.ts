export type SubmissionMode = 'MANUAL' | 'TIMEOUT_AUTO'

export type SubmissionQuestion = {
  id: string
  type: 'TEXT_SHORT' | 'TEXT_LONG' | 'RATING_1_5' | 'MULTIPLE_CHOICE' | 'YES_NO'
  isRequired: boolean
  options?: string[]
}

export type SubmissionAnswerValue = string | number | undefined

export type SubmissionResponse = {
  questionId: string
  responseText?: string
  responseRating?: number
  responseChoice?: string
}

export const TIMEOUT_AUTO_SUBMIT_GRACE_PERIOD_MS = 15 * 1000

function getMinimumTextLength(type: SubmissionQuestion['type']) {
  if (type === 'TEXT_SHORT') {
    return 5
  }

  if (type === 'TEXT_LONG') {
    return 10
  }

  return null
}

function isMeaningfulTextAnswer(type: SubmissionQuestion['type'], answer: SubmissionAnswerValue) {
  const minimumTextLength = getMinimumTextLength(type)

  if (minimumTextLength === null) {
    return true
  }

  return typeof answer === 'string' && answer.trim().length >= minimumTextLength
}

export function buildSubmissionResponses({
  questions,
  answers,
  submissionMode,
}: {
  questions: SubmissionQuestion[]
  answers: Record<number, SubmissionAnswerValue>
  submissionMode: SubmissionMode
}) {
  return questions.reduce<SubmissionResponse[]>((responses, question, index) => {
    const answer = answers[index]
    const trimmedTextAnswer = typeof answer === 'string' ? answer.trim() : ''
    const isTextQuestion = question.type === 'TEXT_SHORT' || question.type === 'TEXT_LONG'
    const isAnswerEmpty = isTextQuestion
      ? trimmedTextAnswer.length === 0
      : answer === undefined || answer === ''

    if (isAnswerEmpty) {
      return responses
    }

    if (submissionMode === 'TIMEOUT_AUTO' && !isMeaningfulTextAnswer(question.type, answer)) {
      return responses
    }

    responses.push({
      questionId: question.id,
      ...(isTextQuestion ? { responseText: trimmedTextAnswer } : {}),
      ...(question.type === 'RATING_1_5' ? { responseRating: Number(answer) } : {}),
      ...(question.type === 'MULTIPLE_CHOICE' || question.type === 'YES_NO'
        ? { responseChoice: String(answer ?? '') }
        : {}),
    })

    return responses
  }, [])
}

export function shouldAllowTimeoutAutoSubmit({
  now,
  status,
  timeoutAt,
  timedOutAt,
  gracePeriodMs = TIMEOUT_AUTO_SUBMIT_GRACE_PERIOD_MS,
}: {
  now: Date
  status: 'IN_PROGRESS' | 'TIMED_OUT'
  timeoutAt: Date
  timedOutAt: Date | null
  gracePeriodMs?: number
}) {
  if (status === 'IN_PROGRESS') {
    return Math.abs(now.getTime() - timeoutAt.getTime()) <= gracePeriodMs
  }

  if (!timedOutAt) {
    return false
  }

  return now.getTime() - timedOutAt.getTime() <= gracePeriodMs
}
