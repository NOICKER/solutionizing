"use client"

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { ApiMissionDetail, ApiMissionFeedback } from '@/types/api'
import { NotFoundPanel, primaryButtonClass } from '@/components/solutionizing/ui'

function renderStars(value: number) {
  return Array.from({ length: 5 }, (_, index) => index < Math.round(value))
}

export function MissionInsightsPage({ missionId }: { missionId: string }) {
  const [mission, setMission] = useState<ApiMissionDetail | null>(null)
  const [feedback, setFeedback] = useState<ApiMissionFeedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)
  const [notReady, setNotReady] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)

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
      <div className="min-h-screen bg-[#faf9f7] p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-6 w-40 animate-pulse rounded bg-[#e5e4e0]" />
          <div className="h-64 animate-pulse rounded-3xl bg-white" />
          <div className="h-64 animate-pulse rounded-3xl bg-white" />
        </div>
      </div>
    )
  }

  if (isNotFound || !mission) {
    return <NotFoundPanel backHref="/dashboard/founder" />
  }

  if (mission.testersCompleted === 0 || notReady || !feedback) {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center text-center">
          <h1 className="mb-3 text-3xl font-black text-[#1a1625]">No results yet. Come back once testers have responded.</h1>
          <Link href={`/mission/status/${missionId}`} className={`px-8 py-3.5 ${primaryButtonClass}`}>
            VIEW STATUS →
          </Link>
        </div>
      </div>
    )
  }

  const avgSeconds = feedback.timingMetrics?.avgCompletionSeconds ?? 0
  const minutes = Math.floor(avgSeconds / 60)
  const seconds = Math.round(avgSeconds % 60)

  return (
    <div className="min-h-screen bg-[#faf9f7] p-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard/founder" className="mb-6 inline-block font-semibold text-[#6b687a] transition-colors hover:text-[#1a1625]">
          ← Back to dashboard
        </Link>

        <div className="mb-8">
          <div className="mb-3 flex items-start justify-between">
            <h1 className="text-3xl font-black text-[#1a1625]">{mission.title} — Insights</h1>
            <div className="inline-flex rounded-full bg-green-100 px-4 py-1.5 text-sm font-bold text-green-700">
              {feedback.summary.completedCount} testers responded
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-[#e5e4e0] bg-white p-8">
          <div className="mb-6 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-1 text-3xl font-black text-[#1a1625]">{feedback.summary.completedCount}</div>
              <div className="text-sm text-[#6b687a]">responses</div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-3xl font-black text-[#1a1625]">
                {minutes}m {seconds}s
              </div>
              <div className="text-sm text-[#6b687a]">avg time</div>
            </div>
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center gap-1">
                {renderStars(feedback.summary.clarityScore ?? 0).map((filled, index) => (
                  <svg key={index} className={`w-6 h-6 ${filled ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="text-sm text-[#6b687a]">Clarity score: {feedback.summary.clarityScore ?? 0} / 5</div>
            </div>
          </div>

          {feedback.summary.representativeQuote ? (
            <div className="mt-6 rounded-2xl bg-[#faf9f7] p-6">
              <div className="mb-2 text-4xl text-[#d77a57]">"</div>
              <p className="mb-2 text-lg leading-relaxed text-[#1a1625]">{feedback.summary.representativeQuote}</p>
            </div>
          ) : null}
        </div>

        <div className="mb-8">
          <h2 className="mb-6 text-2xl font-black text-[#1a1625]">Responses by Question</h2>
          <div className="space-y-6">
            {feedback.byQuestion.map((question) => (
              <div key={question.questionId} className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
                <h3 className="mb-4 text-lg font-black text-[#1a1625]">{question.text}</h3>

                {question.type === 'RATING_1_5' ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {renderStars(question.averageRating ?? 0).map((filled, index) => (
                        <svg key={index} className={`w-7 h-7 ${filled ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xl font-black text-[#1a1625]">{question.averageRating ?? 0} / 5 average</span>
                  </div>
                ) : null}

                {question.type === 'MULTIPLE_CHOICE' || question.type === 'YES_NO' ? (
                  <div className="space-y-3">
                    {question.breakdown.map((option) => (
                      <div key={option.option} className="flex items-center gap-3">
                        <div className="h-8 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`flex h-full items-center rounded-full px-4 text-sm font-bold text-white ${question.type === 'YES_NO' ? (option.option.toLowerCase() === 'yes' ? 'bg-green-500' : 'bg-red-500') : 'bg-[#d77a57]'}`}
                            style={{ width: `${option.percentage}%` }}
                          >
                            {option.percentage}%
                          </div>
                        </div>
                        <span className="w-48 text-sm text-[#6b687a]">
                          {option.option} ({option.count})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {question.type === 'TEXT_SHORT' || question.type === 'TEXT_LONG' ? (
                  <div className="space-y-3">
                    {question.sampleResponses.map((response, index) => (
                      <div key={index} className="rounded-2xl border border-[#e5e4e0] bg-white p-4">
                        <p className="text-sm text-[#1a1625]">
                          {response.length > 150 ? `${response.slice(0, 150)}...` : response}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
          <Link href="/mission/wizard" className={`px-8 py-3.5 ${primaryButtonClass}`}>
            RUN ANOTHER MISSION →
          </Link>
          <button className="rounded-[2rem] border-2 border-[#d77a57] px-6 py-3 font-bold text-[#d77a57] transition-all hover:bg-[#d77a57] hover:text-white" onClick={() => window.print()}>
            Export as PDF
          </button>
          <Link href="/dashboard/founder" className="font-semibold text-[#6b687a] transition-colors hover:text-[#1a1625]">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
