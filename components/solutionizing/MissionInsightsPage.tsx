"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ReactNode, useCallback, useEffect, useState, useMemo } from 'react'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { toast } from '@/components/ui/sonner'
import {
  ApiFeedbackQuestion,
  ApiMissionDetail,
  ApiMissionFeedback,
  ApiMissionRetestSummary,
  SynthesisResult,
} from '@/types/api'
import { 
  NotFoundPanel,
  StarRow,
  primaryButtonClass,
  textFieldClass,
  SpinnerIcon,
} from '@/components/solutionizing/ui'
import { MissionLifecycleTracker } from '@/components/solutionizing/MissionLifecycleTracker'
import { FlagSignalModal } from '@/components/solutionizing/FlagSignalModal'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, ArrowRight, Clock, Star, LineChart,
  MessageSquare, Users, Download, Sparkles,
  ChevronUp, BarChart3,
  MessageCircle, Loader2, Target
} from 'lucide-react'
import { type FlagReasonValue } from '@/lib/flags'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

function MissionInsightsPageSkeleton() {
  const skeletonBar = 'animate-pulse rounded-full bg-[var(--border)]'
  const skeletonBlock = 'animate-pulse rounded-[1.25rem] bg-[var(--bg-light)]'

  return (
    <div className="min-h-screen overflow-hidden bg-[var(--bg)] pb-24 pt-[60px] text-[var(--ink)] sm:pt-[80px]">
      <div className="fixed top-0 left-0 right-0 z-50 flex h-[56px] items-center border-b border-[var(--border)] bg-[var(--bg)]/90 px-4 backdrop-blur-md sm:px-6">
        <div className={`h-6 w-32 ${skeletonBar}`} />
      </div>
      <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 mt-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className={`h-10 w-44 ${skeletonBar}`} />
          <div className={`h-6 w-32 ${skeletonBar}`} />
        </div>

        <section className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)] p-8 sm:p-12">
          <div className={`mb-6 h-8 w-36 ${skeletonBar}`} />
          <div className={`h-14 w-full max-w-3xl rounded-[2rem] ${skeletonBar}`} />
          <div className={`mt-6 h-6 w-full max-w-2xl ${skeletonBar}`} />
        </section>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.5fr)] gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)] p-4 sm:p-6">
              <div className={`h-4 w-28 ${skeletonBar}`} />
              <div className={`mt-5 h-10 w-24 ${skeletonBar}`} />
              <div className={`mt-4 h-4 w-32 ${skeletonBar}`} />
            </div>
          ))}
          <div className="rounded-[1.25rem] bg-[var(--electric)] p-8">
            <div className={`h-4 w-28 bg-white/20 rounded-full animate-pulse`} />
            <div className={`mt-6 h-28 rounded-[2rem] bg-white/15 animate-pulse`} />
            <div className={`mt-8 h-4 w-36 bg-white/20 rounded-full animate-pulse`} />
          </div>
        </div>

        <section className="mt-8 rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)] p-8">
          <div className={`h-8 w-40 ${skeletonBar}`} />
          <div className={`mt-6 h-40 ${skeletonBlock}`} />
        </section>

        <section className="mt-12 rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)]">
          <div className="border-b border-[var(--border)] bg-[var(--bg-light)] px-8 py-6">
            <div className={`h-8 w-48 ${skeletonBar}`} />
          </div>
          <div className="space-y-6 p-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={`h-40 ${skeletonBlock}`} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function formatStatusLabel(status: string) {
  return status.replaceAll('_', ' ')
}

function formatDuration(totalSeconds: number | null | undefined) {
  if (!totalSeconds || totalSeconds <= 0) return '0m 0s'
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)
  return `${minutes}m ${seconds}s`
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

type CompletedAssignment = NonNullable<ApiMissionDetail['completedAssignments']>[number]
type RetestTimelineRun = ApiMissionRetestSummary & { clarityScore: number | null }

function getRetestTimelineTimestamp(completedAt: string | null) {
  if (!completedAt) {
    return Number.MAX_SAFE_INTEGER
  }

  const timestamp = Date.parse(completedAt)
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp
}

async function loadMissionClarityScore(missionId: string) {
  try {
    const feedback = await apiFetch<ApiMissionFeedback>(`/api/v1/missions/${missionId}/feedback`)
    return feedback.summary.clarityScore ?? null
  } catch (error) {
    if (isApiClientError(error) && error.status === 400) {
      return null
    }

    return null
  }
}

