"use client"

import { Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { differenceInSeconds } from 'date-fns'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { ApiTesterAssignmentDetail, ApiTesterStats } from '@/types/api'
import { NotFoundPanel, SpinnerIcon, StarRow, formatCoins, formatRupeesFromCoins, primaryButtonClass, textFieldClass } from '@/components/solutionizing/ui'
import { FlagSignalModal } from '@/components/solutionizing/FlagSignalModal'
import { useAuth } from '@/context/AuthContext'
import { type FlagReasonValue } from '@/lib/flags'

function formatTimeLeft(totalSeconds: number) {
  if (totalSeconds <= 0) return '0:00'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function TimesUpOverlay({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 max-w-lg rounded-3xl border border-red-900/50 bg-gray-900 p-10 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
          <Clock className="h-10 w-10 text-red-400" />
        </div>
        <h1 className="mb-3 text-3xl font-black text-white">Time&apos;s up!</h1>
        <p className="mb-8 text-base text-gray-400">Your mission has expired. Any partial answers were not submitted.</p>
        <button className={`px-10 py-4 text-lg ${primaryButtonClass}`} onClick={onReturn}>
          RETURN TO DASHBOARD
        </button>
      </div>
    </div>
  )
}

function OutboundLinkWarning({ url, onContinue, onCancel }: { url: string; onContinue: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 max-w-lg rounded-3xl border border-amber-900/50 bg-gray-900 p-8 shadow-2xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20">
          <ExternalLink className="h-7 w-7 text-amber-400" />
        </div>
        <h2 className="mb-2 text-center text-xl font-black text-white">External link</h2>
        <p className="mb-2 text-center text-sm text-gray-400">You are being redirected to an external product page. This link was provided by the founder.</p>
        <p className="mb-6 break-all rounded-xl bg-gray-800 p-3 text-center text-xs text-gray-300">{url}</p>
        <div className="flex gap-3">
          <button className="flex-1 rounded-[2rem] border-2 border-gray-700 px-5 py-3 font-black text-white transition-colors hover:bg-gray-800" onClick={onCancel}>
            CANCEL
          </button>
          <button className={`flex-1 px-5 py-3 ${primaryButtonClass}`} onClick={onContinue}>
            CONTINUE →
          </button>
        </div>
      </div>
    </div>
  )
}

type WorkspacePhase = 'briefing' | 'questions' | 'review' | 'success'

interface SuccessState {
  coinsEarned: number
  newTier?: string | null
  stats: ApiTesterStats | null
}

function TesterWorkspaceSkeleton() {
  const skeletonBar = 'animate-pulse rounded-full bg-[#e8e1da] dark:bg-gray-700'
  const skeletonBlock = 'animate-pulse rounded-3xl bg-[#f1ebe5] dark:bg-gray-800'

  return (
    <div className="min-h-screen bg-[#faf9f7] p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl rounded-panel bg-[#faf9f7] p-12 dark:bg-gray-900">
        <div className="mb-8 flex flex-col items-center space-y-4 text-center">
          <div className={`h-9 w-40 ${skeletonBar}`} />
          <div className={`h-12 w-full max-w-2xl rounded-[1.75rem] ${skeletonBar}`} />
          <div className={`h-5 w-full max-w-xl ${skeletonBar}`} />
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-card border border-[#e5e4e0] bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800"
            >
              <div className={`mx-auto h-3 w-20 ${skeletonBar}`} />
              <div className={`mx-auto mt-4 h-9 w-24 ${skeletonBar}`} />
              <div className={`mx-auto mt-3 h-4 w-28 ${skeletonBar}`} />
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-card border border-[#e5e4e0] bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <div className={`h-6 w-52 ${skeletonBar}`} />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 rounded-2xl bg-[#faf9f7] p-4 dark:bg-gray-700">
                <div className="flex-1 space-y-3">
                  <div className={`h-4 w-36 ${skeletonBar}`} />
                  <div className={`h-4 w-full max-w-lg ${skeletonBar}`} />
                </div>
                <div className={`h-11 w-28 rounded-[2rem] ${skeletonBlock}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className={`h-5 w-36 ${skeletonBar}`} />
          <div className={`h-14 w-44 rounded-[2rem] ${skeletonBlock}`} />
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
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState<FlagReasonValue | ''>('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState('')
  const [timedOut, setTimedOut] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [outboundWarningUrl, setOutboundWarningUrl] = useState<string | null>(null)
  const autosaveKey = `tester-workspace-autosave:${assignmentId}`
  const autosaveLoadedRef = useRef(false)

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

  // --- Countdown Timer ---
  useEffect(() => {
    if (!assignment?.timeoutAt) return
    const computeRemaining = () => Math.max(0, differenceInSeconds(new Date(assignment.timeoutAt), new Date()))
    setSecondsLeft(computeRemaining())
    const interval = setInterval(() => {
      const remaining = computeRemaining()
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        setTimedOut(true)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [assignment?.timeoutAt])

  // --- Autosave: load from localStorage on mount ---
  useEffect(() => {
    if (autosaveLoadedRef.current) return
    autosaveLoadedRef.current = true
    try {
      const saved = localStorage.getItem(autosaveKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          setAnswers(parsed)
        }
      }
    } catch { /* ignore */ }
  }, [autosaveKey])

  // --- Autosave: persist answers to localStorage ---
  useEffect(() => {
    if (Object.keys(answers).length === 0) return
    try {
      localStorage.setItem(autosaveKey, JSON.stringify(answers))
    } catch { /* ignore */ }
  }, [answers, autosaveKey])

  const questions = useMemo(
    () => [...(assignment?.mission.questions ?? [])].sort((left, right) => left.order - right.order),
    [assignment?.mission.questions]
  )

  if (isLoading) {
    return <TesterWorkspaceSkeleton />
  }

  if (isNotFound || !assignment) {
    return <NotFoundPanel title="Assignment not found" backHref="/dashboard/tester" />
  }

  if (assignment.status === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-3 text-3xl font-black text-[#1a1625] dark:text-white">You already completed this mission.</h1>
          <Link href="/dashboard/tester" className={`px-8 py-3.5 ${primaryButtonClass}`}>BACK TO DASHBOARD</Link>
        </div>
      </div>
    )
  }

  if (assignment.status === 'TIMED_OUT' || assignment.status === 'ABANDONED' || assignment.status === 'MISSION_FULL') {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-3 text-3xl font-black text-[#1a1625] dark:text-white">This mission is no longer available.</h1>
          <Link href="/dashboard/tester" className={`px-8 py-3.5 ${primaryButtonClass}`}>BACK TO DASHBOARD</Link>
        </div>
      </div>
    )
  }

  const activeAssignment = assignment
  const hoursLeft = Math.max(0, Math.floor((secondsLeft ?? 0) / 3600))
  const current = questions[currentQuestion]

  // --- Time's Up Overlay (blocks everything) ---
  if (timedOut && phase !== 'success') {
    return <TimesUpOverlay onReturn={() => router.push('/dashboard/tester')} />
  }

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
      if (current.type === 'TEXT_SHORT') return 'Please write a short response to continue.'
      if (current.type === 'TEXT_LONG') return 'Please share your detailed thoughts before moving on.'
      if (current.type === 'RATING_1_5') return 'Please select a star rating to continue.'
      if (current.type === 'MULTIPLE_CHOICE') return 'Please pick one of the choices before continuing.'
      if (current.type === 'YES_NO') return 'Please choose Yes or No to continue.'
      return 'Please answer this question to continue.'
    }

    if (current.type === 'TEXT_SHORT' && typeof answer === 'string' && answer.trim().length < 6) {
      return 'Your answer is too short — give at least a few words so the founder can act on it.'
    }

    if (current.type === 'TEXT_LONG' && typeof answer === 'string' && answer.trim().length < 11) {
      return 'Please write at least a couple of sentences for this detailed question.'
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
      posthog.capture('feedback_submitted', {
        missionId: activeAssignment.mission.id,
      })
      setSuccessState({ coinsEarned: response.coinsEarned, newTier: response.newTier, stats })
      setPhase('success')
      // Clear autosave on successful submit
      try { localStorage.removeItem(autosaveKey) } catch { /* ignore */ }
      void refetch().catch(() => undefined)
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
    if (!reportReason) {
      setReportError('Select a quick signal before submitting.')
      return
    }

    setReportLoading(true)
    setReportError('')

    try {
      await apiFetch(`/api/v1/tester/assignments/${activeAssignment.id}/report`, {
        method: 'POST',
        body: {
          reason: reportReason,
          details: reportDetails.trim() || undefined,
        },
      })
      setReportOpen(false)
      setReportReason('')
      setReportDetails('')
      toast.info('Flag saved. This helps us spot patterns early.')
    } catch (error) {
      setReportError(isApiClientError(error) ? error.message : 'Something went wrong. Try again.')
    } finally {
      setReportLoading(false)
    }
  }

  if (phase === 'briefing') {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl rounded-panel bg-[#faf9f7] p-12 dark:bg-gray-900">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">MISSION ASSIGNED</div>
            <h1 className="mb-3 text-4xl font-black text-[#1a1625] dark:text-white">{assignment.mission.title}</h1>
            <p className="mx-auto max-w-2xl text-lg text-[#6b687a] dark:text-gray-400">{assignment.mission.goal}</p>
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-card border border-[#e5e4e0] bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-2 text-sm text-[#9b98a8] dark:text-gray-400">REWARD</div>
              <div className="mb-1 text-3xl font-black text-[#1a1625] dark:text-white">{formatCoins(assignment.mission.coinPerTester)}</div>
              <div className="text-sm text-[#6b687a] dark:text-gray-400">coins (≈ {formatRupeesFromCoins(assignment.mission.coinPerTester)})</div>
            </div>
            <div className="rounded-card border border-[#e5e4e0] bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-2 text-sm text-[#9b98a8] dark:text-gray-400">ESTIMATED TIME</div>
              <div className="mb-1 text-3xl font-black text-[#1a1625] dark:text-white">{assignment.mission.estimatedMinutes}</div>
              <div className="text-sm text-[#6b687a] dark:text-gray-400">minutes</div>
            </div>
            <div className="rounded-card border border-[#e5e4e0] bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-2 text-sm text-[#9b98a8] dark:text-gray-400">EXPIRES IN</div>
              <div className="mb-1 text-3xl font-black text-amber-600">{hoursLeft}</div>
              <div className="text-sm text-[#6b687a] dark:text-gray-400">hours</div>
            </div>
          </div>

          <div className="mb-8 rounded-card border border-[#e5e4e0] bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-6 text-xl font-black text-[#1a1625] dark:text-white">What you&apos;ll be testing</h2>
            <div className="space-y-4">
              {assignment.mission.assets.map((asset, index) => (
                <div key={index} className="flex items-center gap-4 rounded-2xl bg-[#faf9f7] p-4 dark:bg-gray-700">
                  <div className="flex-1">
                    <div className="mb-1 text-sm font-semibold text-[#1a1625] dark:text-white">{asset.label || asset.type.replaceAll('_', ' ')}</div>
                    <div className="text-sm text-[#6b687a] dark:text-gray-400">
                      {asset.type === 'TEXT_DESCRIPTION' ? asset.url : asset.url}
                    </div>
                  </div>
                  {asset.type === 'TEXT_DESCRIPTION' ? null : (
                    <button
                      type="button"
                      onClick={() => setOutboundWarningUrl(asset.url)}
                      className="rounded-[2rem] bg-blue-600 px-6 py-2.5 font-bold text-white transition-all hover:shadow-lg hover:scale-105"
                    >
                      {asset.type === 'LINK' ? 'OPEN →' : 'VIEW →'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {hoursLeft < 2 ? <div className="mb-8 rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100">This mission will expire soon. Make sure to complete it before the deadline to receive your coins.</div> : null}

          {startError ? <p className="mb-4 text-sm text-red-600">{startError}</p> : null}

          <div className="flex items-center justify-between">
            <Link href="/dashboard/tester" className="font-semibold text-[#6b687a] hover:text-[#1a1625] dark:text-gray-400 dark:hover:text-white">← Back to dashboard</Link>
            <button className={`flex items-center gap-2 px-12 py-4 text-lg ${primaryButtonClass}`} disabled={startLoading} onClick={() => void handleStart()}>
              {startLoading ? <SpinnerIcon className="w-5 h-5" /> : null}
              BEGIN MISSION →
            </button>
          </div>

          <div className="mt-8 text-center">
            <button className="text-sm text-[#9b98a8] underline hover:text-[#6b687a] dark:text-gray-400 dark:hover:text-white" onClick={() => setReportOpen(true)}>
              Flag something that feels off
            </button>
          </div>

          {reportOpen ? (
            <FlagSignalModal
              title="Flag this mission"
              subtitle="Use a quick structured signal when something feels unclear, risky, or not compelling. This is faster than writing full feedback."
              targetLabel="Founder mission flow"
              reason={reportReason}
              details={reportDetails}
              errorMessage={reportError}
              isSubmitting={reportLoading}
              onReasonChange={setReportReason}
              onDetailsChange={setReportDetails}
              onClose={() => setReportOpen(false)}
              onSubmit={() => void handleReportIssue()}
            />
          ) : null}
          {outboundWarningUrl ? (
            <OutboundLinkWarning
              url={outboundWarningUrl}
              onContinue={() => { window.open(outboundWarningUrl, '_blank', 'noopener,noreferrer'); setOutboundWarningUrl(null) }}
              onCancel={() => setOutboundWarningUrl(null)}
            />
          ) : null}
        </div>
      </div>
    )
  }

  if (phase === 'questions') {
    const answer = answers[currentQuestion]
    const progress = ((currentQuestion + 1) / Math.max(questions.length, 1)) * 100

    return (
      <div className="min-h-screen bg-[#faf9f7] p-8 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl rounded-panel bg-[#faf9f7] p-8 dark:bg-gray-900">
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-[#6b687a] dark:text-gray-400">Question {currentQuestion + 1} of {questions.length}</span>
              {secondsLeft !== null ? (
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
                  secondsLeft < 300
                    ? 'animate-pulse bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                    : 'bg-[#f3f3f5] text-[#6b687a] dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  <Clock className="h-3.5 w-3.5" />
                  {formatTimeLeft(secondsLeft)}
                </div>
              ) : null}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#f3f3f5] dark:bg-gray-700">
              <div className="h-full rounded-full bg-[#d77a57]" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mb-6">
            <div className="inline-flex rounded-full bg-[#d77a57]/10 px-3 py-1 text-sm font-bold text-[#d77a57] dark:bg-[#d77a57]/20 dark:text-[#f0a98c]">{assignment.mission.title}</div>
          </div>

          <div className="mb-6 rounded-card border border-[#e5e4e0] bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-6 text-2xl font-black text-[#1a1625] dark:text-white">{current.text}</h2>

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
                <div className="absolute bottom-3 right-3 text-sm text-[#9b98a8] dark:text-gray-400">
                  {String(answer ?? '').length} / {current.type === 'TEXT_LONG' ? 1000 : 500}
                </div>
              </div>
            ) : null}

            {current.type === 'RATING_1_5' ? (
              <div className="flex flex-col items-center">
                <div className="mb-3 flex items-center justify-center">
                  <StarRow
                    value={Number(answer ?? 0)}
                    size={48}
                    onChange={(value) => setAnswers((currentAnswers) => ({ ...currentAnswers, [currentQuestion]: value }))}
                  />
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
                    className={`w-full rounded-2xl border-2 p-4 text-left ${answer === option ? 'border-[#d77a57] bg-[#fdf8f6] dark:bg-[#d77a57]/10 dark:text-white' : 'border-[#e5e4e0] bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white'}`}
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
                    className={`rounded-2xl border-2 p-4 text-lg ${answer === option ? 'border-[#d77a57] bg-[#fdf8f6] font-black text-[#d77a57] dark:bg-[#d77a57]/10' : 'border-[#e5e4e0] bg-white text-[#1a1625] dark:border-gray-700 dark:bg-gray-800 dark:text-white'}`}
                  >
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {currentError ? <p className="mb-4 text-sm text-red-600">{currentError}</p> : null}

          <div className="mb-4 flex items-center justify-between">
            <button className="font-semibold text-[#6b687a] hover:text-[#1a1625] dark:text-gray-400 dark:hover:text-white" onClick={() => setCurrentQuestion((value) => Math.max(0, value - 1))}>← Back</button>
            <button className={`px-8 py-3.5 ${primaryButtonClass}`} onClick={handleNextQuestion}>
              {currentQuestion === questions.length - 1 ? 'REVIEW ANSWERS →' : 'NEXT →'}
            </button>
          </div>

          <div className="text-center">
            <button className="text-sm text-[#9b98a8] underline hover:text-[#6b687a] dark:text-gray-400 dark:hover:text-white" onClick={() => setReportOpen(true)}>
              Flag something that feels off
            </button>
          </div>

          {reportOpen ? (
            <FlagSignalModal
              title="Flag this mission"
              subtitle="Use a quick structured signal when something feels unclear, risky, or not compelling. This is faster than writing full feedback."
              targetLabel="Founder mission flow"
              reason={reportReason}
              details={reportDetails}
              errorMessage={reportError}
              isSubmitting={reportLoading}
              onReasonChange={setReportReason}
              onDetailsChange={setReportDetails}
              onClose={() => setReportOpen(false)}
              onSubmit={() => void handleReportIssue()}
            />
          ) : null}
        </div>
      </div>
    )
  }

  if (phase === 'review') {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl rounded-panel bg-[#faf9f7] p-12 dark:bg-gray-900">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">REVIEW</div>
            <h1 className="mb-3 text-4xl font-black text-[#1a1625] dark:text-white">Review Your Answers</h1>
          </div>

          <div className="mb-8 space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 text-sm font-bold text-[#d77a57]">QUESTION {index + 1}</div>
                    <h3 className="mb-3 text-lg font-black text-[#1a1625] dark:text-white">{question.text}</h3>
                    <p className="rounded-2xl bg-[#faf9f7] p-4 text-[#1a1625] dark:bg-gray-700 dark:text-white">{String(answers[index] ?? '')}</p>
                  </div>
                  <button className="text-sm font-semibold text-[#d77a57] hover:underline" onClick={() => { setCurrentQuestion(index); setPhase('questions') }}>
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-8 rounded-card border border-green-100 bg-gradient-to-br from-green-50 to-blue-50 p-8 dark:border-green-900/70 dark:bg-gray-800">
            <h3 className="mb-1 text-xl font-black text-[#1a1625] dark:text-white">You&apos;re about to earn</h3>
            <p className="text-3xl font-black text-green-600">
              {formatCoins(assignment.mission.coinPerTester)} coins <span className="text-lg text-[#6b687a] dark:text-gray-400">(≈ {formatRupeesFromCoins(assignment.mission.coinPerTester)})</span>
            </p>
          </div>

          {submitError ? <p className="mb-4 text-sm text-red-600">{submitError}</p> : null}

          <div className="flex items-center justify-between">
            <button className="font-semibold text-[#6b687a] hover:text-[#1a1625] dark:text-gray-400 dark:hover:text-white" onClick={() => setPhase('questions')}>
              ← Previous Question
            </button>
            <button className={`flex items-center gap-2 px-12 py-4 text-lg ${primaryButtonClass}`} disabled={submitLoading} onClick={() => void handleSubmitFeedback()}>
              {submitLoading ? <SpinnerIcon className="w-5 h-5" /> : null}
              SUBMIT FEEDBACK →
            </button>
          </div>
          <div className="mt-4 text-right">
            <button
              type="button"
              className="text-sm font-semibold text-[#9b98a8] underline hover:text-[#6b687a] dark:text-gray-400 dark:hover:text-white"
              onClick={() => setReportOpen(true)}
            >
              Flag something that feels off
            </button>
          </div>
          {reportOpen ? (
            <FlagSignalModal
              title="Flag this mission"
              subtitle="Use a quick structured signal when something feels unclear, risky, or not compelling. This is faster than writing full feedback."
              targetLabel="Founder mission flow"
              reason={reportReason}
              details={reportDetails}
              errorMessage={reportError}
              isSubmitting={reportLoading}
              onReasonChange={setReportReason}
              onDetailsChange={setReportDetails}
              onClose={() => setReportOpen(false)}
              onSubmit={() => void handleReportIssue()}
            />
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl rounded-panel bg-gradient-to-br from-green-50 to-emerald-50 p-12 text-center dark:bg-gray-900">
        <div className="mb-6 inline-flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
          <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-3 text-4xl font-black text-[#1a1625] dark:text-white">Mission Complete!</h1>
        <p className="mb-8 text-lg text-[#6b687a] dark:text-gray-400">Thank you for your valuable feedback</p>

        <div className="mx-auto mb-8 max-w-md rounded-card border border-green-100 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500">
              <svg className="w-9 h-9 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07-.34-.433.582a2.305 2.305 0 01-.567.267z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="mb-1 text-sm text-[#9b98a8] dark:text-gray-400">YOU EARNED</div>
              <div className="text-4xl font-black text-[#1a1625] dark:text-white">{formatCoins(successState?.coinsEarned ?? 0)} coins earned</div>
              <div className="text-sm text-[#6b687a] dark:text-gray-400">≈ {formatRupeesFromCoins(successState?.coinsEarned ?? 0)}</div>
            </div>
          </div>
        </div>

        {successState?.newTier ? <div className="mx-auto mb-8 max-w-md rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-100 to-pink-100 p-6 text-sm font-bold text-purple-900 dark:border-purple-900/50 dark:bg-gray-800 dark:text-purple-200">You&apos;re now a {successState.newTier} tester!</div> : null}

        <div className="mx-auto mb-8 grid max-w-md gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white bg-white/50 p-4 dark:border-gray-700 dark:bg-gray-800/70"><div className="text-2xl font-black text-[#1a1625] dark:text-white">{successState?.stats?.totalCompleted ?? 0}</div><div className="text-xs text-[#6b687a] dark:text-gray-400">Total missions</div></div>
          <div className="rounded-2xl border border-white bg-white/50 p-4 dark:border-gray-700 dark:bg-gray-800/70"><div className="text-2xl font-black text-[#1a1625] dark:text-white">{formatCoins(successState?.stats?.coinBalance ?? 0)}</div><div className="text-xs text-[#6b687a] dark:text-gray-400">Total coins</div></div>
          <div className="rounded-2xl border border-white bg-white/50 p-4 dark:border-gray-700 dark:bg-gray-800/70"><div className="text-2xl font-black text-green-600">{successState?.stats?.completionRate ?? 0}%</div><div className="text-xs text-[#6b687a] dark:text-gray-400">Success rate</div></div>
        </div>

        <button className={`mb-4 px-10 py-3.5 ${primaryButtonClass}`} onClick={() => router.push('/dashboard/tester')}>
          BACK TO DASHBOARD
        </button>
      </div>
    </div>
  )
}

export function TesterWorkspaceRoutePage({ assignmentId }: { assignmentId: string }) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      return
    }

    router.replace(`/auth?next=${encodeURIComponent(`/tester/workspace/${assignmentId}`)}`)
  }, [assignmentId, isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated || !user) {
    return <TesterWorkspaceSkeleton />
  }

  if (user.role === 'FOUNDER' || user.role === 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-3 text-3xl font-black text-[#1a1625] dark:text-white">This page is for testers only.</h1>
          <Link href="/dashboard/founder" className={`px-8 py-3.5 ${primaryButtonClass}`}>GO TO DASHBOARD</Link>
        </div>
      </div>
    )
  }

  if (user.role !== 'TESTER') {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-3 text-3xl font-black text-[#1a1625] dark:text-white">This page is for testers only.</h1>
          <Link href="/select-role" className={`px-8 py-3.5 ${primaryButtonClass}`}>CHOOSE ROLE</Link>
        </div>
      </div>
    )
  }

  return <TesterWorkspacePage assignmentId={assignmentId} />
}
