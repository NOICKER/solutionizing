"use client"

import Link from 'next/link'
import { format } from 'date-fns'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { ApiFeedbackQuestion, ApiMissionDetail, ApiMissionFeedback } from '@/types/api'
import { NotFoundPanel, primaryButtonClass } from '@/components/solutionizing/ui'

function formatStatusLabel(status: string) {
  return status.replaceAll('_', ' ')
}

function formatDuration(totalSeconds: number | null | undefined) {
  if (!totalSeconds || totalSeconds <= 0) {
    return '0m 0s'
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)

  return `${minutes}m ${seconds}s`
}

function truncateResponse(value: string, maxLength = 120) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength).trimEnd()}...`
}

function getQuestionMeasureCopy(question: ApiFeedbackQuestion) {
  if (question.type === 'RATING_1_5') {
    return 'Responses were scored on a 1 to 5 scale to capture sentiment intensity.'
  }

  if (question.type === 'MULTIPLE_CHOICE') {
    return 'Multiple choice responses reveal which option delivered the strongest value signal.'
  }

  if (question.type === 'YES_NO') {
    return 'Binary responses show clear directional preference at a glance.'
  }

  return 'Open-ended responses explain the reasoning behind the headline metrics.'
}

function StarRow({
  value,
  size = 'h-4 w-4',
}: {
  value: number
  size?: string
}) {
  const roundedValue = Math.round(value)

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < roundedValue

        return (
          <svg
            key={index}
            className={`${size} ${filled ? 'text-[#d77a57]' : 'text-[#e6ddd4]'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      })}
    </div>
  )
}

function SummaryStatCard({
  label,
  value,
  chip,
  footer,
}: {
  label: string
  value: string
  chip?: string
  footer?: ReactNode
}) {
  return (
    <div className="rounded-[1.75rem] border border-[#ece3da] bg-white/95 p-5 shadow-[0_18px_50px_-40px_rgba(26,22,37,0.3)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#9b98a8]">
          {label}
        </div>
        {chip ? (
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-emerald-600">
            {chip}
          </div>
        ) : null}
      </div>
      <div className="text-3xl font-black text-[#1a1625]">{value}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  )
}

function TextResponseCard({
  index,
  response,
}: {
  index: number
  response: string
}) {
  const testerName = `Tester ${index + 1}`

  return (
    <div className="rounded-[1.5rem] border border-[#eee5dd] bg-white p-4 shadow-[0_12px_35px_-30px_rgba(26,22,37,0.28)]">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f5ece6] text-xs font-black uppercase tracking-[0.16em] text-[#d77a57]">
          T{index + 1}
        </div>
        <div>
          <div className="text-sm font-bold text-[#1a1625]">{testerName}</div>
          <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a39ead]">
            Anonymous response
          </div>
        </div>
      </div>
      <p className="text-sm leading-6 text-[#4d4958]">{truncateResponse(response)}</p>
    </div>
  )
}