function SummaryStatCard({
  label,
  value,
  icon: Icon,
  chip,
  footer
}: {
  label: string
  value: string
  icon: React.ElementType
  chip?: string
  footer?: ReactNode
}) {
  return (
    <motion.div 
      variants={fadeInUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)] p-6 transition-all hover:border-[var(--electric-mid)] hover:shadow-[0_8px_24px_rgba(28,16,8,0.08)]"
    >
      <div className="absolute -right-6 -top-6 rounded-full bg-[var(--bg-light)] p-8 transition-transform group-hover:scale-110">
        <Icon className="h-8 w-8 text-[var(--electric)]/45" />
      </div>

      <div className="relative mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
          <Icon className="h-4 w-4 text-[var(--electric)]" />
          {label}
        </div>
        {chip && (
          <div className="rounded-full bg-[rgba(74,197,128,0.12)] px-2.5 py-0.5 text-[0.65rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[#1e7a47]">
            {chip}
          </div>
        )}
      </div>

      <div className="relative mb-2 flex items-baseline gap-2">
        <div className="text-4xl font-extrabold tracking-tight text-[var(--ink)]">
          {value}
        </div>
      </div>

      {footer && <div className="relative mt-4 border-t border-[var(--border)] pt-4">{footer}</div>}
    </motion.div>
  )
}

function TextResponseCard({ index, response }: { index: number; response: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="group relative rounded-[14px] border border-[var(--border)] bg-[var(--cream)] p-4 sm:p-5 transition-all cursor-none"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--electric-dim)] text-[var(--electric)]">
          <MessageCircle size={18} />
        </div>
        <div>
          <div className="text-sm font-bold text-[var(--ink)]">Tester {index + 1}</div>
          <div className="text-xs font-medium text-[var(--ink-soft)]">Anonymous response</div>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-[var(--ink-soft)]">{response}</p>
    </motion.div>
  )
}

