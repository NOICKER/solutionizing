"use client"

import { CheckSquare, Coins, Info, Star, TrendingUp } from 'lucide-react'

import Link from 'next/link'
import { differenceInHours, format } from 'date-fns'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import type { User } from '@/context/AuthContext'
import { ApiTesterAssignmentSummary, ApiTesterStats } from '@/types/api'
import {
  ErrorStatePanel,
  ReputationTierBadge,
  SpinnerIcon,
  formatCoins,
  formatRupeesFromCoins,
  primaryButtonClass,
} from '@/components/solutionizing/ui'
import { minimumWithdrawalCoins } from '@/components/solutionizing/tester/constants'
import { WelcomeBanner } from '@/components/solutionizing/shared/WelcomeBanner'

const noAvailableMissionsMessage =
  'No missions available right now. This could be because your current mission is pending, or no new missions match your profile yet. Check back soon.'

function getNoAvailableMissionsMessage(missedMissionCount: number) {
  if (missedMissionCount <= 0) {
    return noAvailableMissionsMessage
  }

  return `${noAvailableMissionsMessage} You have ${missedMissionCount} missed missions affecting your score. See below.`
}

function formatEventDate(value: string | null | undefined) {
  if (!value) {
    return 'date unavailable'
  }

  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    return 'date unavailable'
  }

  return format(new Date(timestamp), 'MMM d, yyyy')
}

function formatSignedDelta(delta: number) {
  return `${delta > 0 ? '+' : ''}${delta}`
}

function formatRatingEventReason(reason: string, missionName: string) {
  if (reason === 'founder rating') {
    return `rating for ${missionName}`
  }

  if (reason === 'low effort flag') {
    return `low effort flag on ${missionName}`
  }

  if (reason === 'short response') {
    return `short response on ${missionName}`
  }

  return `${reason} ${missionName}`
}

function RatingEventList({ events }: { events: ApiTesterStats['ratingEvents'] }) {
  if (events.length === 0) {
    return <p className="mt-3 text-xs font-semibold text-text-muted">No score changes yet.</p>
  }

  return (
    <div className="mt-3 space-y-2 border-t border-border-subtle pt-3">
      {events.slice(0, 3).map((event) => {
        const missionName = event.mission?.title ?? 'mission'
        const eventText = `${formatSignedDelta(event.delta)} — ${formatRatingEventReason(event.reason, missionName)} on ${formatEventDate(event.createdAt)}`

        return (
          <p key={event.id} className="text-xs font-semibold leading-5 text-text-muted">
            {eventText}
          </p>
        )
      })}
    </div>
  )
}

interface TesterMissionsTabProps {
  user: User | null
  stats: ApiTesterStats | null
  assignments: ApiTesterAssignmentSummary[]
  isLoading: boolean
  loadError: string
  now: Date
  balance: number
  onRetry: () => void
  onOpenWithdrawal: () => void
  onAbandon: (assignment: ApiTesterAssignmentSummary) => void
}

