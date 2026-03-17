"use client"

import Link from 'next/link'
import { format } from 'date-fns'
import { ReactNode, useCallback, useEffect, useState, useMemo } from 'react'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { ApiFeedbackQuestion, ApiMissionDetail, ApiMissionFeedback } from '@/types/api'
import { NotFoundPanel } from '@/components/solutionizing/ui'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, ArrowRight, Clock, Star, 
  MessageSquare, Users, Download, Sparkles,
  ChevronDown, ChevronUp, BarChart3,
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

function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  const roundedValue = Math.round(value)
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < roundedValue
        return (
          <Star
            key={index}
            size={size}
            className={`${filled ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} transition-all`}
          />
        )
      })}
    </div>
  )
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
      className="group relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-xl shadow-indigo-100/30 backdrop-blur-xl transition-all hover:bg-white/90"
    >
      <div className="absolute -right-6 -top-6 rounded-full bg-indigo-50/50 p-8 transition-transform group-hover:scale-110">
        <Icon className="h-8 w-8 text-indigo-300" />
      </div>

      <div className="relative mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
          <Icon className="h-4 w-4 text-indigo-500" />
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
      className="group relative rounded-[1.5rem] border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-indigo-200/60"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 shadow-inner">
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
            className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-[1.5rem] border-2 border-dashed border-indigo-100 bg-indigo-50/30 text-indigo-600 transition-colors hover:bg-indigo-50/70 hover:border-indigo-200"
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
      <div className="flex flex-col items-center justify-center rounded-[2rem] bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 text-center shadow-inner border border-amber-100/50">
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
            <span className="font-bold text-indigo-600 shrink-0">{item.percentage.toFixed(0)}%</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${item.percentage}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 + (i*0.1) }}
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
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