function TextResponsesPreview({
  questionId,
  responses,
}: {
  questionId: string
  responses: string[]
}) {
  const previewResponses = responses.slice(0, 3)
  const remainingCount = Math.max(responses.length - previewResponses.length, 0)

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {previewResponses.map((response, index) => (
          <TextResponseCard key={`${questionId}-${index}`} index={index} response={response} />
        ))}

        {remainingCount > 0 ? (
          <button
            type="button"
            className="flex min-h-[180px] items-center justify-center rounded-[1.5rem] border border-dashed border-[#e6d8cc] bg-[#fdf8f6] px-5 text-center text-sm font-black uppercase tracking-[0.18em] text-[#d77a57] transition-colors hover:bg-[#f7ede8]"
            onClick={() =>
              document
                .getElementById(`full-responses-${questionId}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          >
            {'... View '}
            {remainingCount}
            {' more'}
          </button>
        ) : null}
      </div>

      {remainingCount > 0 ? (
        <div
          id={`full-responses-${questionId}`}
          className="mt-6 scroll-mt-24 rounded-[1.5rem] border border-[#efe3da] bg-white px-4 py-5 sm:px-5"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-base font-black text-[#1a1625]">Full response list</h4>
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#9b98a8]">
              {responses.length} responses
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {responses.map((response, index) => (
              <TextResponseCard
                key={`full-${questionId}-${index}`}
                index={index}
                response={response}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function RatingBreakdown({
  question,
}: {
  question: Extract<ApiFeedbackQuestion, { type: 'RATING_1_5' }>
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
      <div className="rounded-[1.5rem] border border-[#efe3da] bg-white p-5">
        <div className="text-5xl font-black leading-none text-[#d77a57]">
          {question.averageRating?.toFixed(1) ?? '0.0'}
        </div>
        <div className="mt-4">
          <StarRow value={question.averageRating ?? 0} size="h-5 w-5" />
        </div>
        <div className="mt-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a39ead]">
          Avg rating
        </div>
      </div>

      <div className="space-y-4">
        {question.distribution.map((item) => (
          <div
            key={`${question.questionId}-${item.rating}`}
            className="grid grid-cols-[32px_minmax(0,1fr)_48px] items-center gap-3"
          >
            <div className="text-sm font-bold text-[#6b687a]">{item.rating}*</div>
            <div className="h-3 overflow-hidden rounded-full bg-[#f0ede8]">
              <div
                className="h-full rounded-full bg-[#d77a57]"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <div className="text-right text-sm font-bold text-[#9b98a8]">
              {item.percentage.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChoiceBreakdown({
  question,
}: {
  question: Extract<ApiFeedbackQuestion, { type: 'MULTIPLE_CHOICE' | 'YES_NO' }>
}) {
  const sortedBreakdown = [...question.breakdown].sort((left, right) => right.percentage - left.percentage)

  return (
    <div className="space-y-4">
      {sortedBreakdown.map((item) => (
        <div key={`${question.questionId}-${item.option}`} className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-bold text-[#1a1625]">{item.option}</div>
            <div className="text-sm font-bold text-[#d77a57]">{item.percentage.toFixed(0)}%</div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#f0ede8]">
            <div
              className="h-full rounded-full bg-[#d77a57]"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function QuestionBreakdown({ question }: { question: ApiFeedbackQuestion }) {
  if (question.type === 'RATING_1_5') {
    return <RatingBreakdown question={question} />
  }

  if (question.type === 'MULTIPLE_CHOICE' || question.type === 'YES_NO') {
    return <ChoiceBreakdown question={question} />
  }

  if (question.type === 'TEXT_SHORT' || question.type === 'TEXT_LONG') {
    return (
      <TextResponsesPreview
        questionId={question.questionId}
        responses={question.allResponses}
      />
    )
  }

  return null
}

export function MissionInsightsPage({ missionId }: { missionId: string }) {
  const [mission, setMission] = useState<ApiMissionDetail | null>(null)
  const [feedback, setFeedback] = useState<ApiMissionFeedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)
  const [notReady, setNotReady] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setNotReady(false)

    try {
      const [missionResponse, feedbackResponse] = await Promise.all([
        apiFetch<ApiMissionDetail>(`/api/v1/missions/${missionId}`),
        apiFetch<ApiMissionFeedback>(`/api/v1/missions/${missionId}/feedback`).catch((error) => {
          if (isApiClientError(error) && error.status === 400) {
            setNotReady(true)
            return null
          }

          throw error
        }),
      ])

      setMission(missionResponse)
      setFeedback(feedbackResponse)
      setIsNotFound(false)
    } catch (error) {
      if (isApiClientError(error) && error.status === 404) {
        setIsNotFound(true)
      }
    } finally {
      setIsLoading(false)
    }
  }, [missionId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px] space-y-6">
          <div className="h-5 w-32 animate-pulse rounded bg-[#eadfd5]" />
          <div className="rounded-[2rem] border border-[#ece3da] bg-white p-8">
            <div className="mb-5 h-6 w-24 animate-pulse rounded-full bg-[#f1e7df]" />
            <div className="mb-4 h-12 w-2/3 animate-pulse rounded bg-[#eadfd5]" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-[#f1e7df]" />
          </div>
          <div className="grid gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-[1.75rem] border border-[#ece3da] bg-white" />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-[2rem] border border-[#ece3da] bg-white" />
        </div>
      </div>
    )
  }

  if (isNotFound || !mission) {
    return <NotFoundPanel backHref="/dashboard/founder" />
  }

  if (mission.testersCompleted === 0 || notReady || !feedback) {
    return (
      <div className="min-h-screen bg-[#faf9f7] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center rounded-[2rem] border border-[#ece3da] bg-white px-8 py-12 text-center">
          <div className="mb-4 rounded-full bg-[#fdf0ea] px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#d77a57]">
            Mission report pending
          </div>
          <h1 className="mb-3 text-3xl font-black text-[#1a1625]">
            No results yet. Come back once testers have responded.
          </h1>
          <p className="mb-8 max-w-xl text-base leading-7 text-[#6b687a]">
            We will unlock the premium report once completed responses are available for this mission.
          </p>
          <Link href={`/mission/status/${missionId}`} className={`px-8 py-3.5 ${primaryButtonClass}`}>
            {'VIEW STATUS ->'}
          </Link>
        </div>
      </div>
    )
  }

  const clarityScore = feedback.summary.clarityScore ?? 0
  const confidenceScore = Math.round(clarityScore * 20)
  const lastUpdatedAt = mission.completedAt ?? mission.updatedAt ?? mission.createdAt
  const reportQuestions = [...feedback.byQuestion].sort((left, right) => left.order - right.order)
  const insightQuote =
    feedback.summary.representativeQuote ??
    'Representative insight will appear once more written feedback is available.'

  return (
    <div className="min-h-screen bg-[#faf9f7] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard/founder"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b687a] transition-colors hover:text-[#1a1625]"
          >
            {'<- Back to dashboard'}
          </Link>
          <Link
            href={`/mission/status/${missionId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#d77a57] transition-colors hover:text-[#bf6846]"
          >
            {'View mission status ->'}
          </Link>
        </div>

        <section className="rounded-[2rem] border border-[#ece3da] bg-white/95 p-6 shadow-[0_24px_70px_-50px_rgba(26,22,37,0.3)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#fdf0ea] px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#d77a57]">
                {formatStatusLabel(mission.status)} mission
              </div>
              <h1 className="max-w-4xl text-4xl font-black leading-[1.05] text-[#1a1625] sm:text-5xl">
                {mission.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#6b687a]">{mission.goal}</p>
            </div>

            <button
              type="button"
              className={`inline-flex items-center justify-center px-6 py-3 text-sm ${primaryButtonClass}`}
              onClick={() => window.print()}
            >
              Export Report
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.35fr)]">
          <SummaryStatCard
            label="Completed"
            value={feedback.summary.completedCount.toLocaleString()}
            chip="+ Live signal"
            footer={
              <div className="text-sm text-[#6b687a]">
                {mission.testersCompleted} completed testers contributed to this report.
              </div>
            }
          />
          <SummaryStatCard
            label="Avg Time"
            value={formatDuration(feedback.timingMetrics?.avgCompletionSeconds)}
            footer={
              <div className="text-sm text-[#6b687a]">
                Average completion time across the finished response set.
              </div>
            }
          />
          <SummaryStatCard
            label="Clarity Score"
            value={`${clarityScore.toFixed(1)}/5`}
            footer={<StarRow value={clarityScore} size="h-5 w-5" />}
          />

          <div className="relative overflow-hidden rounded-[1.75rem] border border-[#ecd9ce] bg-[#fdf8f6] p-6 shadow-[0_18px_50px_-40px_rgba(26,22,37,0.25)]">
            <div className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#9b98a8]">
              Key insight
            </div>
            <div className="pointer-events-none absolute right-5 top-5 text-6xl font-black text-[#e7b49f] opacity-60">
              &rdquo;
            </div>
            <div className="pointer-events-none absolute left-5 top-10 text-4xl font-black text-[#d77a57] opacity-75">
              &ldquo;
            </div>
            <p className="relative z-10 mt-10 text-lg font-semibold leading-8 text-[#1a1625]">
              {insightQuote}
            </p>
            <div className="mt-6 border-t border-[#edd8cc] pt-4 text-sm text-[#9b98a8]">
              <div className="font-bold text-[#d77a57]">Representative tester quote</div>
              <div className="mt-1">From {feedback.summary.completedCount} completed responses.</div>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-[#ece3da] bg-white/95 shadow-[0_24px_70px_-50px_rgba(26,22,37,0.28)]">
          <div className="border-b border-[#efe7df] px-6 py-5 sm:px-8">
            <h2 className="text-2xl font-black text-[#1a1625]">Result Breakdown</h2>
          </div>

          <div className="divide-y divide-[#efe7df]">
            {reportQuestions.map((question) => (
              <div
                key={question.questionId}
                className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)]"
              >
                <div>
                  <div className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#d77a57]">
                    {String(question.order).padStart(2, '0')}.
                  </div>
                  <h3 className="text-lg font-black leading-7 text-[#1a1625]">{question.text}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#8a8695]">
                    {getQuestionMeasureCopy(question)}
                  </p>
                </div>

                <div className="rounded-[1.75rem] bg-[#fcfaf7] p-5 sm:p-6">
                  <QuestionBreakdown question={question} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#efe7df] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[#9b98a8] sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>Last update: {format(new Date(lastUpdatedAt), 'MMM d, yyyy - hh:mm a')}</div>
            <div>Confidence score: {confidenceScore}%</div>
          </div>
        </section>
      </div>
    </div>
  )
}