function TextResponsesPreview({ questionId, responses }: { questionId: string; responses: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const previewResponses = useMemo(() => responses.slice(0, 3), [responses])
  const remainingCount = Math.max(responses.length - previewResponses.length, 0)
  
  const displayedResponses = isExpanded ? responses : previewResponses

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence>
          {displayedResponses.map((response, index) => (
            <TextResponseCard key={`${questionId}-${index}`} index={index} response={response} />
          ))}
        </AnimatePresence>

        {!isExpanded && remainingCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsExpanded(true)}
            className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed border-[var(--border-strong)] bg-[var(--cream)] text-[var(--electric)] transition-colors hover:border-[var(--electric-mid)] cursor-none"
          >
            <MessageSquare className="h-6 w-6 opacity-50" />
            <span className="text-sm font-bold tracking-wide">View {remainingCount} more</span>
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && remainingCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-center pt-2"
          >
            <button
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-light)] px-5 py-2 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] cursor-none"
            >
              Show less <ChevronUp size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RatingBreakdown({ question }: { question: Extract<ApiFeedbackQuestion, { type: 'RATING_1_5' }> }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[200px_1fr] items-center">
      <div className="flex flex-col items-center justify-center rounded-[1.25rem] border border-[var(--electric-mid)] bg-[var(--electric-dim)] p-6 text-center">
        <div className="text-5xl font-[family-name:var(--font-fraunces)] font-bold text-[var(--ink)]">
          {question.averageRating?.toFixed(1) ?? '0.0'}
        </div>
        <div className="mt-3">
          <StarRow value={question.averageRating ?? 0} size={20} />
        </div>
        <div className="mt-2 text-[0.65rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
          Average Rating
        </div>
      </div>

      <div className="space-y-3">
        {question.distribution.map((item, i) => (
          <div key={`${question.questionId}-${item.rating}`} className="group flex items-center gap-4">
            <div className="flex w-6 shrink-0 items-center justify-end gap-1 text-sm font-bold text-[var(--ink-soft)]">
              {item.rating} <Star size={12} className="fill-[var(--electric)] text-[var(--electric)]" />
            </div>
            <div className="relative flex-1 h-3 overflow-hidden rounded-full bg-[var(--border)]">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${item.percentage}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--electric)]"
              />
            </div>
            <div className="w-10 shrink-0 text-right text-sm font-bold text-[var(--ink-soft)]">
              {item.percentage.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChoiceBreakdown({ question }: { question: Extract<ApiFeedbackQuestion, { type: 'MULTIPLE_CHOICE' | 'YES_NO' }> }) {
  const sortedBreakdown = useMemo(() => 
    [...question.breakdown].sort((a, b) => b.percentage - a.percentage),
  [question.breakdown])

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sortedBreakdown.map((item, i) => (
        <motion.div 
          key={`${question.questionId}-${item.option}`}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          className="relative overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--cream)] p-4 sm:p-5 transition-colors cursor-none"
        >
          <div className="relative z-10 flex items-center justify-between mb-3">
            <span className="truncate pr-4 font-semibold text-[var(--ink)]">{item.option}</span>
            <span className="shrink-0 font-bold text-[var(--electric)]">{item.percentage.toFixed(0)}%</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${item.percentage}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 + (i*0.1) }}
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--electric)]"
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function QuestionBreakdown({ question }: { question: ApiFeedbackQuestion }) {
  switch (question.type) {
    case 'RATING_1_5':
      return <RatingBreakdown question={question} />
    case 'MULTIPLE_CHOICE':
    case 'YES_NO':
      return <ChoiceBreakdown question={question} />
    case 'TEXT_SHORT':
    case 'TEXT_LONG':
      return <TextResponsesPreview questionId={question.questionId} responses={question.allResponses} />
    default:
      return null
  }
}

/* ──────────────────────────────────── Tester-rating section ─────────────────────────────────── */

function TesterRatingCard({
  missionId,
  assignment,
  testerIndex,
  onSubmitted,
}: {
  missionId: string
  assignment: CompletedAssignment
  testerIndex: number
  onSubmitted: (assignmentId: string, ratingId: string) => void
}) {
  const [score, setScore] = useState(0)
  const [note, setNote] = useState('')
  const [flagOpen, setFlagOpen] = useState(false)
  const [flagReason, setFlagReason] = useState<FlagReasonValue | ''>('')
  const [flagDetails, setFlagDetails] = useState('')
  const [flagError, setFlagError] = useState('')
  const [flagSubmitting, setFlagSubmitting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(Boolean(assignment.rating))
  const [error, setError] = useState<string | null>(null)
  const isAlreadyRated = assignment.rating !== null
  const formDisabled = submitting || submitted

  const handleSubmit = async () => {
    if (score === 0 || submitted) {
      setError('Please select a star rating')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const rating = await apiFetch<{ id: string }>(`/api/v1/missions/${missionId}/rate-tester`, {
        method: 'POST',
        body: {
          assignmentId: assignment.id,
          score,
          note: note.trim(),
        },
      })
      setSubmitted(true)
      onSubmitted(assignment.id, rating.id)
    } catch (err: unknown) {
      setError(isApiClientError(err) ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFlagSubmit = async () => {
    if (!flagReason) {
      setFlagError('Select a quick signal before submitting.')
      return
    }

    setFlagError('')
    setFlagSubmitting(true)

    try {
      await apiFetch(`/api/v1/missions/${missionId}/flags`, {
        method: 'POST',
        body: {
          assignmentId: assignment.id,
          reason: flagReason,
          details: flagDetails.trim() || undefined,
        },
      })
      setFlagOpen(false)
      setFlagReason('')
      setFlagDetails('')
      toast.info(`Tester ${testerIndex + 1} flagged for review.`)
    } catch (err: unknown) {
      setFlagError(isApiClientError(err) ? err.message : 'Something went wrong')
    } finally {
      setFlagSubmitting(false)
    }
  }

  return (
    <motion.div
      variants={fadeInUp}
      className="group relative overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)] p-6 transition-all hover:border-[var(--electric-mid)] hover:shadow-[0_8px_24px_rgba(28,16,8,0.08)]"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--electric-dim)] text-[var(--electric)]">
          <Users size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--ink)]">Tester {testerIndex + 1} anonymous</h3>
          <div className="text-xs font-medium text-[var(--ink-soft)]">
            Founders rate completed assignments one by one.
          </div>
        </div>
      </div>

      <div className="space-y-5">
          {/* Star rating */}
          <div>
            <label className="mb-2 block text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
              Rating
            </label>
            <StarRow value={score} size={24} onChange={setScore} readonly={formDisabled} />
          </div>

          {/* Note */}
          <div>
            <label className="mb-2 block text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
              Note <span className="normal-case font-normal tracking-normal text-[var(--ink-soft)]/80">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={formDisabled}
              rows={3}
              placeholder="Add a note about this tester…"
              className={`${textFieldClass} resize-none disabled:opacity-60 cursor-none`}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setFlagError('')
              setFlagOpen(true)
            }}
            className="text-sm font-semibold text-[var(--electric)] hover:underline cursor-none"
          >
            Flag this tester
          </button>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={score === 0 || submitted || submitting}
            className={`inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm ${primaryButtonClass} cursor-none`}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Submitting…
              </>
            ) : submitted ? (
              'Already Submitted'
            ) : (
              'Submit Rating'
            )}
          </button>

          {error ? <p className="text-xs font-semibold text-[#c0392b]">{error}</p> : null}
          {submitted && !isAlreadyRated ? (
            <p className="text-sm font-semibold text-[#1e7a47]">Rating submitted successfully.</p>
          ) : null}
          {isAlreadyRated ? (
            <p className="text-sm font-semibold text-[var(--ink-soft)]">This tester was already rated.</p>
          ) : null}
        </div>
        {flagOpen ? (
          <FlagSignalModal
            title="Flag this tester"
            subtitle="Use a quick structured signal when this tester contribution feels unclear, risky, or not useful."
            targetLabel={`Tester ${testerIndex + 1}`}
            reason={flagReason}
            details={flagDetails}
            errorMessage={flagError}
            isSubmitting={flagSubmitting}
            onReasonChange={setFlagReason}
            onDetailsChange={setFlagDetails}
            onClose={() => setFlagOpen(false)}
            onSubmit={() => void handleFlagSubmit()}
          />
        ) : null}
    </motion.div>
  )
}