function InteractiveStarInput({
  value,
  onChange,
  disabled
}: {
  value: number
  onChange: (v: number) => void
  disabled: boolean
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1
        const filled = starValue <= (hovered || value)
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onMouseEnter={() => !disabled && setHovered(starValue)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => !disabled && onChange(starValue)}
            className="p-0.5 transition-transform hover:scale-110 disabled:cursor-default disabled:opacity-70"
          >
            <Star
              size={24}
              className={`transition-all ${
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-slate-200 text-slate-200'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}

function TesterRatingCard({
  missionId,
  assignmentId,
  testerIndex
}: {
  missionId: string
  assignmentId: string
  testerIndex: number
}) {
  const [score, setScore] = useState(0)
  const [flaggedLowEffort, setFlaggedLowEffort] = useState(false)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (score === 0) {
      setError('Please select a star rating')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await apiFetch(`/api/v1/missions/${missionId}/rate-tester`, {
        method: 'POST',
        body: JSON.stringify({ assignmentId, score, flaggedLowEffort, note })
      })
      setSubmitted(true)
    } catch (err: unknown) {
      setError(isApiClientError(err) ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      variants={fadeInUp}
      className="group relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-xl shadow-indigo-100/30 backdrop-blur-xl transition-all hover:bg-white/90"
    >
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 shadow-inner">
          <Users size={18} />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900">Tester {testerIndex}</div>
          <div className="text-xs font-medium text-slate-500">Anonymous tester</div>
        </div>
      </div>

      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3 rounded-2xl bg-emerald-50/80 py-8 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <p className="text-sm font-bold text-emerald-700">Rating submitted</p>
          <div className="mt-1">
            <StarRow value={score} size={18} />
          </div>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {/* Star rating */}
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Rating
            </label>
            <InteractiveStarInput value={score} onChange={setScore} disabled={submitting} />
          </div>

          {/* Flag low effort */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={flaggedLowEffort}
              onChange={(e) => setFlaggedLowEffort(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-60"
            />
            <span className="text-sm font-medium text-slate-700">Flag low effort</span>
          </label>

          {/* Note */}
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Note <span className="normal-case tracking-normal font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
              rows={2}
              placeholder="Add a note about this tester…"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-500">{error}</p>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-indigo-600 hover:shadow-indigo-600/30 hover:scale-[1.02] disabled:opacity-60 disabled:pointer-events-none text-sm"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Submitting…
              </>
            ) : (
              'Submit Rating'
            )}
          </button>
        </div>
      )}
    </motion.div>
  )
}

function RateTestersSection({
  missionId,
  completedCount
}: {
  missionId: string
  completedCount: number
}) {
  if (completedCount <= 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-12 overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 shadow-xl shadow-slate-200/40 backdrop-blur-2xl"
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
        {Array.from({ length: completedCount }, (_, i) => (
          <TesterRatingCard
            key={`tester-${i}`}
            missionId={missionId}
            assignmentId={`slot-${i}`}
            testerIndex={i + 1}
          />
        ))}
      </motion.div>
    </motion.section>
  )
}

/* ────────────────────────────────────────────────────────────────────────────────────────────── */

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-sm font-medium text-slate-500 animate-pulse tracking-wide">Gathering mission insights...</p>
        </div>
      </div>
    )
  }

  if (isNotFound || !mission) {
    return <NotFoundPanel backHref="/dashboard/founder" />
  }

  if (mission.testersCompleted === 0 || notReady || !feedback) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/40 px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl shadow-indigo-100 border border-white/60">
            <Clock className="h-10 w-10 text-indigo-500" />
          </div>
          <h1 className="mb-4 text-3xl font-black tracking-tight text-slate-900">
            Awaiting Tester Feedback
          </h1>
          <p className="mb-8 text-lg font-medium text-slate-600">
            The insights report unlocks automatically as soon as responses start rolling in. Check back soon.
          </p>
          <Link 
            href={`/mission/status/${missionId}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-3.5 font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-indigo-600 hover:shadow-indigo-600/30 hover:scale-[1.02]"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 pb-24 pt-8 sm:pt-12 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute -left-1/4 top-0 h-[800px] w-[800px] rounded-full bg-indigo-400/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-1/4 bottom-0 h-[600px] w-[600px] rounded-full bg-purple-400/10 blur-[120px]" />

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
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-700 hover:underline underline-offset-4"
          >
            Mission Status <ArrowRight size={16} />
          </Link>
        </motion.div>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/70 p-8 shadow-2xl shadow-indigo-100/40 backdrop-blur-2xl sm:p-12"
        >
          <div className="pointer-events-none absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50/80 px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-indigo-700 ring-1 ring-indigo-200/50 backdrop-blur-sm">
                <Sparkles size={14} className="text-indigo-500" />
                {formatStatusLabel(mission.status)} Report
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl/tight bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
                {mission.title}
              </h1>
              <p className="mt-6 text-lg/relaxed font-medium text-slate-600 max-w-2xl">
                {mission.goal}
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 font-bold text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition-all hover:ring-indigo-300 hover:shadow-md hover:text-indigo-600 bg-gradient-to-b from-white to-slate-50"
            >
              <Download size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:text-indigo-500" />
              Export PDF
            </button>
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
            footer={<StarRow value={clarityScore} size={18} />}
          />

          <motion.div 
            variants={fadeInUp}
            className="group relative overflow-hidden rounded-[2.5rem] bg-indigo-950 p-8 text-white shadow-2xl shadow-indigo-900/30 xl:p-10"
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl transition-transform duration-700 group-hover:scale-150" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl transition-transform duration-700 group-hover:scale-150" />
            
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-300">
                  <Sparkles size={16} /> Key AI Insight
                </div>
                <p className="text-xl font-medium leading-relaxed text-indigo-50 lg:text-2xl">
                  &ldquo;{insightQuote}&rdquo;
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-indigo-800/50 text-sm font-medium text-indigo-300">
                Synthesized from full dataset
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 shadow-xl shadow-slate-200/40 backdrop-blur-2xl"
        >
          <div className="border-b border-slate-200/50 bg-white/50 px-8 py-6">
            <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900">
              <BarChart3 className="text-indigo-500" />
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
                  <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-indigo-50 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-indigo-600 ring-1 ring-indigo-200/50">
                    Question {String(question.order).padStart(2, '0')}
                  </div>
                  <h3 className="text-xl font-bold leading-tight text-slate-900 mb-4">{question.text}</h3>
                  <p className="text-sm font-medium leading-relaxed text-slate-500">
                    {getQuestionMeasureCopy(question)}
                  </p>
                </div>

                <div className="rounded-[2.5rem] bg-slate-50/50 p-6 ring-1 ring-slate-200/50 sm:p-8 hover:bg-white/50 transition-colors duration-300">
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
            <div className="flex items-center gap-2 font-semibold text-indigo-600">
              <Target size={16} />
              Model Confidence: {confidenceScore}%
            </div>
          </div>
        </motion.section>

        {/* Rate Your Testers – only for completed missions */}
        {mission.status === 'COMPLETED' && feedback && (
          <RateTestersSection
            missionId={missionId}
            completedCount={feedback.summary.completedCount}
          />
        )}
      </div>
    </div>
  )
}
