"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ReactNode, useCallback, useEffect, useState, useMemo } from 'react'
import { apiFetch, isApiClientError } from '@/lib/api/client'
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
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, ArrowRight, Clock, Star, LineChart,
  MessageSquare, Users, Download, Sparkles,
  ChevronUp, BarChart3,
  MessageCircle, Loader2, Target
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
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
      className="group relative overflow-hidden rounded-panel border border-white/60 bg-white/70 p-6 shadow-xl shadow-[#fdf0eb]/70 backdrop-blur-xl transition-all hover:bg-white/90"
    >
      <div className="absolute -right-6 -top-6 rounded-full bg-[#faf9f7]/80 p-8 transition-transform group-hover:scale-110">
        <Icon className="h-8 w-8 text-[#D97757]/45" />
      </div>

      <div className="relative mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
          <Icon className="h-4 w-4 text-[#D97757]" />
          {label}
        </div>
        {chip && (
          <div className="rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700 backdrop-blur-md">
            {chip}
          </div>
        )}
      </div>

      <div className="relative mb-2 flex items-baseline gap-2">
        <div className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-700">
          {value}
        </div>
      </div>

      {footer && <div className="relative mt-4 border-t border-slate-100/80 pt-4">{footer}</div>}
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
      className="group relative rounded-[1.5rem] border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:border-[#fdf0eb]/80 hover:shadow-md"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#faf9f7] to-[#fdf0eb] text-[#D97757] shadow-inner">
          <MessageCircle size={18} />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900">Tester {index + 1}</div>
          <div className="text-xs font-medium text-slate-500">Anonymous response</div>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">{response}</p>
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
            className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-[1.5rem] border-2 border-dashed border-[#fdf0eb] bg-[#faf9f7]/30 text-[#D97757] transition-colors hover:border-[#fdf0eb] hover:bg-[#faf9f7]/70"
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
              className="flex items-center gap-2 rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
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
      <div className="flex flex-col items-center justify-center rounded-panel border border-amber-100/50 bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 text-center shadow-inner">
        <div className="text-5xl font-black text-amber-600">
          {question.averageRating?.toFixed(1) ?? '0.0'}
        </div>
        <div className="mt-3">
          <StarRow value={question.averageRating ?? 0} size={20} />
        </div>
        <div className="mt-2 text-[0.65rem] font-bold uppercase tracking-wider text-amber-700/60">
          Average Rating
        </div>
      </div>

      <div className="space-y-3">
        {question.distribution.map((item, i) => (
          <div key={`${question.questionId}-${item.rating}`} className="group flex items-center gap-4">
            <div className="flex w-6 shrink-0 items-center justify-end gap-1 text-sm font-bold text-slate-600">
              {item.rating} <Star size={12} className="fill-amber-400 text-amber-400" />
            </div>
            <div className="relative flex-1 h-3 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${item.percentage}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
              />
            </div>
            <div className="w-10 shrink-0 text-right text-sm font-bold text-slate-500">
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
          className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm"
        >
          <div className="relative z-10 flex items-center justify-between mb-3">
            <span className="font-semibold text-slate-900 pr-4 truncate">{item.option}</span>
            <span className="shrink-0 font-bold text-[#D97757]">{item.percentage.toFixed(0)}%</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${item.percentage}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 + (i*0.1) }}
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#D97757] to-[#D97757]"
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
  const [flaggedLowEffort, setFlaggedLowEffort] = useState(false)
  const [note, setNote] = useState('')
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
          flaggedLowEffort,
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

  return (
    <motion.div
      variants={fadeInUp}
      className="group relative overflow-hidden rounded-panel border border-white/60 bg-white/70 p-6 shadow-xl shadow-[#fdf0eb]/70 backdrop-blur-xl transition-all hover:bg-white/90"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#faf9f7] to-[#fdf0eb] text-[#D97757] shadow-inner">
          <Users size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Tester {testerIndex + 1} anonymous</h3>
          <div className="text-xs font-medium text-slate-500">
            Founders rate completed assignments one by one.
          </div>
        </div>
      </div>

      <div className="space-y-5">
          {/* Star rating */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Rating
            </label>
            <StarRow value={score} size={24} onChange={setScore} readonly={formDisabled} />
          </div>

          {/* Flag low effort */}
          <label className="flex cursor-pointer items-center gap-3 select-none">
            <input
              type="checkbox"
              checked={flaggedLowEffort}
              onChange={(event) => setFlaggedLowEffort(event.target.checked)}
              disabled={formDisabled}
              className="h-4 w-4 rounded border-slate-300 text-[#D97757] focus:ring-[#D97757] disabled:opacity-60"
            />
            <span className="text-sm font-medium text-slate-700">Flag low effort</span>
          </label>

          {/* Note */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Note <span className="normal-case font-normal tracking-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={formDisabled}
              rows={3}
              placeholder="Add a note about this tester…"
              className={`${textFieldClass} resize-none disabled:opacity-60`}
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={score === 0 || submitted || submitting}
            className={`inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm ${primaryButtonClass}`}
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

          {error ? <p className="text-xs font-semibold text-red-500">{error}</p> : null}
          {submitted && !isAlreadyRated ? (
            <p className="text-sm font-semibold text-emerald-600">Rating submitted successfully.</p>
          ) : null}
          {isAlreadyRated ? (
            <p className="text-sm font-semibold text-slate-500">This tester was already rated.</p>
          ) : null}
        </div>
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
      className="mt-12 overflow-hidden rounded-panel border border-white/60 bg-white/60 shadow-xl shadow-slate-200/40 backdrop-blur-2xl"
    >
      <div className="border-b border-slate-200/50 bg-white/50 px-8 py-6">
        <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900">
          <Star className="text-amber-500" />
          Rate Your Testers
        </h2>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Share feedback on each tester&apos;s contribution to help the community grow.
        </p>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-3"
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

/*
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
    currentRun?.clarityScore !== null && currentRun?.clarityScore !== undefined &&
    previousRun?.clarityScore !== null && previousRun?.clarityScore !== undefined
      ? currentRun.clarityScore - previousRun.clarityScore
      : null

  let deltaToneClass = 'bg-slate-100 text-slate-600'
  let deltaLabel = 'Baseline run'

  if (previousRun) {
    if (scoreDelta === null) {
      deltaLabel = 'No score delta yet'
    } else if (scoreDelta === 0) {
      deltaLabel = 'No change since last run'
    } else {
      deltaToneClass = scoreDelta > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
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
      className="mt-12 overflow-hidden rounded-panel border border-white/60 bg-white/60 shadow-xl shadow-slate-200/40 backdrop-blur-2xl"
    >
      <div className="border-b border-slate-200/50 bg-white/50 px-8 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900">
            <LineChart className="text-[#D97757]" />
            Retest Delta
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Track clarity changes across every related run and launch the next retest from here.
          </p>
        </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            {/*
            <div className={`rounded-full px-4 py-2 text-sm font-black ${deltaToneClass}`}>
            {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)} since last run
          </div>
        )}
      </div>

      <div className="relative flex justify-between gap-2 pt-4">
        <div className="absolute left-0 top-[2.25rem] -z-10 h-0.5 w-full bg-slate-200" />
        
        {sorted.map((item, idx) => {
          const isCurrent = item.id === currentMissionId
          return (
            <Link key={item.id} href={`/mission/insights/${item.id}`} className="group flex flex-col items-center gap-3">
              <div className={`relative flex h-4 w-4 items-center justify-center rounded-full ring-4 ${isCurrent ? 'bg-[#D97757] ring-[#fdf0eb]' : 'bg-slate-300 ring-white group-hover:bg-slate-400'}`}>
                {isCurrent && <div className="absolute -top-8 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-bold text-white shadow-lg">You are here</div>}
              </div>
              <div className="flex flex-col items-center text-center">
                <span className={`text-xs font-bold ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>Run {idx + 1}</span>
                <span className="text-xs font-medium text-slate-400">{item.completedAt ? format(new Date(item.completedAt), 'MMM d') : 'Draft'}</span>
                {item.clarityScore && (
                  <span className="mt-1 font-mono text-sm font-bold text-[#D97757]">{item.clarityScore.toFixed(1)}</span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </motion.section>
  )
}

/* ────────────────────────────────────────────────────────────────────────────────────────────── */

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

  let deltaToneClass = 'bg-slate-100 text-slate-600'
  let deltaLabel = 'Baseline run'

  if (previousRun) {
    if (scoreDelta === null) {
      deltaLabel = 'No score delta yet'
    } else if (scoreDelta === 0) {
      deltaLabel = 'No change since last run'
    } else {
      deltaToneClass =
        scoreDelta > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
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
      className="mt-12 overflow-hidden rounded-panel border border-white/60 bg-white/60 shadow-xl shadow-slate-200/40 backdrop-blur-2xl"
    >
      <div className="border-b border-slate-200/50 bg-white/50 px-8 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900">
              <LineChart className="text-[#D97757]" />
              Retest Delta
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Track clarity changes across every related run and launch the next retest from here.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className={`rounded-full px-4 py-2 text-sm font-black ${deltaToneClass}`}>
              {deltaLabel}
            </div>
            <button
              type="button"
              onClick={() => void handleRunRetest()}
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-6 py-3 text-sm ${primaryButtonClass}`}
            >
              {isSubmitting ? <SpinnerIcon /> : null}
              Run Retest
            </button>
            {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="overflow-x-auto">
          <div className="relative flex min-w-max items-start gap-5 pb-2">
            <div className="absolute left-8 right-8 top-5 h-px bg-slate-200" />

            {timelineRuns.map((run, index) => {
              const isCurrentRun = run.id === mission.id
              const href = run.completedAt
                ? `/mission/insights/${run.id}`
                : `/mission/wizard?edit=${run.id}`

              return (
                <Link key={run.id} href={href} className="relative z-10 flex w-52 shrink-0 flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-4 w-4 rounded-full ring-4 ${
                        isCurrentRun ? 'bg-[#D97757] ring-[#fdf0eb]' : 'bg-slate-300 ring-white'
                      }`}
                    />
                    <span className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-slate-500">
                      Run {index + 1}
                    </span>
                  </div>

                  <div
                    className={`rounded-2xl border p-5 shadow-sm transition-colors ${
                      isCurrentRun
                        ? 'border-[#D97757]/30 bg-[#fff7f3]'
                        : 'border-slate-200 bg-white hover:border-[#D97757]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="line-clamp-2 text-sm font-black text-slate-900">{run.title}</div>
                      {isCurrentRun ? (
                        <div className="rounded-full bg-[#D97757] px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white">
                          Current
                        </div>
                      ) : null}
                    </div>

                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {run.completedAt ? format(new Date(run.completedAt), 'MMM d, yyyy') : 'Draft retest'}
                    </p>

                    <div className="mt-4">
                      <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Clarity score
                      </div>
                      <div className="mt-1 text-2xl font-black text-[#1a1625]">
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
    try {
      const synthesisResponse = await apiFetch<SynthesisResult>(`/api/v1/missions/${missionId}/synthesize`)
      setSynthesis(synthesisResponse)
    } catch (error) {
      console.error('Failed to load synthesis:', error)
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#D97757]" />
          <p className="text-sm font-medium text-slate-500 animate-pulse tracking-wide">Gathering mission insights...</p>
        </div>
      </div>
    )
  }

  if (isNotFound) {
    return <NotFoundPanel backHref="/dashboard/founder" />
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-xl rounded-panel border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="text-2xl font-black text-slate-900">Unable to load insights</h1>
          <p className="mt-3 text-sm font-medium text-slate-600">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className={`mt-6 px-6 py-3 text-sm ${primaryButtonClass}`}
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#faf9f7]/40 via-white to-[#fdf0eb]/40 px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/60 bg-white shadow-xl shadow-[#fdf0eb]">
            <Clock className="h-10 w-10 text-[#D97757]" />
          </div>
          <h1 className="mb-4 text-3xl font-black tracking-tight text-slate-900">
            Awaiting Tester Feedback
          </h1>
          <p className="mb-8 text-lg font-medium text-slate-600">
            The insights report unlocks automatically as soon as responses start rolling in. Check back soon.
          </p>
          <Link 
            href={`/mission/status/${missionId}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-3.5 font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] hover:bg-[#D97757] hover:shadow-[#D97757]/30"
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
    <div className="min-h-screen bg-gradient-to-br from-[#faf9f7]/50 via-white to-[#fdf0eb]/50 pb-24 pt-8 sm:pt-12 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute -left-1/4 top-0 h-[800px] w-[800px] rounded-full bg-[#D97757]/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-1/4 bottom-0 h-[600px] w-[600px] rounded-full bg-[#D97757]/10 blur-[120px]" />

      <div className="relative mx-auto max-w-[1200px] px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <Link
            href="/dashboard/founder"
            className="group flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-transform group-hover:-translate-x-1">
              <ArrowLeft size={16} />
            </div>
            Back to Dashboard
          </Link>
          <Link
            href={`/mission/status/${missionId}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#D97757] transition-colors hover:text-[#b85c3a] hover:underline underline-offset-4"
          >
            Mission Status <ArrowRight size={16} />
          </Link>
        </motion.div>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-panel border border-white/60 bg-white/70 p-8 shadow-2xl shadow-[#fdf0eb]/80 backdrop-blur-2xl sm:p-12"
        >
          <div className="pointer-events-none absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-[#D97757] via-[#D97757] to-pink-500" />
          
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#faf9f7]/80 px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-[#b85c3a] ring-1 ring-[#fdf0eb]/50 backdrop-blur-sm">
                <Sparkles size={14} className="text-[#D97757]" />
                {formatStatusLabel(mission.status)} Report
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl/tight bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-800 to-[#b85c3a]">
                {mission.title}
              </h1>
              <p className="mt-6 text-lg/relaxed font-medium text-slate-600 max-w-2xl">
                {mission.goal}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled
                title="PDF export coming soon"
                className="inline-flex h-12 shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-gradient-to-b from-white to-slate-50 px-6 font-bold text-slate-400 shadow-sm ring-1 ring-slate-200/80 opacity-80"
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
          className="mt-8 grid gap-6 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.5fr)]"
        >
          <SummaryStatCard
            label="Total Testers"
            value={feedback.summary.completedCount.toLocaleString()}
            icon={Users}
            chip="Live Signal"
            footer={<span className="text-sm text-slate-500 font-medium">From {mission.testersCompleted} completed</span>}
          />
          <SummaryStatCard
            label="Avg Duration"
            value={formatDuration(feedback.timingMetrics?.avgCompletionSeconds)}
            icon={Clock}
            footer={<span className="text-sm text-slate-500 font-medium">To complete mission</span>}
          />
          <SummaryStatCard
            label="Clarity Score"
            value={`${clarityScore.toFixed(1)}/5`}
            icon={Target}
            footer={<StarRow value={clarityScore} size={18} readonly />}
          />

          <motion.div 
            variants={fadeInUp}
            className="group relative overflow-hidden rounded-panel bg-[#b85c3a] p-8 text-white shadow-2xl shadow-[#b85c3a]/30 xl:p-10"
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D97757]/20 blur-3xl transition-transform duration-700 group-hover:scale-150" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#D97757]/20 blur-3xl transition-transform duration-700 group-hover:scale-150" />
            
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#fdf0eb]">
                  <Sparkles size={16} /> Key AI Insight
                </div>
                <p className="text-xl font-medium leading-relaxed text-[#faf9f7] lg:text-2xl">
                  &ldquo;{insightQuote}&rdquo;
                </p>
              </div>
              <div className="mt-8 border-t border-[#b85c3a]/40 pt-6 text-sm font-medium text-[#fdf0eb]">
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
          className="mt-8 overflow-hidden rounded-panel border border-white/60 bg-[#fdf8f6] p-8 shadow-xl shadow-[#fdf0eb]/70 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900">
                <Sparkles className="text-[#d77a57]" />
                AI Insights
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                AI-powered analysis of your feedback data
              </p>
            </div>
          </div>

          {synthesis ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Summary</h3>
                <p className="text-slate-700 leading-relaxed">{synthesis.summary}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Recommended Next Action</h3>
                <p className="text-[#d77a57] font-semibold text-lg">{synthesis.recommendation}</p>
              </div>

              {synthesis.frictionPoints.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Key Friction Points</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {synthesis.frictionPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Signal Strength:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  synthesis.signalStrength === 'HIGH' ? 'bg-green-100 text-green-700' :
                  synthesis.signalStrength === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {synthesis.signalStrength}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <button
                onClick={() => void loadSynthesis()}
                disabled={synthesisLoading}
                className={`inline-flex items-center gap-2 px-6 py-3 text-sm ${primaryButtonClass}`}
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
                <p className="mt-4 text-sm text-slate-500">This may take a few seconds...</p>
              )}
            </div>
          )}
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 overflow-hidden rounded-panel border border-white/60 bg-white/60 shadow-xl shadow-slate-200/40 backdrop-blur-2xl"
        >
          <div className="border-b border-slate-200/50 bg-white/50 px-8 py-6">
            <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900">
              <BarChart3 className="text-[#D97757]" />
              Response Analysis
            </h2>
          </div>

          <div className="divide-y divide-slate-100/80">
            {reportQuestions.map((question, idx) => (
              <motion.div
                key={question.questionId}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="grid gap-8 p-8 lg:grid-cols-[320px_minmax(0,1fr)] xl:p-12 hover:bg-white/40 transition-colors"
              >
                <div>
                  <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-[#faf9f7] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-[#D97757] ring-1 ring-[#fdf0eb]/50">
                    Question {String(question.order).padStart(2, '0')}
                  </div>
                  <h3 className="text-xl font-bold leading-tight text-slate-900 mb-4">{question.text}</h3>
                  <p className="text-sm font-medium leading-relaxed text-slate-500">
                    {getQuestionMeasureCopy(question)}
                  </p>
                </div>

                <div className="rounded-panel bg-slate-50/50 p-6 ring-1 ring-slate-200/50 transition-colors duration-300 hover:bg-white/50 sm:p-8">
                  <QuestionBreakdown question={question} />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200/50 bg-slate-50/50 px-8 py-6 text-sm font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              Last updated: {format(new Date(lastUpdatedAt), 'MMMM d, yyyy \u2014 h:mm a')}
            </div>
            <div className="flex items-center gap-2 font-semibold text-[#D97757]">
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