function RateTestersSection({
  missionId,
  assignments,
  onSubmitted,
}: {
  missionId: string
  assignments: CompletedAssignment[]
  onSubmitted: (assignmentId: string, ratingId: string) => void
}) {
  if (assignments.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-12 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)]"
    >
      <div className="border-b border-[var(--border)] bg-[var(--bg-light)] px-8 py-6">
        <h2 className="flex items-center gap-3 text-2xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">
          <Star className="text-[var(--electric)]" />
          Rate Your Testers
        </h2>
        <p className="mt-2 text-sm font-medium text-[var(--ink-soft)]">
          Share feedback on each tester&apos;s contribution to help the community grow.
        </p>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 sm:p-8"
      >
        {assignments.map((assignment, index) => (
          <TesterRatingCard
            key={assignment.id}
            missionId={missionId}
            assignment={assignment}
            testerIndex={index}
            onSubmitted={onSubmitted}
          />
        ))}
      </motion.div>
    </motion.section>
  )
}


function RetestDeltaSection({
  mission,
  currentClarityScore,
}: {
  mission: ApiMissionDetail
  currentClarityScore: number | null
}) {
  const router = useRouter()
  const [timelineRuns, setTimelineRuns] = useState<RetestTimelineRun[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    const currentRun = {
      id: mission.id,
      title: mission.title,
      completedAt: mission.completedAt,
    }

    setTimelineRuns([{ ...currentRun, clarityScore: currentClarityScore }])

    async function loadTimeline() {
      const parentMission = mission.parentMissionId
        ? await apiFetch<ApiMissionDetail>(`/api/v1/missions/${mission.parentMissionId}`).catch(() => null)
        : null

      const relatedRuns = [
        ...(parentMission
          ? [{ id: parentMission.id, title: parentMission.title, completedAt: parentMission.completedAt }]
          : []),
        ...(parentMission?.retests ?? []),
        currentRun,
        ...(mission.retests ?? []),
      ]

      const uniqueRuns = Array.from(new Map(relatedRuns.map((run) => [run.id, run])).values())
      const clarityScores = await Promise.all(
        uniqueRuns.map((run) =>
          run.id === mission.id ? Promise.resolve(currentClarityScore) : loadMissionClarityScore(run.id)
        )
      )

      if (isCancelled) {
        return
      }

      setTimelineRuns(
        uniqueRuns
          .map((run, index) => ({
            ...run,
            clarityScore: clarityScores[index],
          }))
          .sort(
            (leftRun, rightRun) =>
              getRetestTimelineTimestamp(leftRun.completedAt) -
              getRetestTimelineTimestamp(rightRun.completedAt)
          )
      )
    }

    void loadTimeline()

    return () => {
      isCancelled = true
    }
  }, [
    currentClarityScore,
    mission.completedAt,
    mission.id,
    mission.parentMissionId,
    mission.retests,
    mission.title,
  ])

  const currentRun = timelineRuns.find((run) => run.id === mission.id) ?? null
  const currentRunIndex = timelineRuns.findIndex((run) => run.id === mission.id)
  const previousRun =
    currentRunIndex <= 0
      ? null
      : timelineRuns
          .slice(0, currentRunIndex)
          .reverse()
          .find((run) => run.completedAt !== null) ?? null

  const scoreDelta =
    currentRun?.clarityScore !== null &&
    currentRun?.clarityScore !== undefined &&
    previousRun?.clarityScore !== null &&
    previousRun?.clarityScore !== undefined
      ? currentRun.clarityScore - previousRun.clarityScore
      : null

  let deltaToneClass = 'bg-[var(--bg-light)] text-[var(--ink-soft)]'
  let deltaLabel = 'Baseline run'

  if (previousRun) {
    if (scoreDelta === null) {
      deltaLabel = 'No score delta yet'
    } else if (scoreDelta === 0) {
      deltaLabel = 'No change since last run'
    } else {
      deltaToneClass =
        scoreDelta > 0 ? "bg-[rgba(74,197,128,0.12)] text-[#1e7a47] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em]" : "bg-[rgba(192,57,43,0.1)] text-[#c0392b] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em]"
      deltaLabel = `${scoreDelta > 0 ? '+' : ''}${scoreDelta.toFixed(1)} since last run`
    }
  }

  async function handleRunRetest() {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const newMission = await apiFetch<ApiMissionDetail>(`/api/v1/missions/${mission.id}/retest`, {
        method: 'POST',
      })

      router.push(`/mission/wizard?edit=${newMission.id}`)
    } catch (error) {
      setSubmitError(isApiClientError(error) ? error.message : 'Something went wrong. Try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="mt-12 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)]"
    >
      <div className="border-b border-[var(--border)] bg-[var(--bg-light)] px-8 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">
              <LineChart className="text-[var(--electric)]" />
              Retest Delta
            </h2>
            <p className="mt-2 text-sm font-medium text-[var(--ink-soft)]">
              Track clarity changes across every related run and launch the next retest from here.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className={`rounded-full px-4 py-2 text-sm font-bold ${deltaToneClass}`}>
              {deltaLabel}
            </div>
            <button
              type="button"
              onClick={() => void handleRunRetest()}
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-6 py-3 text-sm ${primaryButtonClass} cursor-none`}
            >
              {isSubmitting ? <SpinnerIcon /> : null}
              Run Retest
            </button>
            {submitError ? <p className="text-sm font-medium text-[#c0392b]">{submitError}</p> : null}
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="overflow-x-auto">
          <div className="relative flex min-w-max items-start gap-5 pb-2">
            <div className="absolute left-8 right-8 top-5 h-px bg-[var(--border)]" />

            {timelineRuns.map((run, index) => {
              const isCurrentRun = run.id === mission.id
              const href = run.completedAt
                ? `/mission/insights/${run.id}`
                : `/mission/wizard?edit=${run.id}`

              return (
                <Link key={run.id} href={href} className="relative z-10 flex w-52 shrink-0 flex-col gap-3 cursor-none">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-4 w-4 rounded-full ring-4 ${
                        isCurrentRun ? 'bg-[var(--electric)] ring-[var(--electric-mid)]' : 'bg-[var(--bg-light)] ring-[var(--border)]'
                      }`}
                    />
                    <span className="text-[0.7rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                      Run {index + 1}
                    </span>
                  </div>

                  <div
                    className={`rounded-2xl border p-5 shadow-sm transition-colors ${
                      isCurrentRun
                        ? 'border-[var(--electric-mid)] bg-[var(--electric-dim)]'
                        : 'border-[var(--border)] bg-[var(--bg-light)] hover:border-[var(--electric-mid)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="line-clamp-2 text-sm font-bold text-[var(--ink)]">{run.title}</div>
                      {isCurrentRun ? (
                        <div className="rounded-full bg-[var(--electric)] px-2.5 py-1 text-[0.65rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--cream)]">
                          Current
                        </div>
                      ) : null}
                    </div>

                    <p className="mt-2 text-xs font-medium text-[var(--ink-soft)]">
                      {run.completedAt ? format(new Date(run.completedAt), 'MMM d, yyyy') : 'Draft retest'}
                    </p>

                    <div className="mt-4">
                      <div className="text-[0.65rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                        Clarity score
                      </div>
                      <div className="mt-1 text-2xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">
                        {run.clarityScore === null ? 'Pending' : run.clarityScore.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export function MissionInsightsPage({ missionId }: { missionId: string }) {
  const [mission, setMission] = useState<ApiMissionDetail | null>(null)
  const [feedback, setFeedback] = useState<ApiMissionFeedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [notReady, setNotReady] = useState(false)
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null)
  const [synthesisLoading, setSynthesisLoading] = useState(false)
  const [synthesisError, setSynthesisError] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setNotReady(false)
    setLoadError('')
    try {
      const [missionResponse, feedbackResponse] = await Promise.all([
        apiFetch<ApiMissionDetail>(`/api/v1/missions/${missionId}`),
        apiFetch<ApiMissionFeedback>(`/api/v1/missions/${missionId}/feedback`).catch((error) => {
          if (
            isApiClientError(error) &&
            error.status === 400 &&
            error.code === 'BAD_REQUEST' &&
            error.message.toLowerCase().includes('no completed responses')
          ) {
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
      } else {
        setLoadError(
          isApiClientError(error) && error.code === 'NETWORK_ERROR'
            ? 'Check your internet connection'
            : 'Something went wrong while loading mission insights.'
        )
      }
    } finally {
      setIsLoading(false)
    }
  }, [missionId])

  const loadSynthesis = useCallback(async () => {
    setSynthesisLoading(true)
    setSynthesisError('')
    try {
      const synthesisResponse = await apiFetch<SynthesisResult>(`/api/v1/missions/${missionId}/synthesize`)
      setSynthesis(synthesisResponse)
    } catch (error) {
      setSynthesisError(
        isApiClientError(error) ? error.message : 'Synthesis failed — please try again.'
      )
    } finally {
      setSynthesisLoading(false)
    }
  }, [missionId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleAssignmentRated = useCallback((assignmentId: string, ratingId: string) => {
    setMission((currentMission) => {
      if (!currentMission?.completedAssignments) {
        return currentMission
      }

      return {
        ...currentMission,
        completedAssignments: currentMission.completedAssignments.map((assignment) =>
          assignment.id === assignmentId ? { ...assignment, rating: { id: ratingId } } : assignment
        ),
      }
    })
  }, [])

  if (isLoading) {
    return <MissionInsightsPageSkeleton />
  }

  if (isNotFound) {
    return <NotFoundPanel backHref="/dashboard/founder" />
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 py-12 text-[var(--ink)]">
        <div className="w-full max-w-xl rounded-[1.25rem] border border-[rgba(192,57,43,0.18)] bg-[rgba(192,57,43,0.04)] p-8 text-center">
          <h1 className="text-2xl font-['Fraunces'] italic font-normal text-[var(--ink)]">Unable to load insights</h1>
          <p className="mt-3 text-sm font-medium text-[var(--ink-soft)]">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className={`mt-6 px-6 py-3 text-sm ${primaryButtonClass} cursor-none`}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!mission) {
    return <NotFoundPanel backHref="/dashboard/founder" />
  }

  if (mission.testersCompleted === 0 || notReady || !feedback) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 py-12 text-[var(--ink)]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--border)] bg-[var(--bg-light)]">
            <Clock className="h-10 w-10 text-[var(--electric)]" />
          </div>
          <h1 className="mb-4 text-3xl font-['Fraunces'] italic font-normal tracking-tight text-[var(--ink)]">
            Awaiting Tester Feedback
          </h1>
          <p className="mb-8 text-lg font-medium text-[var(--ink-soft)]">
            The insights report unlocks automatically as soon as responses start rolling in. Check back soon.
          </p>
          <Link 
            href={`/mission/status/${missionId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--electric)] px-8 py-3.5 font-semibold text-[var(--cream)] transition-opacity hover:opacity-90 cursor-none"
          >
            View Mission Status <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    )
  }

  const clarityScore = feedback.summary.clarityScore ?? 0
  const confidenceScore = Math.round(clarityScore * 20)
  const lastUpdatedAt = mission.completedAt ?? mission.updatedAt ?? mission.createdAt
  const reportQuestions = [...feedback.byQuestion].sort((a, b) => a.order - b.order)
  const insightQuote = feedback.summary.representativeQuote ?? 'Representative insight will appear once more written feedback is available.'
  const completedAssignments = mission.completedAssignments ?? []
  const shouldShowRateTesters =
    mission.status === 'COMPLETED' && completedAssignments.length > 0
  const shouldShowRetestDelta = mission.status === 'COMPLETED'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] pb-24 pt-[60px] text-[var(--ink)] sm:pt-[80px]">
      {/* Fixed Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-[56px] items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/90 px-4 backdrop-blur-md sm:px-6">
        <Link
          href="/dashboard/founder"
          className="group flex items-center gap-2 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] cursor-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-light)] transition-transform group-hover:-translate-x-1">
            <ArrowLeft size={16} />
          </div>
          Back to Dashboard
        </Link>
        <Link
          href={`/mission/status/${missionId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--electric)] transition-colors hover:text-[var(--electric)] hover:underline underline-offset-4 cursor-none"
        >
          Mission Status <ArrowRight size={16} />
        </Link>
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <MissionLifecycleTracker mission={mission} />
        </motion.div>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)] p-8 sm:p-12"
        >
          <div className="pointer-events-none absolute left-0 top-0 h-2 w-full bg-[var(--electric)]" />
          
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-light)] px-4 py-1.5 text-[0.65rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--electric)]">
                <Sparkles size={14} className="text-[var(--electric)]" />
                {formatStatusLabel(mission.status)} Mission report
              </div>
              <h1 className="text-4xl font-['Fraunces'] italic font-normal text-[var(--ink)] sm:text-5xl md:text-6xl/tight">
                {mission.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg/relaxed font-medium text-[var(--ink-soft)]">
                {mission.goal}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled
                title="PDF export coming soon"
                className="inline-flex items-center justify-center gap-2 border border-[var(--border-strong)] bg-transparent text-[var(--ink)] rounded-xl px-4 py-2 hover:border-[var(--electric)] hover:text-[var(--electric)] transition-colors cursor-none"
              >
                <Download size={18} />
                Export PDF
              </button>
            </div>
          </div>
        </motion.section>

        <motion.div 
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.5fr)]"
        >
          <SummaryStatCard
            label="Total Testers"
            value={feedback.summary.completedCount.toLocaleString()}
            icon={Users}
            chip="Live Signal"
            footer={<span className="text-sm font-medium text-[var(--ink-soft)]">From {mission.testersCompleted} completed</span>}
          />
          <SummaryStatCard
            label="Avg Duration"
            value={formatDuration(feedback.timingMetrics?.avgCompletionSeconds)}
            icon={Clock}
            footer={<span className="text-sm font-medium text-[var(--ink-soft)]">To complete mission</span>}
          />
          <SummaryStatCard
            label="Clarity Score"
            value={`${clarityScore.toFixed(1)}/5`}
            icon={Target}
            footer={<StarRow value={clarityScore} size={18} readonly />}
          />

          <motion.div 
            variants={fadeInUp}
            className="group relative overflow-hidden rounded-[1.25rem] border border-[var(--electric-mid)] bg-[var(--electric)] p-8 text-[var(--cream)] xl:p-10"
          >
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--cream)]/80">
                  <Sparkles size={16} /> Key AI Insight
                </div>
                <p className="text-xl font-medium leading-relaxed text-[var(--cream)] lg:text-2xl">
                  &ldquo;{insightQuote}&rdquo;
                </p>
              </div>
              <div className="mt-8 border-t border-white/20 pt-6 text-sm font-medium text-[var(--ink)]/80">
                Synthesized from full dataset
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* AI Insights Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)] p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="flex items-center gap-3 text-2xl font-['Fraunces'] italic font-normal text-[var(--ink)]">
                <Sparkles className="text-[var(--electric)]" />
                AI Insights
              </h2>
              <p className="mt-2 text-sm font-medium text-[var(--ink-soft)]">
                AI-powered analysis of your feedback data
              </p>
            </div>
          </div>

          {synthesis ? (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-['Fraunces'] italic font-normal text-[var(--ink)]">Summary</h3>
                <p className="leading-relaxed text-[var(--ink-soft)]">{synthesis.summary}</p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-['Fraunces'] italic font-normal text-[var(--ink)]">Recommended Next Action</h3>
                <p className="text-lg font-semibold text-[var(--electric)]">{synthesis.recommendation}</p>
              </div>

              {synthesis.frictionPoints.length > 0 && (
                <div>
                  <h3 className="mb-2 text-lg font-['Fraunces'] italic font-normal text-[var(--ink)]">Key Friction Points</h3>
                  <ul className="list-inside list-disc space-y-1 text-[var(--ink-soft)]">
                    {synthesis.frictionPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--ink-soft)]">Signal Strength:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  synthesis.signalStrength === 'HIGH' ? "bg-[rgba(74,197,128,0.12)] text-[#1e7a47] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em]" :
                  synthesis.signalStrength === 'MEDIUM' ? "bg-[rgba(251,191,36,0.12)] text-[#92400e] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em]" :
                  "bg-[rgba(192,57,43,0.1)] text-[#c0392b] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em]"
                }`}>
                  {synthesis.signalStrength}
                </span>
              </div>
            </div>
          ) : synthesisError ? (
            <div className="rounded-[1.25rem] border border-[rgba(192,57,43,0.18)] bg-[rgba(192,57,43,0.04)] p-6 text-center">
              <p className="text-sm font-semibold text-[#c0392b]">{synthesisError}</p>
              <button
                type="button"
                onClick={() => void loadSynthesis()}
                disabled={synthesisLoading}
                className={`mt-4 inline-flex items-center gap-2 px-6 py-3 text-sm ${primaryButtonClass} cursor-none`}
              >
                {synthesisLoading ? (
                  <>
                    <SpinnerIcon /> Retrying…
                  </>
                ) : (
                  'Retry synthesis'
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <button
                onClick={() => void loadSynthesis()}
                disabled={synthesisLoading}
                className={`inline-flex items-center gap-2 px-6 py-3 text-sm ${primaryButtonClass} cursor-none`}
              >
                {synthesisLoading ? (
                  <>
                    <SpinnerIcon /> Generating Insights…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Generate Insights
                  </>
                )}
              </button>
              {synthesisLoading && (
                <p className="mt-4 text-sm text-[var(--ink-soft)]">This may take a few seconds...</p>
              )}
            </div>
          )}
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)]"
        >
          <div className="border-b border-[var(--border)] bg-[var(--bg-light)] px-8 py-6">
            <h2 className="flex items-center gap-3 text-2xl font-['Fraunces'] italic font-normal text-[var(--ink)]">
              <BarChart3 className="text-[var(--electric)]" />
              Response Analysis
            </h2>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {reportQuestions.map((question, idx) => (
              <motion.div
                key={question.questionId}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="grid gap-8 p-8 transition-colors hover:bg-[var(--bg-light)]/40 lg:grid-cols-[320px_minmax(0,1fr)] xl:p-12"
              >
                <div>
                  <div className="mb-4 inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-light)] px-3 py-1.5 text-[0.65rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--electric)]">
                    Question {String(question.order).padStart(2, '0')}
                  </div>
                  <h3 className="mb-4 text-xl font-['Fraunces'] italic font-normal leading-tight text-[var(--ink)]">{question.text}</h3>
                  <p className="text-sm font-medium leading-relaxed text-[var(--ink-soft)]">
                    {getQuestionMeasureCopy(question)}
                  </p>
                </div>

                <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)] p-6 transition-colors duration-300 hover:border-[var(--electric-mid)] sm:p-8">
                  <QuestionBreakdown question={question} />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col gap-4 border-t border-[var(--border)] bg-[var(--bg-light)] px-8 py-6 text-sm font-medium text-[var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              Last updated: {format(new Date(lastUpdatedAt), 'MMMM d, yyyy \u2014 h:mm a')}
            </div>
            <div className="flex items-center gap-2 font-semibold text-[var(--electric)]">
              <Target size={16} />
              Model Confidence: {confidenceScore}%
            </div>
          </div>
        </motion.section>

        {/* Rate Your Testers – only for completed missions */}
        {shouldShowRateTesters ? (
          <RateTestersSection
            missionId={missionId}
            assignments={completedAssignments}
            onSubmitted={handleAssignmentRated}
          />
        ) : null}

        {shouldShowRetestDelta ? (
          <RetestDeltaSection
            mission={mission}
            currentClarityScore={feedback.summary.clarityScore ?? null}
          />
        ) : null}
      </div>
    </div>
  )
}
