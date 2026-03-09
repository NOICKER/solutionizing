"use client"

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { differenceInHours } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { RequireAuth } from '@/components/RequireAuth'
import { ApiTesterAssignmentDetail, ApiTesterStats } from '@/types/api'
import { ConfirmationDialog, NotFoundPanel, SpinnerIcon, formatCoins, formatRupeesFromCoins, primaryButtonClass, textFieldClass } from '@/components/solutionizing/ui'
import { useAuth } from '@/context/AuthContext'

type WorkspacePhase = 'briefing' | 'questions' | 'review' | 'success'

interface SuccessState {
  coinsEarned: number
  newTier?: string | null
  stats: ApiTesterStats | null
}

function IssueModal({
  value,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: {
  value: string
  onChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
  isSubmitting: boolean
  errorMessage: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,22,37,0.55)] p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <h2 className="mb-2 text-2xl font-black text-[#1a1625]">Report an issue with this mission</h2>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={5}
          className={`${textFieldClass} resize-none`}
        />
        {errorMessage ? <p className="mt-2 text-sm text-red-600">{errorMessage}</p> : null}
        <div className="mt-6 flex items-center gap-3">
          <button className="flex-1 rounded-[2rem] border border-[#e5e4e0] bg-[#f3f3f5] py-3 font-black text-[#1a1625]" onClick={onClose}>
            CANCEL
          </button>
          <button className={`flex flex-1 items-center justify-center gap-2 py-3 ${primaryButtonClass}`} disabled={isSubmitting} onClick={onSubmit}>
            {isSubmitting ? <SpinnerIcon className="w-4 h-4" /> : null}
            SUBMIT REPORT
          </button>
        </div>
      </div>
    </div>
  )
}

