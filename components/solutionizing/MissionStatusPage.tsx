"use client"

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { ApiMissionDetail } from '@/types/api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ConfirmationDialog,
  MissionStatusBadge,
  NotFoundPanel,
  clampPercent,
  formatCoins,
  SpinnerIcon,
  primaryButtonClass,
} from '@/components/solutionizing/ui'

// ─── Tester Responses Types ───────────────────────────────────────────────────

interface TesterResponseAnswer {
  id: string
  questionId: string
  responseText: string | null
  responseRating: number | null
  responseChoice: string | null
  question: {
    text: string
    type: string
    order: number
  }
}

interface TesterResponse {
  id: string
  completedAt: string | null
  coinsEarned: number
  tester: {
    displayName: string
  }
  responses: TesterResponseAnswer[]
}

// ─── Answer renderer ──────────────────────────────────────────────────────────

function AnswerDisplay({ answer }: { answer: TesterResponseAnswer }) {
  const { type } = answer.question

  if (type === 'RATING_1_5' && answer.responseRating !== null) {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`text-lg ${
              i < answer.responseRating! ? 'text-amber-400' : 'text-gray-600 dark:text-gray-600'
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-sm font-semibold text-amber-400">
          {answer.responseRating} / 5
        </span>
      </div>
    )
  }

  if ((type === 'YES_NO' || type === 'MULTIPLE_CHOICE') && answer.responseChoice) {
    return (
      <span className="inline-flex items-center rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-sm font-semibold text-teal-400">
        {answer.responseChoice}
      </span>
    )
  }

  if ((type === 'TEXT_SHORT' || type === 'TEXT_LONG') && answer.responseText) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300 dark:text-gray-300">
        {answer.responseText}
      </p>
    )
  }

  return <span className="text-sm italic text-gray-500">No answer provided</span>
}

// ─── Single tester card ───────────────────────────────────────────────────────

function TesterResponseCard({
  response,
  index,
}: {
  response: TesterResponse
  index: number
}) {
  const [isOpen, setIsOpen] = useState(false)

  const initials = response.tester.displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'T'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="overflow-hidden rounded-2xl border border-gray-700/60 bg-gray-800/70 backdrop-blur-sm"
    >
      {/* Card header — always visible */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5"
        aria-expanded={isOpen}
      >
        {/* Avatar */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-black text-emerald-400">
          {initials}
        </div>

        {/* Name + timestamp */}
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-white">
            {response.tester.displayName}
          </div>
          <div className="mt-0.5 text-xs text-gray-400">
            Completed{' '}
            {response.completedAt
              ? format(new Date(response.completedAt), 'MMM d, yyyy · h:mm a')
              : 'Unknown time'}
          </div>
        </div>

        {/* Completed badge */}
        <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Completed
        </span>

        {/* Chevron */}
        <svg
          className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded answers */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-gray-700/50 px-5 py-5">
              {response.responses.length === 0 ? (
                <p className="text-sm italic text-gray-500">No answers recorded for this submission.</p>
              ) : (
                response.responses.map((answer, ansIdx) => (
                  <div key={answer.id} className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-700 text-[0.6rem] font-bold text-gray-300">
                        {ansIdx + 1}
                      </span>
                      <p className="text-sm font-semibold text-gray-200">{answer.question.text}</p>
                    </div>
                    <div className="pl-7">
                      <AnswerDisplay answer={answer} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Full Tester Responses section ────────────────────────────────────────────

function TesterResponsesSection({ missionId, completedCount }: { missionId: string; completedCount: number }) {
  const [responses, setResponses] = useState<TesterResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadResponses = useCallback(async () => {
    if (completedCount === 0) return
    setIsLoading(true)
    setError('')
    try {
      const data = await apiFetch<TesterResponse[]>(`/api/v1/missions/${missionId}/responses`)
      setResponses(data)
    } catch (fetchError) {
      setError(
        isApiClientError(fetchError) && fetchError.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : 'Could not load responses'
      )
    } finally {
      setIsLoading(false)
    }
  }, [missionId, completedCount])

  useEffect(() => {
    void loadResponses()
  }, [loadResponses])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mt-8 rounded-panel border border-[#ece6df] bg-white/80 p-8 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.22)] backdrop-blur-xl dark:border-gray-700 dark:bg-[#1a1f2e]/90"
    >
      {/* Section header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1a1625] dark:text-white">
            Tester Responses
          </h2>
          <p className="mt-1 text-sm text-[#6b687a] dark:text-gray-400">
            {completedCount === 0
              ? 'Responses will appear here as testers complete the mission.'
              : `${completedCount} tester${completedCount !== 1 ? 's' : ''} completed this mission.`}
          </p>
        </div>
        {completedCount > 0 && (
          <span className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-bold text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400">
            {completedCount} completed
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: Math.min(completedCount || 2, 3) }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border border-gray-700/40 bg-gray-800/50 dark:bg-gray-700/30"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
          <button
            type="button"
            className="ml-3 font-bold underline"
            onClick={() => void loadResponses()}
          >
            Retry
          </button>
        </div>
      ) : completedCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-600/50 bg-gray-800/30 px-8 py-12 text-center dark:bg-[#1e2433]/50">
          <div className="mb-3 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-700/50">
              <svg className="h-7 w-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"
                />
              </svg>
            </div>
          </div>
          <p className="font-semibold text-gray-300">No responses yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Check back once testers complete the mission.
          </p>
        </div>
      ) : responses.length === 0 && !isLoading ? (
        <div className="rounded-2xl border border-dashed border-gray-600/50 bg-gray-800/30 px-8 py-12 text-center">
          <p className="text-sm text-gray-500">Response data is loading…</p>
        </div>
      ) : (
        <div className="space-y-3">
          {responses.map((response, index) => (
            <TesterResponseCard key={response.id} response={response} index={index} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

function MissionStatusPageSkeleton() {
  const skeletonBar = 'animate-pulse rounded-full bg-[#e8e1da] dark:bg-gray-700'
  const skeletonBlock = 'animate-pulse rounded-3xl bg-[#f2ece7] dark:bg-gray-800'
  const panelClass =
    'rounded-panel border border-[#ece6df] bg-white/80 p-8 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.22)] backdrop-blur-xl dark:border-gray-700 dark:bg-gray-800/90'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf9f7] p-8 dark:bg-gray-900">
      <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-full bg-gradient-to-br from-[#d77a57]/10 via-[#f7dfd3]/40 to-transparent blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[60%] w-[60%] rounded-full bg-gradient-to-tl from-emerald-500/10 via-[#d77a57]/10 to-transparent blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-4xl space-y-8">
        <div className={`h-6 w-40 ${skeletonBar}`} />

        <div className={panelClass}>
          <div className="mb-8 flex items-start justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className={`h-12 w-3/4 rounded-[1.75rem] ${skeletonBar}`} />
              <div className={`h-5 w-full max-w-2xl ${skeletonBar}`} />
              <div className={`h-5 w-2/3 ${skeletonBar}`} />
            </div>
            <div className={`h-10 w-28 ${skeletonBar}`} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-900/70"
              >
                <div className={`h-3 w-24 ${skeletonBar}`} />
                <div className={`mt-4 h-9 w-24 ${skeletonBar}`} />
                <div className={`mt-3 h-4 w-20 ${skeletonBar}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <div className={`${panelClass} space-y-6`}>
            <div className={`h-4 w-36 ${skeletonBar}`} />
            <div className={`h-24 ${skeletonBlock}`} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className={`h-32 ${skeletonBlock}`} />
              <div className={`h-32 ${skeletonBlock}`} />
            </div>
          </div>
          <div className={`${panelClass} space-y-5`}>
            <div className={`h-4 w-24 ${skeletonBar}`} />
            <div className={`h-14 rounded-[2rem] ${skeletonBlock}`} />
            <div className={`h-14 rounded-[2rem] ${skeletonBlock}`} />
            <div className={`h-28 ${skeletonBlock}`} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function MissionStatusPage({ missionId }: { missionId: string }) {
  const [mission, setMission] = useState<ApiMissionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(30)
  const [dialogType, setDialogType] = useState<'pause' | 'close' | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError] = useState('')

  const loadMission = useCallback(async () => {
    setError('')

    try {
      const response = await apiFetch<ApiMissionDetail>(`/api/v1/missions/${missionId}`)
      setMission(response)
      setIsNotFound(false)
    } catch (fetchError) {
      if (isApiClientError(fetchError) && fetchError.status === 404) {
        setIsNotFound(true)
      } else {
        setError(
          isApiClientError(fetchError) && fetchError.code === 'NETWORK_ERROR'
            ? 'Check your internet connection'
            : 'Something went wrong. Please try again.'
        )
      }
    } finally {
      setIsLoading(false)
    }
  }, [missionId])

  useEffect(() => {
    void loadMission()
  }, [loadMission])

  useEffect(() => {
    if (!mission || (mission.status !== 'ACTIVE' && mission.status !== 'PAUSED')) {
      return
    }

    if (countdown <= 0) {
      void loadMission()
      setCountdown(30)
      return
    }

    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown, loadMission, mission])

  useEffect(() => {
    setCountdown(30)
  }, [mission?.id, mission?.status])

  async function handleConfirm() {
    if (!mission || !dialogType) {
      return
    }

    setDialogLoading(true)
    setDialogError('')

    try {
      if (dialogType === 'pause') {
        const updatedMission = await apiFetch<ApiMissionDetail>(`/api/v1/missions/${mission.id}/pause`, {
          method: 'POST',
        })
        setMission(updatedMission)
      } else {
        const response = await apiFetch<{
          mission: ApiMissionDetail
          refundAmount?: number
          refundCoins?: number
        }>(
          `/api/v1/missions/${mission.id}/close`,
          { method: 'POST' }
        )
        setMission(response.mission)
        const refund = response.refundCoins ?? response.refundAmount ?? 0
        toast.success(`Mission closed. ${formatCoins(refund)} coins refunded to your balance.`)
      }

      setDialogType(null)
      setCountdown(30)
    } catch (fetchError) {
      setDialogError(
        isApiClientError(fetchError) && fetchError.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setDialogLoading(false)
    }
  }

  async function handleResume() {
    if (!mission) {
      return
    }

    setResumeLoading(true)
    setResumeError('')

    try {
      const updatedMission = await apiFetch<ApiMissionDetail>(`/api/v1/missions/${mission.id}/resume`, {
        method: 'POST',
      })
      setMission(updatedMission)
      toast.success('Mission resumed.')
      setCountdown(30)
    } catch (fetchError) {
      setResumeError(
        isApiClientError(fetchError) && fetchError.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setResumeLoading(false)
    }
  }

  if (isLoading) {
    return <MissionStatusPageSkeleton />
  }

  if (isNotFound) {
    return <NotFoundPanel backHref="/dashboard/founder" />
  }

  if (!mission) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f7] p-8 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-600 shadow-[0_24px_60px_-46px_rgba(239,68,68,0.22)] backdrop-blur-xl dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      </div>
    )
  }

  const completedCount = mission.assignmentCounts?.COMPLETED ?? mission.testersCompleted
  const assignedCount = mission.assignmentCounts?.ASSIGNED ?? Math.max(mission.testersRequired - completedCount, 0)
  const inProgressCount = mission.assignmentCounts?.IN_PROGRESS ?? 0
  const timedOutCount = mission.assignmentCounts?.TIMED_OUT ?? 0
  const progress = clampPercent((mission.testersCompleted / Math.max(mission.testersRequired, 1)) * 100)
  const effectiveLaunchAt =
    mission.launchedAt ??
    ((mission.status === 'ACTIVE' || mission.status === 'PAUSED' || mission.status === 'COMPLETED')
      ? mission.reviewedAt
      : null)

  const glassPanelClasses =
    'rounded-panel border border-[#ece6df] bg-white/80 p-8 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.22)] backdrop-blur-xl transition-all duration-300 hover:border-[#e2d7cd] hover:bg-white/90 dark:border-gray-700 dark:bg-gray-800/90 dark:hover:border-gray-600 dark:hover:bg-gray-800'

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf9f7] p-8 text-[#1a1625] dark:bg-gray-900 dark:text-white">
      <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-full bg-gradient-to-br from-[#d77a57]/10 via-[#f7dfd3]/40 to-transparent blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[60%] w-[60%] rounded-full bg-gradient-to-tl from-emerald-500/10 via-[#d77a57]/10 to-transparent blur-[120px]" />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative z-10 mx-auto max-w-4xl">
        <motion.div variants={itemVariants}>
          <Link
            href="/dashboard/founder"
            className="mb-8 inline-flex items-center gap-2 font-medium text-[#6b687a] transition-colors hover:text-[#d77a57] dark:text-gray-400 dark:hover:text-[#d77a57]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to dashboard
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-10">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1 pr-8">
              <h1 className="mb-3 text-4xl font-black tracking-tight text-[#1a1625] dark:text-white sm:text-5xl">{mission.title}</h1>
              <p className="text-lg text-[#6b687a] dark:text-gray-400">{mission.goal}</p>
            </div>
            <MissionStatusBadge status={mission.status} />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`mb-6 ${glassPanelClasses}`}>
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-[#1a1625] dark:text-white">Mission Progress</h2>

          <div className="relative mb-8">
            <div className="inset-0 mb-4 h-6 w-full overflow-hidden rounded-full bg-[#ede7e2] shadow-inner dark:bg-gray-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="relative h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300"
              >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-30 mix-blend-overlay" />
              </motion.div>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-emerald-500 dark:text-emerald-400">{progress.toFixed(0)}% Complete</span>
              <span className="text-[#6b687a] dark:text-gray-400">
                {mission.testersCompleted} of {mission.testersRequired} testers
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Assigned', value: assignedCount, color: 'text-[#d77a57]', bg: 'bg-[#d77a57]/10', border: 'border-[#d77a57]/20' },
              { label: 'In Progress', value: inProgressCount, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
              { label: 'Completed', value: completedCount, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              { label: 'Timed Out', value: timedOutCount, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className={`flex flex-col items-center justify-center rounded-2xl border ${stat.border} ${stat.bg} p-6 text-center backdrop-blur-sm transition-transform hover:scale-105`}
              >
                <div className={`mb-2 text-4xl font-black tracking-tight ${stat.color}`}>{stat.value}</div>
                <div className="text-sm font-medium uppercase tracking-wider text-[#6b687a] dark:text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`mb-8 flex flex-col items-start justify-between gap-4 py-6 sm:flex-row sm:items-center ${glassPanelClasses}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d77a57]/10 text-[#d77a57] dark:bg-[#d77a57]/20 dark:text-[#d77a57]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-[#6b687a] dark:text-gray-400">Mission launched</div>
              <div className="font-semibold text-[#1a1625] dark:text-white">
                {effectiveLaunchAt ? format(new Date(effectiveLaunchAt), 'MMM d, yyyy h:mm a') : 'Not launched yet'}
              </div>
            </div>
          </div>

          {(mission.status === 'ACTIVE' || mission.status === 'PAUSED') ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ece6df] bg-white/90 px-4 py-2 text-sm font-medium text-[#6b687a] shadow-sm backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              Refreshing in {countdown}s
            </div>
          ) : null}
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
          {mission.status === 'ACTIVE' ? (
            <>
              <button
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#1a1625] px-8 py-4 font-bold tracking-wide text-white transition-all hover:bg-[#2a2535] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-[#faf9f7] dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-900"
                onClick={() => setDialogType('pause')}
              >
                PAUSE MISSION
              </button>
              <button
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-red-500/30 bg-red-500/10 px-8 py-4 font-bold tracking-wide text-red-500 transition-all hover:bg-red-500/20 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#faf9f7] dark:focus:ring-offset-gray-900"
                onClick={() => setDialogType('close')}
              >
                CLOSE MISSION
              </button>
            </>
          ) : null}

          {mission.status === 'PAUSED' ? (
            <>
              <button
                className={`inline-flex items-center gap-2 px-8 py-4 text-sm ${primaryButtonClass}`}
                onClick={() => void handleResume()}
                disabled={resumeLoading}
              >
                {resumeLoading ? <SpinnerIcon /> : null}
                RESUME MISSION
              </button>
              <button
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-red-500/30 bg-red-500/10 px-8 py-4 font-bold tracking-wide text-red-500 transition-all hover:bg-red-500/20 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#faf9f7] dark:focus:ring-offset-gray-900"
                onClick={() => setDialogType('close')}
              >
                CLOSE MISSION
              </button>
              {resumeError ? (
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-sm font-medium text-red-500 dark:text-red-400">
                  {resumeError}
                </motion.p>
              ) : null}
            </>
          ) : null}

          {mission.status === 'COMPLETED' ? (
            <Link
              href={`/mission/insights/${mission.id}`}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 font-bold tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#faf9f7] dark:focus:ring-offset-gray-900"
            >
              <span>VIEW INSIGHTS</span>
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          ) : null}
        </motion.div>

        {error ? (
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center text-sm font-medium text-red-500 dark:text-red-400">
            {error}
          </motion.p>
        ) : null}

        <TesterResponsesSection missionId={mission.id} completedCount={completedCount} />
      </motion.div>

      {dialogType ? (
        <ConfirmationDialog
          title={dialogType === 'pause' ? 'Pause this mission?' : 'Close this mission?'}
          body={
            dialogType === 'pause'
              ? "Testers won't receive new assignments while paused."
              : "You'll receive a refund for unfilled tester slots. This cannot be undone."
          }
          confirmLabel={dialogType === 'pause' ? 'PAUSE MISSION' : 'CLOSE MISSION'}
          confirmStyle={dialogType === 'pause' ? 'primary' : 'danger'}
          onCancel={() => {
            setDialogType(null)
            setDialogError('')
          }}
          onConfirm={() => void handleConfirm()}
          isLoading={dialogLoading}
          errorMessage={dialogError}
        />
      ) : null}
    </div>
  )
}