function CheckMissionsButton({
  missedMissionCount,
  onRefresh,
}: {
  missedMissionCount: number
  onRefresh: () => void
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'rate-limited' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleClick() {
    setState('loading')
    setMessage('')

    try {
      const data = await apiFetch<{ newAssignments: number; missionsChecked: number }>('/api/v1/tester/find-missions', {
        method: 'POST',
      })

      if (data.newAssignments > 0) {
        setMessage(`${data.newAssignments} new mission${data.newAssignments !== 1 ? 's' : ''} assigned!`)
        toast.success(`${data.newAssignments} new mission${data.newAssignments !== 1 ? 's' : ''} assigned.`)
        onRefresh() // Refresh the dashboard to show new assignments
      } else {
        setMessage(getNoAvailableMissionsMessage(missedMissionCount))
        toast.info('No missions available right now.')
      }

      setState('success')
    } catch (fetchError) {
      if (isApiClientError(fetchError) && fetchError.status === 429) {
        setState('rate-limited')
        setMessage('Please wait 10 minutes between checks.')
      } else {
        setState('error')
        setMessage(
          isApiClientError(fetchError) && fetchError.code === 'NETWORK_ERROR'
            ? 'Check your connection'
            : 'Something went wrong.'
        )
      }
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={state === 'loading'}
        onClick={() => void handleClick()}
        className="group relative inline-flex h-8 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-sky-500/5 px-4 text-xs font-bold tracking-wide text-sky-400 transition-all hover:border-sky-500/50 hover:from-sky-500/20 hover:to-sky-500/10 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:ring-offset-2 focus:ring-offset-surface disabled:pointer-events-none disabled:opacity-60"
      >
        {state === 'loading' ? (
          <SpinnerIcon />
        ) : (
          <svg className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        Check for Missions
      </button>

      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`text-right text-[0.65rem] font-bold ${
              state === 'success'
                ? 'text-emerald-400'
                : state === 'rate-limited'
                  ? 'text-amber-400'
                  : 'text-red-400'
            }`}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}


export function TesterMissionsTab({
  user,
  stats,
  assignments,
  isLoading,
  loadError,
  now,
  balance,
  onRetry,
  onOpenWithdrawal,
  onAbandon,
}: TesterMissionsTabProps) {
  const currentAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status !== 'TIMED_OUT'),
    [assignments]
  )
  const missedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'TIMED_OUT'),
    [assignments]
  )
  const missedMissionCount = stats?.missedMissionCount ?? missedAssignments.length
  const ratingEvents = stats?.ratingEvents ?? []

  const assignmentCards = useMemo(() => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2].map((card) => (
            <div key={card} className="rounded-card border border-border-subtle bg-surface p-6">
              <div className="mb-4 h-6 w-1/3 animate-pulse rounded bg-surface-elevated" />
              <div className="mb-4 h-20 animate-pulse rounded-2xl bg-surface-elevated" />
              <div className="h-12 animate-pulse rounded-[2rem] bg-surface-elevated" />
            </div>
          ))}
        </div>
      )
    }

    if (loadError) {
      return (
        <ErrorStatePanel
          title="Couldn't load your missions"
          body="Something went wrong while loading your data. Please check your connection and try again."
          onRetry={onRetry}
          backHref="/dashboard/tester"
        />
      )
    }

    if (currentAssignments.length === 0) {
      const activeMissionLabel =
        typeof stats?.activeMissionCount === 'number'
          ? `${stats.activeMissionCount} mission${stats.activeMissionCount === 1 ? ' is' : 's are'} currently active on the platform.`
          : null

      return (
        <div className="rounded-card border border-sky-900/50 bg-sky-950/20 p-8 text-left">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-900/50 text-sky-300">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-sky-300">In Queue</div>
              <p className="text-base font-semibold text-white">
                {getNoAvailableMissionsMessage(missedMissionCount)}
              </p>
              {activeMissionLabel ? (
                <p className="text-sm text-sky-100/80">{activeMissionLabel}</p>
              ) : null}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {currentAssignments.map((assignment) => {
          const remainingHours = differenceInHours(new Date(assignment.timeoutAt), now, {
            roundingMethod: 'floor',
          })
          const preciseHours = (new Date(assignment.timeoutAt).getTime() - now.getTime()) / 3600000
          const remainingLabel =
            preciseHours <= 0.5
              ? 'Expiring soon!'
              : preciseHours <= 2
                ? `${Math.max(1, Math.floor(preciseHours))}h`
                : `${Math.max(1, remainingHours)} hours`

          return (
            <div key={assignment.id} className="rounded-card border border-border-subtle bg-surface p-4 sm:p-5 transition-all hover:border-primary/30 hover:bg-surface-elevated">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-white">{assignment.mission.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">{assignment.mission.goal}</p>
                </div>
                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                    assignment.status === 'ASSIGNED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60' : 'bg-amber-950/60 text-amber-400 border border-amber-900/60'
                  }`}
                >
                  {assignment.status.replaceAll('_', ' ')}
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-4">
                <div className="col-span-1">
                  <div className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest text-text-muted">REWARD</div>
                  <div className="text-base sm:text-lg font-black text-white">
                    {formatCoins(assignment.mission.coinPerTester)}
                  </div>
                  <div className="text-[0.65rem] font-semibold text-text-muted uppercase">
                    (₹{(assignment.mission.coinPerTester / 100).toFixed(0)})
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest text-text-muted">DURATION</div>
                  <div className="text-base sm:text-lg font-black text-white">
                    {assignment.mission.estimatedMinutes}m
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest text-text-muted">EXPIRES IN</div>
                  <div
                    className={`text-base sm:text-lg font-black ${
                      preciseHours <= 0.5
                        ? 'text-red-400'
                        : preciseHours <= 2
                          ? 'text-amber-400'
                          : 'text-text-muted'
                    }`}
                  >
                    {preciseHours <= 0.5 ? (
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        EXPIRING
                      </span>
                    ) : (
                      remainingLabel
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href={`/tester/workspace/${assignment.id}`} className={`flex-1 py-3 text-center ${primaryButtonClass}`}>
                  {assignment.status === 'IN_PROGRESS' ? 'CONTINUE →' : 'START MISSION →'}
                </Link>
                <button
                  className="text-sm font-semibold text-text-muted hover:text-red-400 transition-colors"
                  onClick={() => onAbandon(assignment)}
                >
                  Abandon
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }, [currentAssignments, isLoading, loadError, missedMissionCount, now, onAbandon, onRetry, stats?.activeMissionCount])

  return (
    <div className="mx-auto max-w-6xl">
      <WelcomeBanner />

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Dashboard</h1>
          <p className="text-text-muted">Welcome back! Here&apos;s your mission overview.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-white">Ready for Missions</span>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-card border border-border-subtle bg-surface p-4 sm:p-5 transition-all hover:border-primary/30 hover:bg-surface-elevated">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-950/60 text-emerald-400">
              <Coins className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">BALANCE</div>
          </div>
          <div className="mb-1 text-2xl sm:text-3xl font-black text-white">
            {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-surface-elevated" /> : formatCoins(balance)}
          </div>
          <div className="text-[0.7rem] font-semibold text-text-muted uppercase tracking-tighter">≈ {formatRupeesFromCoins(balance)}</div>
        </div>

        <div className="rounded-card border border-border-subtle bg-surface p-4 sm:p-5 transition-all hover:border-primary/30 hover:bg-surface-elevated">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-purple-950/60 text-purple-400">
              <Star className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">SCORE</div>
          </div>
          <div className="mb-2 text-2xl sm:text-3xl font-black text-white">
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-surface-elevated" />
            ) : (
              user?.testerProfile?.reputationScore ?? stats?.reputationScore ?? 0
            )}
          </div>
          {user?.testerProfile?.reputationTier ? <ReputationTierBadge tier={user.testerProfile.reputationTier} /> : null}
          {!isLoading ? <RatingEventList events={ratingEvents} /> : null}
        </div>

        <div className="rounded-card border border-border-subtle bg-surface p-4 sm:p-5 transition-all hover:border-primary/30 hover:bg-surface-elevated">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-sky-950/60 text-sky-400">
              <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">DONE</div>
          </div>
          <div className="mb-1 text-2xl sm:text-3xl font-black text-white">
            {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-surface-elevated" /> : stats?.totalCompleted ?? 0}
          </div>
          <div className="text-[0.7rem] font-bold text-text-muted uppercase tracking-tighter">missions</div>
        </div>

        <div className="rounded-card border border-border-subtle bg-surface p-4 sm:p-5 transition-all hover:border-primary/30 hover:bg-surface-elevated">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-950/60 text-amber-400">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">RATE</div>
          </div>
          <div className="mb-1 text-2xl sm:text-3xl font-black text-white">
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-surface-elevated" />
            ) : (
              `${stats?.completionRate ?? 0}%`
            )}
          </div>
          <div className="text-[0.75rem] font-black uppercase text-emerald-400 tracking-tighter">Consistency</div>
          {!isLoading ? <RatingEventList events={ratingEvents} /> : null}
        </div>
      </div>

      <div className="relative mb-8 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#F97C5A] to-[#E45D43] p-6 sm:p-8 text-white shadow-[0_8px_32px_-8px_rgba(249,124,90,0.4)]">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between text-center lg:text-left">
          <div className="flex-1">
            <h3 className="mb-2 text-2xl font-black tracking-tight">Ready for payout?</h3>
            <p className="mb-4 text-base sm:text-lg font-bold text-white/90">
              You&apos;ve earned <span className="text-white underline decoration-white/30 underline-offset-4">{formatCoins(balance)}</span> coins (≈ ₹{(balance / 100).toFixed(0)})
            </p>
            <div className="flex items-center gap-4 px-2 sm:px-0">
              <div className="h-3 flex-1 rounded-full bg-white/20">
                <div
                  className="h-3 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-1000"
                  style={{ width: `${Math.min(100, (balance / minimumWithdrawalCoins) * 100)}%` }}
                />
              </div>
              <span className="text-[0.65rem] font-black uppercase tracking-widest">{Math.floor((balance / minimumWithdrawalCoins) * 100)}%</span>
            </div>
            <p className="mt-4 flex items-center justify-center lg:justify-start gap-2 text-[0.65rem] font-black uppercase tracking-[0.14em] text-white/70">
              <Info className="h-3.5 w-3.5" />
              Minimum withdrawal: 5,000 coins
            </p>
          </div>

          <div className="flex-shrink-0">
            {balance >= minimumWithdrawalCoins ? (
              <button
                className="w-full sm:w-auto rounded-[1.4rem] bg-white px-10 py-4 font-black text-[#F97C5A] tracking-widest transition-all hover:scale-105 hover:shadow-xl active:scale-95"
                onClick={onOpenWithdrawal}
              >
                WITHDRAW NOW →
              </button>
            ) : (
              <button className="w-full sm:w-auto cursor-not-allowed rounded-[1.4rem] bg-white/30 backdrop-blur-sm px-10 py-4 font-black text-white/70 tracking-widest" disabled>
                COLLECT MORE COINS
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-card border border-amber-900/50 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
          <p>
            Missions expire if not completed within the {"founder's"} set deadline. Missing a deadline reduces your score and consistency rating. Lower ratings mean fewer mission assignments.
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-black text-white">Current Missions</h2>
        <div className="flex items-center gap-4">
          <CheckMissionsButton missedMissionCount={missedMissionCount} onRefresh={onRetry} />
          <span className="rounded-full border border-border-subtle bg-surface-elevated px-4 py-1 text-sm font-bold text-text-muted">
            {currentAssignments.length} ACTIVE
          </span>
        </div>
      </div>

      {assignmentCards}

      {missedAssignments.length > 0 ? (
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-white">Missed Missions</h2>
            <p className="mt-1 text-sm text-text-muted">Expired assignments stay here so you can track what affected your score.</p>
          </div>
          <div className="space-y-4">
            {missedAssignments.map((assignment) => {
              const expiredAt = assignment.timedOutAt ?? assignment.timeoutAt

              return (
                <div
                  key={assignment.id}
                  className="rounded-card border border-gray-700/70 bg-gray-900/50 p-4 opacity-75 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-gray-200">{assignment.mission.title}</h3>
                      <p className="mt-1 text-sm text-gray-400">Expired {formatEventDate(expiredAt)}</p>
                    </div>
                    <span className="inline-flex rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-bold text-gray-400">
                      TIMED OUT
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-gray-300">
                    Your rating dropped due to this missed mission.
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