export function TesterWorkspacePage({ assignmentId }: { assignmentId: string }) {
  const router = useRouter()
  const { refetch } = useAuth()
  const [assignment, setAssignment] = useState<ApiTesterAssignmentDetail | null>(null)
  const [phase, setPhase] = useState<WorkspacePhase>('briefing')
  const [answers, setAnswers] = useState<Record<number, string | number>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [currentError, setCurrentError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)
  const [startError, setStartError] = useState('')
  const [startLoading, setStartLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [successState, setSuccessState] = useState<SuccessState | null>(null)
  const [redirectCountdown, setRedirectCountdown] = useState(5)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportText, setReportText] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState('')

  const loadAssignment = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await apiFetch<ApiTesterAssignmentDetail>(`/api/v1/tester/assignments/${assignmentId}`)
      setAssignment(response)
      setPhase(response.status === 'IN_PROGRESS' ? 'questions' : 'briefing')
      setIsNotFound(false)
    } catch (error) {
      if (isApiClientError(error) && error.status === 404) {
        setIsNotFound(true)
      }
    } finally {
      setIsLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    void loadAssignment()
  }, [loadAssignment])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (phase === 'questions') {
        event.preventDefault()
        event.returnValue = 'Your progress may be lost if you leave.'
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [phase])

  useEffect(() => {
    if (phase !== 'success') {
      return
    }

    if (redirectCountdown <= 0) {
      router.push('/dashboard/tester')
      return
    }

    const timer = window.setTimeout(() => setRedirectCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [phase, redirectCountdown, router])

  const questions = useMemo(
    () => [...(assignment?.mission.questions ?? [])].sort((left, right) => left.order - right.order),
    [assignment?.mission.questions]
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-64 animate-pulse rounded-3xl bg-white" />
          <div className="h-64 animate-pulse rounded-3xl bg-white" />
        </div>
      </div>
    )
  }

  if (isNotFound || !assignment) {
    return <NotFoundPanel title="Assignment not found" backHref="/dashboard/tester" />
  }

  if (assignment.status === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-3 text-3xl font-black text-[#1a1625]">You already completed this mission.</h1>
          <Link href="/dashboard/tester" className={`px-8 py-3.5 ${primaryButtonClass}`}>BACK TO DASHBOARD</Link>
        </div>
      </div>
    )
  }

  if (assignment.status === 'TIMED_OUT' || assignment.status === 'ABANDONED' || assignment.status === 'MISSION_FULL') {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-3 text-3xl font-black text-[#1a1625]">This mission is no longer available.</h1>
          <Link href="/dashboard/tester" className={`px-8 py-3.5 ${primaryButtonClass}`}>BACK TO DASHBOARD</Link>
        </div>
      </div>
    )
  }

  const activeAssignment = assignment
  const hoursLeft = differenceInHours(new Date(assignment.timeoutAt), new Date())
  const current = questions[currentQuestion]

  async function handleStart() {
    setStartError('')
    setStartLoading(true)

    try {
      await apiFetch(`/api/v1/tester/assignments/${activeAssignment.id}/start`, { method: 'POST' })
      setPhase('questions')
    } catch (error) {
      if (isApiClientError(error) && error.code === 'ASSIGNMENT_EXPIRED') {
        setStartError('This mission has expired.')
      } else {
        setStartError('Something went wrong. Try again.')
      }
    } finally {
      setStartLoading(false)
    }
  }

  function validateCurrentQuestion() {
    const answer = answers[currentQuestion]

    if (current.isRequired && (answer === undefined || answer === '')) {
      return 'Please answer this question to continue'
    }

    if (current.type === 'TEXT_SHORT' && typeof answer === 'string' && answer.trim().length < 6) {
      return 'Please answer this question to continue'
    }

    if (current.type === 'TEXT_LONG' && typeof answer === 'string' && answer.trim().length < 11) {
      return 'Please answer this question to continue'
    }

    return ''
  }

  function handleNextQuestion() {
    const error = validateCurrentQuestion()
    setCurrentError(error)

    if (error) {
      return
    }

    if (currentQuestion === questions.length - 1) {
      setPhase('review')
      return
    }

    setCurrentQuestion((value) => value + 1)
  }

  async function handleSubmitFeedback() {
    setSubmitError('')
    setSubmitLoading(true)

    try {
      const responses = questions.map((question, index) => {
        const answer = answers[index]

        return {
          questionId: question.id,
          responseText:
            question.type === 'TEXT_SHORT' || question.type === 'TEXT_LONG'
              ? String(answer ?? '')
              : undefined,
          responseRating: question.type === 'RATING_1_5' ? Number(answer) : undefined,
          responseChoice:
            question.type === 'MULTIPLE_CHOICE' || question.type === 'YES_NO'
              ? String(answer ?? '')
              : undefined,
        }
      })

      const response = await apiFetch<{ coinsEarned: number; newTier?: string }>(
        `/api/v1/tester/assignments/${activeAssignment.id}/submit`,
        {
          method: 'POST',
          body: { responses },
        }
      )

      const stats = await apiFetch<ApiTesterStats>('/api/v1/tester/stats').catch(() => null)
      await refetch()
      setSuccessState({ coinsEarned: response.coinsEarned, newTier: response.newTier, stats })
      setPhase('success')
    } catch (error) {
      if (isApiClientError(error)) {
        if (error.code === 'MISSION_FULL' && error.status === 409) {
          setSubmitError("This mission just filled up. If your submission was accepted you'll still receive your coins.")
        } else if (error.status === 400) {
          setSubmitError(error.message)
        } else if (error.code === 'NETWORK_ERROR') {
          setSubmitError('Submission failed. Your answers are saved. Try again.')
        } else {
          setSubmitError('Submission failed. Your answers are saved. Try again.')
        }
      } else {
        setSubmitError('Submission failed. Your answers are saved. Try again.')
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleReportIssue() {
    if (reportText.trim().length < 10) {
      setReportError('Describe the issue in at least 10 characters')
      return
    }

    setReportLoading(true)
    setReportError('')

    try {
      await apiFetch(`/api/v1/tester/assignments/${activeAssignment.id}/report`, {
        method: 'POST',
        body: { reason: reportText.trim() },
      })
      setReportOpen(false)
      setReportText('')
      toast.info('Issue reported. Thank you.')
    } catch {
      setReportError('Something went wrong. Try again.')
    } finally {
      setReportLoading(false)
    }
  }

  if (phase === 'briefing') {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8">
        <div className="mx-auto max-w-4xl rounded-2xl bg-[#faf9f7] p-12">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">MISSION ASSIGNED</div>
            <h1 className="mb-3 text-4xl font-black text-[#1a1625]">{assignment.mission.title}</h1>
            <p className="mx-auto max-w-2xl text-lg text-[#6b687a]">{assignment.mission.goal}</p>
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6 text-center">
              <div className="mb-2 text-sm text-[#9b98a8]">REWARD</div>
              <div className="mb-1 text-3xl font-black text-[#1a1625]">{formatCoins(assignment.mission.coinPerTester)}</div>
              <div className="text-sm text-[#6b687a]">coins (≈ {formatRupeesFromCoins(assignment.mission.coinPerTester)})</div>
            </div>
            <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6 text-center">
              <div className="mb-2 text-sm text-[#9b98a8]">ESTIMATED TIME</div>
              <div className="mb-1 text-3xl font-black text-[#1a1625]">{assignment.mission.estimatedMinutes}</div>
              <div className="text-sm text-[#6b687a]">minutes</div>
            </div>
            <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6 text-center">
              <div className="mb-2 text-sm text-[#9b98a8]">EXPIRES IN</div>
              <div className="mb-1 text-3xl font-black text-amber-600">{hoursLeft}</div>
              <div className="text-sm text-[#6b687a]">hours</div>
            </div>
          </div>

          <div className="mb-8 rounded-3xl border border-[#e5e4e0] bg-white p-8">
            <h2 className="mb-6 text-xl font-black text-[#1a1625]">What you'll be testing</h2>
            <div className="space-y-4">
              {assignment.mission.assets.map((asset, index) => (
                <div key={index} className="flex items-center gap-4 rounded-2xl bg-[#faf9f7] p-4">
                  <div className="flex-1">
                    <div className="mb-1 text-sm font-semibold text-[#1a1625]">{asset.label || asset.type.replaceAll('_', ' ')}</div>
                    <div className="text-sm text-[#6b687a]">
                      {asset.type === 'TEXT_DESCRIPTION' ? asset.url : asset.url}
                    </div>
                  </div>
                  {asset.type === 'TEXT_DESCRIPTION' ? null : (
                    <a href={asset.url} target="_blank" rel="noreferrer" className="rounded-[2rem] bg-blue-600 px-6 py-2.5 font-bold text-white transition-all hover:shadow-lg hover:scale-105">
                      {asset.type === 'LINK' ? 'OPEN →' : 'VIEW →'}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {hoursLeft < 2 ? <div className="mb-8 rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-800">This mission will expire soon. Make sure to complete it before the deadline to receive your coins.</div> : null}

          {startError ? <p className="mb-4 text-sm text-red-600">{startError}</p> : null}

          <div className="flex items-center justify-between">
            <Link href="/dashboard/tester" className="font-semibold text-[#6b687a] hover:text-[#1a1625]">← Back to dashboard</Link>
            <button className={`flex items-center gap-2 px-12 py-4 text-lg ${primaryButtonClass}`} disabled={startLoading} onClick={() => void handleStart()}>
              {startLoading ? <SpinnerIcon className="w-5 h-5" /> : null}
              BEGIN MISSION →
            </button>
          </div>

          <div className="mt-8 text-center">
            <button className="text-sm text-[#9b98a8] underline hover:text-[#6b687a]" onClick={() => setReportOpen(true)}>
              Report an issue with this mission
            </button>
          </div>

          {reportOpen ? <IssueModal value={reportText} onChange={setReportText} onClose={() => setReportOpen(false)} onSubmit={() => void handleReportIssue()} isSubmitting={reportLoading} errorMessage={reportError} /> : null}
        </div>
      </div>
    )
  }

  if (phase === 'questions') {
    const answer = answers[currentQuestion]
    const progress = (currentQuestion / Math.max(questions.length, 1)) * 100

    return (
      <div className="min-h-screen bg-[#faf9f7] p-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-[#faf9f7] p-8">
          <div className="mb-6">
            <div className="mb-2 text-sm text-[#6b687a]">Question {currentQuestion + 1} of {questions.length}</div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#f3f3f5]">
              <div className="h-full rounded-full bg-[#d77a57]" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mb-6">
            <div className="inline-flex rounded-full bg-[#d77a57]/10 px-3 py-1 text-sm font-bold text-[#d77a57]">{assignment.mission.title}</div>
          </div>

          <div className="mb-6 rounded-3xl border border-[#e5e4e0] bg-white p-8">
            <h2 className="mb-6 text-2xl font-black text-[#1a1625]">{current.text}</h2>

            {(current.type === 'TEXT_SHORT' || current.type === 'TEXT_LONG') ? (
              <div className="relative">
                <textarea
                  value={typeof answer === 'string' ? answer : ''}
                  onChange={(event) => setAnswers((currentAnswers) => ({ ...currentAnswers, [currentQuestion]: event.target.value }))}
                  rows={current.type === 'TEXT_LONG' ? 6 : 4}
                  maxLength={current.type === 'TEXT_LONG' ? 1000 : 500}
                  placeholder={current.type === 'TEXT_LONG' ? 'Share your detailed thoughts...' : 'Your answer...'}
                  className={`${textFieldClass} resize-none`}
                />
                <div className="absolute bottom-3 right-3 text-sm text-[#9b98a8]">
                  {String(answer ?? '').length} / {current.type === 'TEXT_LONG' ? 1000 : 500}
                </div>
              </div>
            ) : null}

            {current.type === 'RATING_1_5' ? (
              <div className="flex flex-col items-center">
                <div className="mb-3 flex items-center gap-2">
                  {Array.from({ length: 5 }, (_, index) => {
                    const value = index + 1
                    const selected = Number(answer ?? 0) >= value
                    return (
                      <button key={value} type="button" onClick={() => setAnswers((currentAnswers) => ({ ...currentAnswers, [currentQuestion]: value }))}>
                        <svg className={`w-12 h-12 ${selected ? 'text-amber-400 fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {current.type === 'MULTIPLE_CHOICE' ? (
              <div className="space-y-3">
                {(current.options ?? []).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAnswers((currentAnswers) => ({ ...currentAnswers, [currentQuestion]: option }))}
                    className={`w-full rounded-2xl border-2 p-4 text-left ${answer === option ? 'border-[#d77a57] bg-[#fdf8f6]' : 'border-[#e5e4e0] bg-white'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}

            {current.type === 'YES_NO' ? (
              <div className="grid gap-4 md:grid-cols-2">
                {['yes', 'no'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAnswers((currentAnswers) => ({ ...currentAnswers, [currentQuestion]: option }))}
                    className={`rounded-2xl border-2 p-4 text-lg ${answer === option ? 'border-[#d77a57] bg-[#fdf8f6] font-black text-[#d77a57]' : 'border-[#e5e4e0] bg-white text-[#1a1625]'}`}
                  >
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {currentError ? <p className="mb-4 text-sm text-red-600">{currentError}</p> : null}

          <div className="mb-4 flex items-center justify-between">
            <button className="font-semibold text-[#6b687a] hover:text-[#1a1625]" onClick={() => setCurrentQuestion((value) => Math.max(0, value - 1))}>← Back</button>
            <button className={`px-8 py-3.5 ${primaryButtonClass}`} onClick={handleNextQuestion}>
              {currentQuestion === questions.length - 1 ? 'REVIEW ANSWERS →' : 'NEXT →'}
            </button>
          </div>

          <div className="text-center">
            <button className="text-sm text-[#9b98a8] underline hover:text-[#6b687a]" onClick={() => setReportOpen(true)}>
              Report an issue with this mission
            </button>
          </div>

          {reportOpen ? <IssueModal value={reportText} onChange={setReportText} onClose={() => setReportOpen(false)} onSubmit={() => void handleReportIssue()} isSubmitting={reportLoading} errorMessage={reportError} /> : null}
        </div>
      </div>
    )
  }

  if (phase === 'review') {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8">
        <div className="mx-auto max-w-5xl rounded-2xl bg-[#faf9f7] p-12">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">STEP 5 OF 5</div>
            <h1 className="mb-3 text-4xl font-black text-[#1a1625]">Review Your Answers</h1>
          </div>

          <div className="mb-8 space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 text-sm font-bold text-[#d77a57]">QUESTION {index + 1}</div>
                    <h3 className="mb-3 text-lg font-black text-[#1a1625]">{question.text}</h3>
                    <p className="rounded-2xl bg-[#faf9f7] p-4 text-[#1a1625]">{String(answers[index] ?? '')}</p>
                  </div>
                  <button className="text-sm font-semibold text-[#d77a57] hover:underline" onClick={() => { setCurrentQuestion(index); setPhase('questions') }}>
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-8 rounded-3xl border border-green-100 bg-gradient-to-br from-green-50 to-blue-50 p-8">
            <h3 className="mb-1 text-xl font-black text-[#1a1625]">You're about to earn</h3>
            <p className="text-3xl font-black text-green-600">
              {formatCoins(assignment.mission.coinPerTester)} coins <span className="text-lg text-[#6b687a]">(≈ {formatRupeesFromCoins(assignment.mission.coinPerTester)})</span>
            </p>
          </div>

          {submitError ? <p className="mb-4 text-sm text-red-600">{submitError}</p> : null}

          <div className="flex items-center justify-between">
            <button className="font-semibold text-[#6b687a] hover:text-[#1a1625]" onClick={() => setPhase('questions')}>
              ← Previous Question
            </button>
            <button className={`flex items-center gap-2 px-12 py-4 text-lg ${primaryButtonClass}`} disabled={submitLoading} onClick={() => void handleSubmitFeedback()}>
              {submitLoading ? <SpinnerIcon className="w-5 h-5" /> : null}
              SUBMIT FEEDBACK →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] p-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 p-12 text-center">
        <div className="mb-6 inline-flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
          <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-3 text-4xl font-black text-[#1a1625]">Mission Complete!</h1>
        <p className="mb-8 text-lg text-[#6b687a]">Thank you for your valuable feedback</p>

        <div className="mx-auto mb-8 max-w-md rounded-3xl border border-green-100 bg-white p-8 shadow-xl">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500">
              <svg className="w-9 h-9 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07-.34-.433.582a2.305 2.305 0 01-.567.267z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="mb-1 text-sm text-[#9b98a8]">YOU EARNED</div>
              <div className="text-4xl font-black text-[#1a1625]">{formatCoins(successState?.coinsEarned ?? 0)} coins earned</div>
              <div className="text-sm text-[#6b687a]">≈ {formatRupeesFromCoins(successState?.coinsEarned ?? 0)}</div>
            </div>
          </div>
        </div>

        {successState?.newTier ? <div className="mx-auto mb-8 max-w-md rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-100 to-pink-100 p-6 text-sm font-bold text-purple-900">You&apos;re now a {successState.newTier} tester!</div> : null}

        <div className="mx-auto mb-8 grid max-w-md gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white bg-white/50 p-4"><div className="text-2xl font-black text-[#1a1625]">{successState?.stats?.totalCompleted ?? 0}</div><div className="text-xs text-[#6b687a]">Total missions</div></div>
          <div className="rounded-2xl border border-white bg-white/50 p-4"><div className="text-2xl font-black text-[#1a1625]">{formatCoins(successState?.stats?.coinBalance ?? 0)}</div><div className="text-xs text-[#6b687a]">Total coins</div></div>
          <div className="rounded-2xl border border-white bg-white/50 p-4"><div className="text-2xl font-black text-green-600">{successState?.stats?.completionRate ?? 0}%</div><div className="text-xs text-[#6b687a]">Success rate</div></div>
        </div>

        <button className={`mb-4 px-10 py-3.5 ${primaryButtonClass}`} onClick={() => router.push('/dashboard/tester')}>
          BACK TO DASHBOARD
        </button>
        <p className="text-sm text-[#6b687a]">Redirecting in <span className="font-bold text-[#1a1625]">{redirectCountdown}</span>s...</p>
      </div>
    </div>
  )
}

export function TesterWorkspaceRoutePage({ assignmentId }: { assignmentId: string }) {
  return (
    <RequireAuth role="TESTER">
      <TesterWorkspacePage assignmentId={assignmentId} />
    </RequireAuth>
  )
}
