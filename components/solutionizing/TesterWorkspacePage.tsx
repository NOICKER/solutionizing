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
import {
  BrandMark,
  ErrorStatePanel,
  NotFoundPanel,
  SpinnerIcon,
  StarRow,
  formatCoins,
  formatRupeesFromCoins,
  primaryButtonClass,
  textFieldClass,
} from '@/components/solutionizing/ui'
import { FlagSignalModal } from '@/components/solutionizing/FlagSignalModal'
import { useAuth } from '@/context/AuthContext'
import { type FlagReasonValue } from '@/lib/flags'
import { buildSubmissionResponses, type SubmissionMode } from '@/lib/tester-workspace-submission'

function formatTimeLeft(totalSeconds: number) {
  if (totalSeconds <= 0) return '0:00'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function TimesUpOverlay({
  isSubmitting,
  message,
  onReturn,
}: {
  isSubmitting: boolean
  message: string
  onReturn: () => void
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 max-w-lg rounded-3xl border border-red-900/50 bg-gray-900 p-10 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
          <Clock className="h-10 w-10 text-red-400" />
        </div>
        <h1 className="mb-3 text-3xl font-black text-white">Time&apos;s up!</h1>
        <p className="mb-8 text-base text-gray-400">{message}</p>
        <button className={`px-10 py-4 text-lg ${primaryButtonClass}`} disabled={isSubmitting} onClick={onReturn}>
          {isSubmitting ? 'SUBMITTING...' : 'RETURN TO DASHBOARD'}
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

type WorkspaceQuestion = ApiTesterAssignmentDetail['mission']['questions'][number]

const TEXT_RESPONSE_RULES = {
  TEXT_SHORT: { min: 5, max: 500 },
  TEXT_LONG: { min: 10, max: 1000 },
} as const

function getTextResponseRule(type: WorkspaceQuestion['type']) {
  if (type === 'TEXT_SHORT' || type === 'TEXT_LONG') {
    return TEXT_RESPONSE_RULES[type]
  }

  return null
}

function getTextResponseError(
  question: Pick<WorkspaceQuestion, 'type' | 'isRequired'>,
  answer: string | number | undefined
) {
  const rule = getTextResponseRule(question.type)

  if (!rule) {
    return ''
  }

  const trimmedLength = typeof answer === 'string' ? answer.trim().length : 0

  if (!question.isRequired && trimmedLength === 0) {
    return ''
  }

  if (trimmedLength < rule.min) {
    return `Answer too short (min ${rule.min} characters)`
  }

  return ''
}

function getTooShortAnswerIndexes(
  questions: WorkspaceQuestion[],
  answers: Record<number, string | number>
) {
  return questions.reduce<number[]>((indexes, question, index) => {
    if (getTextResponseError(question, answers[index])) {
      indexes.push(index)
    }

    return indexes
  }, [])
}

const workspacePageClass = 'min-h-screen bg-background px-4 py-4 text-text-main sm:px-6 lg:px-8'
const workspacePanelClass = 'relative overflow-hidden rounded-panel border border-border-subtle bg-surface shadow-card'
const workspaceSectionClass = 'rounded-card border border-border-subtle bg-surface-elevated'
const workspaceEyebrowClass = 'inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-elevated px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-text-muted'
const workspaceBackLinkClass = 'font-semibold text-text-muted transition-colors hover:text-text-main'
const selectedChoiceClass = 'border-primary/60 bg-primary/12 text-text-main shadow-[0_18px_35px_-24px_rgba(249,124,90,0.55)]'
const unselectedChoiceClass = 'border-border-subtle bg-surface-elevated text-text-main hover:border-primary/35 hover:bg-surface'

function getAssetTypeLabel(type: ApiTesterAssignmentDetail['mission']['assets'][number]['type']) {
  switch (type) {
    case 'LINK':
      return 'Live link'
    case 'SCREENSHOT':
      return 'Screenshot'
    case 'SHORT_VIDEO':
      return 'Video'
    case 'TEXT_DESCRIPTION':
      return 'Context'
    default:
      return type.replaceAll('_', ' ')
  }
}

function getAssetActionLabel(type: ApiTesterAssignmentDetail['mission']['assets'][number]['type']) {
  switch (type) {
    case 'LINK':
      return 'Open link'
    case 'SCREENSHOT':
      return 'Open screenshot'
    case 'SHORT_VIDEO':
      return 'Open video'
    default:
      return 'Open asset'
  }
}

function getAssetDisplayLabel(asset: ApiTesterAssignmentDetail['mission']['assets'][number]) {
  if (asset.label?.trim()) {
    return asset.label.trim()
  }

  switch (asset.type) {
    case 'LINK':
      return 'Product experience'
    case 'SCREENSHOT':
      return 'Founder reference screenshot'
    case 'SHORT_VIDEO':
      return 'Founder reference video'
    case 'TEXT_DESCRIPTION':
      return 'Mission note'
    default:
      return getAssetTypeLabel(asset.type)
  }
}

function getAssetSupportText(asset: ApiTesterAssignmentDetail['mission']['assets'][number]) {
  if (asset.type === 'TEXT_DESCRIPTION') {
    return asset.url
  }

  if (asset.type === 'SCREENSHOT') {
    return 'Open the uploaded screenshot reference in a new tab while you test.'
  }

  if (asset.type === 'SHORT_VIDEO') {
    return 'Open the founder walkthrough video in a new tab while you test.'
  }

  try {
    const parsed = new URL(asset.url)
    return parsed.host.replace(/^www\./, '')
  } catch {
    return asset.url
  }
}

function getAnswerPreview(answer: string | number | undefined) {
  if (answer === undefined || answer === '') {
    return 'No answer provided'
  }

  return String(answer)
}

function WorkspaceStatusPanel({
  title,
  actionHref,
  actionLabel,
}: {
  title: string
  actionHref: string
  actionLabel: string
}) {
  return (
    <div className={workspacePageClass}>
      <div className="mx-auto max-w-3xl">
        <div className={`${workspacePanelClass} px-6 py-10 text-center sm:px-10`}>
          <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative z-10">
            <div className={`${workspaceEyebrowClass} mb-4`}>
              <BrandMark className="h-3.5 w-3.5 text-primary" />
              Tester workspace
            </div>
            <h1 className="mb-6 text-3xl font-black text-white sm:text-4xl">{title}</h1>
            <Link href={actionHref} className={`px-8 py-3.5 ${primaryButtonClass}`}>
              {actionLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function TesterWorkspaceSkeleton() {
  const skeletonBar = 'animate-pulse rounded-full bg-surface-elevated'
  const skeletonBlock = 'animate-pulse rounded-3xl bg-background'

  return (
    <div className={workspacePageClass}>
      <div className="mx-auto max-w-5xl">
        <div className={`${workspacePanelClass} p-6 sm:p-8 lg:p-10`}>
          <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative z-10">
          <div className="mb-8 flex flex-col items-center space-y-4 text-center">
            <div className={`h-9 w-40 ${skeletonBar}`} />
            <div className={`h-12 w-full max-w-2xl rounded-[1.75rem] ${skeletonBar}`} />
            <div className={`h-5 w-full max-w-xl ${skeletonBar}`} />
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-card border border-border-subtle bg-surface-elevated p-6 text-center"
              >
                <div className={`mx-auto h-3 w-20 ${skeletonBar}`} />
                <div className={`mx-auto mt-4 h-9 w-24 ${skeletonBar}`} />
                <div className={`mx-auto mt-3 h-4 w-28 ${skeletonBar}`} />
              </div>
            ))}
          </div>

          <div className="mb-8 rounded-card border border-border-subtle bg-surface-elevated p-8">
            <div className={`h-6 w-52 ${skeletonBar}`} />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-background p-4">
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
  const [touchedTextQuestions, setTouchedTextQuestions] = useState<Record<number, boolean>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [currentError, setCurrentError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)
  const [workspaceLoadError, setWorkspaceLoadError] = useState('')
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
  const [timedOutMessage, setTimedOutMessage] = useState('Time ran out. Any answers we could not submit are still saved on this device.')
  const [timeoutAutoSubmitLoading, setTimeoutAutoSubmitLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [outboundWarningUrl, setOutboundWarningUrl] = useState<string | null>(null)
  const autosaveKey = `tester-workspace-autosave:${assignmentId}`
  const autosaveLoadedRef = useRef(false)
  const timeoutWarningShownRef = useRef(false)
  const timeoutAutoSubmitAttemptedRef = useRef(false)

  const loadAssignment = useCallback(async () => {
    setIsLoading(true)
    setWorkspaceLoadError('')

    try {
      const response = await apiFetch<ApiTesterAssignmentDetail>(`/api/v1/tester/assignments/${assignmentId}`)
      setAssignment(response)
      setPhase(response.status === 'IN_PROGRESS' ? 'questions' : 'briefing')
      setIsNotFound(false)
    } catch (error) {
      if (isApiClientError(error) && error.status === 404) {
        setIsNotFound(true)
        setAssignment(null)
      } else {
        setIsNotFound(false)
        setWorkspaceLoadError('Something went wrong loading your workspace. Please refresh.')
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

  const activeAssignment = assignment
  const hoursLeft = Math.max(0, Math.floor((secondsLeft ?? 0) / 3600))
  const current = questions[currentQuestion]

  async function handleStart() {
    if (!activeAssignment) {
      return
    }

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

    if (current.type === 'TEXT_SHORT' || current.type === 'TEXT_LONG') {
      return getTextResponseError(current, answer)
    }

    if (current.isRequired && (answer === undefined || answer === '')) {
      if (current.type === 'RATING_1_5') return 'Please select a star rating to continue.'
      if (current.type === 'MULTIPLE_CHOICE') return 'Please pick one of the choices before continuing.'
      if (current.type === 'YES_NO') return 'Please choose Yes or No to continue.'
      return 'Please answer this question to continue.'
    }

    return ''
  }

  function handleNextQuestion() {
    if (current.type === 'TEXT_SHORT' || current.type === 'TEXT_LONG') {
      setTouchedTextQuestions((currentTouched) => ({
        ...currentTouched,
        [currentQuestion]: true,
      }))
    }

    const error = validateCurrentQuestion()
    setCurrentError(error)

    if (error) {
      return
    }

    setCurrentError('')

    if (currentQuestion === questions.length - 1) {
      setPhase('review')
      return
    }

    setCurrentQuestion((value) => value + 1)
  }

  const handleSubmitFeedback = useCallback(async (submissionMode: SubmissionMode = 'MANUAL') => {
    if (!activeAssignment) {
      return
    }

    const tooShortIndexes = getTooShortAnswerIndexes(questions, answers)

    if (submissionMode === 'MANUAL' && tooShortIndexes.length > 0) {
      setTouchedTextQuestions((currentTouched) => ({
        ...currentTouched,
        ...Object.fromEntries(tooShortIndexes.map((index) => [index, true])),
      }))
      return
    }

    const responses = buildSubmissionResponses({
      questions,
      answers,
      submissionMode,
    })

    if (submissionMode === 'TIMEOUT_AUTO' && responses.length === 0) {
      setTimedOutMessage('Time ran out before there were any completed answers to submit.')
      setTimedOut(true)
      return
    }

    setSubmitError('')
    setSubmitLoading(true)

    if (submissionMode === 'TIMEOUT_AUTO') {
      setTimeoutAutoSubmitLoading(true)
      setTimedOutMessage('Submitting your completed answers now. Please do not close this page.')
    }

    try {
      const response = await apiFetch<{ coinsEarned: number; newTier?: string }>(
        `/api/v1/tester/assignments/${activeAssignment.id}/submit`,
        {
          method: 'POST',
          body: {
            responses,
            submissionMode,
          },
        }
      )

      const stats = await apiFetch<ApiTesterStats>('/api/v1/tester/stats').catch(() => null)
      posthog.capture('feedback_submitted', {
        missionId: activeAssignment.mission.id,
      })
      setSuccessState({ coinsEarned: response.coinsEarned, newTier: response.newTier, stats })
      setPhase('success')
      try { localStorage.removeItem(autosaveKey) } catch { /* ignore */ }
      void refetch().catch(() => undefined)
    } catch (error) {
      if (submissionMode === 'TIMEOUT_AUTO') {
        if (isApiClientError(error) && error.code === 'ASSIGNMENT_EXPIRED') {
          setTimedOutMessage('Time ran out before we could finish the auto-submit. Your latest answers are still saved on this device.')
        } else {
          setTimedOutMessage('We could not auto-submit before the session closed. Your latest answers are still saved on this device.')
        }
        setTimedOut(true)
        return
      }

      if (isApiClientError(error)) {
        if (error.code === 'MISSION_FULL' && error.status === 409) {
          setSubmitError("This mission just filled up. If your submission was accepted you'll still receive your coins.")
        } else if (error.code === 'ASSIGNMENT_EXPIRED') {
          setTimedOutMessage('Time ran out. Your latest answers are still saved on this device.')
          setTimedOut(true)
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
      if (submissionMode === 'TIMEOUT_AUTO') {
        setTimeoutAutoSubmitLoading(false)
      }
    }
  }, [activeAssignment, answers, autosaveKey, questions, refetch])

  useEffect(() => {
    if (phase === 'briefing' || phase === 'success' || secondsLeft === null || timeoutWarningShownRef.current) {
      return
    }

    if (secondsLeft <= 120) {
      timeoutWarningShownRef.current = true
      toast.info("2 minutes left. We'll auto-submit any completed answers if time runs out.")
    }
  }, [phase, secondsLeft])

  useEffect(() => {
    if (
      phase === 'briefing' ||
      phase === 'success' ||
      secondsLeft === null ||
      secondsLeft > 1 ||
      submitLoading ||
      timeoutAutoSubmitAttemptedRef.current
    ) {
      return
    }

    const responses = buildSubmissionResponses({
      questions,
      answers,
      submissionMode: 'TIMEOUT_AUTO',
    })

    if (responses.length === 0) {
      return
    }

    timeoutAutoSubmitAttemptedRef.current = true
    void handleSubmitFeedback('TIMEOUT_AUTO')
  }, [answers, handleSubmitFeedback, phase, questions, secondsLeft, submitLoading])

  if (timedOut && phase !== 'success') {
    return (
      <TimesUpOverlay
        isSubmitting={timeoutAutoSubmitLoading}
        message={timedOutMessage}
        onReturn={() => router.push('/dashboard/tester')}
      />
    )
  }

  async function handleReportIssue() {
    if (!activeAssignment) {
      return
    }

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

  if (isLoading) {
    return <TesterWorkspaceSkeleton />
  }

  if (workspaceLoadError) {
    return (
      <ErrorStatePanel
        title="Unable to load workspace"
        body={workspaceLoadError}
        onRetry={() => void loadAssignment()}
        backHref="/dashboard/tester"
      />
    )
  }

  if (isNotFound || !assignment) {
    return <NotFoundPanel title="Assignment not found" backHref="/dashboard/tester" />
  }

  if (assignment.status === 'COMPLETED') {
    return <WorkspaceStatusPanel title="You already completed this mission." actionHref="/dashboard/tester" actionLabel="BACK TO DASHBOARD" />
  }

  if (assignment.status === 'TIMED_OUT' || assignment.status === 'ABANDONED' || assignment.status === 'MISSION_FULL') {
    return <WorkspaceStatusPanel title="This mission is no longer available." actionHref="/dashboard/tester" actionLabel="BACK TO DASHBOARD" />
  }

  if (phase === 'briefing') {
    return (
      <div className={workspacePageClass}>
        <div className="mx-auto max-w-5xl">
          <div className={`${workspacePanelClass} p-6 sm:p-8 lg:p-10`}>
            <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
            <div className="relative z-10">
          <div className="mb-8 text-center">
            <div className={`${workspaceEyebrowClass} mb-4`}>
              <BrandMark className="h-3.5 w-3.5 text-primary" />
              Mission assigned
            </div>
            <h1 className="mb-3 text-3xl font-black tracking-tight text-white sm:text-5xl">{assignment.mission.title}</h1>
            <p className="mx-auto max-w-3xl text-sm leading-7 text-text-muted sm:text-base">{assignment.mission.goal}</p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            <div className={`${workspaceSectionClass} p-5 text-center sm:p-6`}>
              <div className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-text-muted">Reward</div>
              <div className="mb-1 text-3xl font-black text-white">{formatCoins(assignment.mission.coinPerTester)}</div>
              <div className="text-sm text-text-muted">coins (≈ {formatRupeesFromCoins(assignment.mission.coinPerTester)})</div>
            </div>
            <div className={`${workspaceSectionClass} p-5 text-center sm:p-6`}>
              <div className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-text-muted">Estimated time</div>
              <div className="mb-1 text-3xl font-black text-white">{assignment.mission.estimatedMinutes}</div>
              <div className="text-sm text-text-muted">minutes</div>
            </div>
            <div className={`${workspaceSectionClass} p-5 text-center sm:p-6`}>
              <div className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-text-muted">Expires in</div>
              <div className="mb-1 text-3xl font-black text-primary">{hoursLeft}</div>
              <div className="text-sm text-text-muted">hours</div>
            </div>
          </div>

          <div className={`${workspaceSectionClass} mb-8 p-6 sm:p-8`}>
            <div className="mb-6">
              <div className={`${workspaceEyebrowClass} mb-3`}>
                <BrandMark className="h-3.5 w-3.5 text-primary" />
                Mission inputs
              </div>
              <h2 className="text-2xl font-black text-white">What you&apos;ll be testing</h2>
              <p className="mt-2 text-sm text-text-muted">Everything below came directly from the founder. Keep these references nearby while you test.</p>
            </div>

            <div className="space-y-4">
              {assignment.mission.assets.map((asset, index) => (
                <div key={index} className="flex flex-col gap-4 rounded-[1.75rem] border border-border-subtle bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary">
                        {getAssetTypeLabel(asset.type)}
                      </span>
                    </div>
                    <div className="text-base font-black text-white">{getAssetDisplayLabel(asset)}</div>
                    <div className={`mt-2 text-sm leading-6 text-text-muted ${asset.type === 'TEXT_DESCRIPTION' ? 'whitespace-pre-wrap break-words' : 'break-all sm:break-normal'}`}>
                      {getAssetSupportText(asset)}
                    </div>
                    {asset.type === 'LINK' ? (
                      <div className="mt-2 text-xs text-text-muted/70">{asset.url}</div>
                    ) : null}
                  </div>
                  {asset.type === 'TEXT_DESCRIPTION' ? null : (
                    <button
                      type="button"
                      onClick={() => setOutboundWarningUrl(asset.url)}
                      className="inline-flex w-full items-center justify-center rounded-[2rem] border border-primary/25 bg-primary/10 px-5 py-3 text-sm font-black text-primary transition-colors hover:bg-primary/15 sm:w-auto"
                    >
                      {getAssetActionLabel(asset.type)} →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {hoursLeft < 2 ? <div className="mb-8 rounded-[1.75rem] border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-100">This mission will expire soon. Finish before the timer runs out to keep the reward.</div> : null}

          {startError ? <p className="mb-4 text-sm text-red-400">{startError}</p> : null}

          <div className="flex flex-col-reverse items-center justify-between gap-6 sm:flex-row">
            <Link href="/dashboard/tester" className={workspaceBackLinkClass}>← Back to dashboard</Link>
            <button className={`flex w-full items-center justify-center gap-2 px-12 py-4 text-lg sm:w-auto ${primaryButtonClass}`} disabled={startLoading} onClick={() => void handleStart()}>
              {startLoading ? <SpinnerIcon className="w-5 h-5" /> : null}
              BEGIN MISSION →
            </button>
          </div>

          <div className="mt-8 text-center">
            <button className="text-sm text-text-muted underline transition-colors hover:text-text-main" onClick={() => setReportOpen(true)}>
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
        </div>
      </div>
    )
  }

  if (phase === 'questions') {
    const answer = answers[currentQuestion]
    const progress = ((currentQuestion + 1) / Math.max(questions.length, 1)) * 100
    const currentTextRule = getTextResponseRule(current.type)
    const currentTextError =
      currentTextRule && touchedTextQuestions[currentQuestion]
        ? getTextResponseError(current, answer)
        : ''
    const currentTextLength = typeof answer === 'string' ? answer.length : 0

    return (
      <div className={workspacePageClass}>
        <div className="mx-auto max-w-4xl">
          <div className={`${workspacePanelClass} p-5 sm:p-6 lg:p-8`}>
            <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
            <div className="relative z-10">
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-text-muted">Question {currentQuestion + 1} of {questions.length}</span>
              {secondsLeft !== null ? (
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
                  secondsLeft < 300
                    ? 'animate-pulse bg-red-500/15 text-red-300'
                    : 'bg-surface-elevated text-text-muted'
                }`}>
                  <Clock className="h-3.5 w-3.5" />
                  {formatTimeLeft(secondsLeft)}
                </div>
              ) : null}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mb-6">
            <div className={workspaceEyebrowClass}>
              <BrandMark className="h-3.5 w-3.5 text-primary" />
              {assignment.mission.title}
            </div>
          </div>

          <div className={`${workspaceSectionClass} mb-6 p-6 sm:p-8`}>
            <h2 className="mb-6 text-xl font-black text-white sm:text-3xl">{current.text}</h2>

            {(current.type === 'TEXT_SHORT' || current.type === 'TEXT_LONG') ? (
              <div>
                <textarea
                  value={typeof answer === 'string' ? answer : ''}
                  onChange={(event) => {
                    setAnswers((currentAnswers) => ({
                      ...currentAnswers,
                      [currentQuestion]: event.target.value,
                    }))
                    setTouchedTextQuestions((currentTouched) => ({
                      ...currentTouched,
                      [currentQuestion]: true,
                    }))
                    setCurrentError('')
                  }}
                  rows={current.type === 'TEXT_LONG' ? 6 : 4}
                  maxLength={currentTextRule?.max}
                  placeholder={current.type === 'TEXT_LONG' ? 'Share your detailed thoughts...' : 'Your answer...'}
                  className={`${textFieldClass} resize-none`}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                  <span>{currentTextRule ? `Minimum ${currentTextRule.min} characters` : ''}</span>
                  <span>
                    {currentTextLength} / {currentTextRule?.max} characters
                  </span>
                </div>
                {currentTextError ? <p className="mt-2 text-sm text-red-400">{currentTextError}</p> : null}
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
                    onClick={() => {
                      setAnswers((currentAnswers) => ({ ...currentAnswers, [currentQuestion]: option }))
                      setCurrentError('')
                    }}
                    className={`flex w-full items-start gap-4 rounded-[1.75rem] border-2 p-4 text-left transition-colors ${
                      answer === option ? selectedChoiceClass : unselectedChoiceClass
                    }`}
                  >
                    <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      answer === option ? 'border-primary bg-primary' : 'border-border-subtle bg-surface'
                    }`}>
                      {answer === option ? <span className="h-2.5 w-2.5 rounded-full bg-surface" /> : null}
                    </span>
                    <span className="flex-1 break-words text-base font-semibold leading-6">{option}</span>
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
                    onClick={() => {
                      setAnswers((currentAnswers) => ({ ...currentAnswers, [currentQuestion]: option }))
                      setCurrentError('')
                    }}
                    className={`rounded-[1.75rem] border-2 p-4 text-lg transition-colors ${
                      answer === option ? `${selectedChoiceClass} font-black` : `${unselectedChoiceClass} font-semibold`
                    }`}
                  >
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {currentError && !currentTextRule ? <p className="mb-4 text-sm text-red-400">{currentError}</p> : null}

          <div className="mb-4 flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
            <button className={workspaceBackLinkClass} onClick={() => setCurrentQuestion((value) => Math.max(0, value - 1))}>← Back</button>
            <button className={`w-full px-8 py-3.5 sm:w-auto ${primaryButtonClass}`} onClick={handleNextQuestion}>
              {currentQuestion === questions.length - 1 ? 'REVIEW ANSWERS →' : 'NEXT →'}
            </button>
          </div>

          <div className="text-center">
            <button className="text-sm text-text-muted underline transition-colors hover:text-text-main" onClick={() => setReportOpen(true)}>
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
        </div>
      </div>
    )
  }

  if (phase === 'review') {
    const tooShortIndexes = getTooShortAnswerIndexes(questions, answers)
    const tooShortSet = new Set(tooShortIndexes)

    return (
      <div className={workspacePageClass}>
        <div className="mx-auto max-w-5xl">
          <div className={`${workspacePanelClass} p-6 sm:p-8 lg:p-10`}>
            <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
            <div className="relative z-10">
          <div className="mb-8 text-center">
            <div className={`${workspaceEyebrowClass} mb-4`}>
              <BrandMark className="h-3.5 w-3.5 text-primary" />
              Review
            </div>
            <h1 className="mb-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Review your answers</h1>
          </div>

          <div className="mb-8 space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className={`${workspaceSectionClass} p-5 sm:p-6`}>
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 text-sm font-bold text-primary">QUESTION {index + 1}</div>
                    <h3 className="mb-3 text-lg font-black text-white">{question.text}</h3>
                    <p className={`rounded-[1.5rem] border border-border-subtle bg-background/70 p-4 text-sm leading-6 ${answers[index] === undefined || answers[index] === '' ? 'italic text-text-muted' : 'whitespace-pre-wrap break-words text-text-main'}`}>
                      {getAnswerPreview(answers[index])}
                    </p>
                    {tooShortSet.has(index) ? (
                      <p className="mt-3 text-sm text-red-400">
                        {getTextResponseError(question, answers[index])}
                      </p>
                    ) : null}
                  </div>
                  <button className="text-sm font-semibold text-primary hover:underline" onClick={() => { setCurrentQuestion(index); setPhase('questions') }}>
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-8 rounded-card border border-primary/25 bg-gradient-to-br from-primary/15 to-surface-elevated p-8">
            <h3 className="mb-1 text-xl font-black text-white">You&apos;re about to earn</h3>
            <p className="text-3xl font-black text-primary">
              {formatCoins(assignment.mission.coinPerTester)} coins <span className="text-lg text-text-muted">(≈ {formatRupeesFromCoins(assignment.mission.coinPerTester)})</span>
            </p>
          </div>

          {submitError ? <p className="mb-4 text-sm text-red-400">{submitError}</p> : null}

          <div className="flex items-center justify-between">
            <button className={workspaceBackLinkClass} onClick={() => setPhase('questions')}>
              ← Previous question
            </button>
            <button
              className={`flex items-center gap-2 px-12 py-4 text-lg ${primaryButtonClass}`}
              disabled={submitLoading || tooShortIndexes.length > 0}
              onClick={() => void handleSubmitFeedback()}
            >
              {submitLoading ? <SpinnerIcon className="w-5 h-5" /> : null}
              SUBMIT FEEDBACK →
            </button>
          </div>
          {tooShortIndexes.length > 0 ? (
            <p className="mt-3 text-right text-sm text-red-400">
              {tooShortIndexes.length === 1 ? '1 answer is too short' : `${tooShortIndexes.length} answers are too short`}
            </p>
          ) : null}
          <div className="mt-4 text-right">
            <button
              type="button"
              className="text-sm font-semibold text-text-muted underline transition-colors hover:text-text-main"
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
        </div>
      </div>
    )
  }

  return (
    <div className={workspacePageClass}>
      <div className="mx-auto max-w-4xl">
        <div className={`${workspacePanelClass} p-8 text-center sm:p-10 lg:p-12`}>
          <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative z-10">
        <div className="mb-6 inline-flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover shadow-[0_20px_45px_-22px_rgba(249,124,90,0.55)]">
          <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className={`${workspaceEyebrowClass} mb-4`}>
          <BrandMark className="h-3.5 w-3.5 text-primary" />
          Mission complete
        </div>
        <h1 className="mb-3 text-4xl font-black tracking-tight text-white">Mission complete!</h1>
        <p className="mb-8 text-lg text-text-muted">Thank you for your feedback. Your reward is ready.</p>

        <div className="mx-auto mb-8 max-w-md rounded-card border border-primary/25 bg-gradient-to-br from-primary/15 to-surface-elevated p-8">
          <div className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-text-muted">You earned</div>
          <div className="text-4xl font-black text-white">{formatCoins(successState?.coinsEarned ?? 0)} coins</div>
          <div className="mt-2 text-sm text-text-muted">≈ {formatRupeesFromCoins(successState?.coinsEarned ?? 0)}</div>
        </div>

        {successState?.newTier ? <div className="mx-auto mb-8 max-w-md rounded-[1.75rem] border border-primary/25 bg-primary/10 p-6 text-sm font-bold text-primary">You&apos;re now a {successState.newTier} tester!</div> : null}

        <div className="mx-auto mb-8 grid max-w-2xl gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-border-subtle bg-surface-elevated p-4"><div className="text-2xl font-black text-white">{successState?.stats?.totalCompleted ?? 0}</div><div className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">Total missions</div></div>
          <div className="rounded-[1.5rem] border border-border-subtle bg-surface-elevated p-4"><div className="text-2xl font-black text-white">{formatCoins(successState?.stats?.coinBalance ?? 0)}</div><div className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">Total coins</div></div>
          <div className="rounded-[1.5rem] border border-border-subtle bg-surface-elevated p-4"><div className="text-2xl font-black text-primary">{successState?.stats?.completionRate ?? 0}%</div><div className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">Success rate</div></div>
        </div>

        <button className={`mb-4 px-10 py-3.5 ${primaryButtonClass}`} onClick={() => router.push('/dashboard/tester')}>
          BACK TO DASHBOARD
        </button>
          </div>
        </div>
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
    return <WorkspaceStatusPanel title="This page is for testers only." actionHref="/dashboard/founder" actionLabel="GO TO DASHBOARD" />
  }

  if (user.role !== 'TESTER') {
    return <WorkspaceStatusPanel title="This page is for testers only." actionHref="/select-role" actionLabel="CHOOSE ROLE" />
  }

  return <TesterWorkspacePage assignmentId={assignmentId} />
}
