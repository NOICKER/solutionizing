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
    return <p className="mt-3 font-['Satoshi'] text-[0.8rem] text-[var(--ink-soft)]">No score changes yet.</p>
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-3">
      {events.slice(0, 3).map((event) => {
        const missionName = event.mission?.title ?? 'mission'
        const eventText = `${formatSignedDelta(event.delta)} — ${formatRatingEventReason(event.reason, missionName)} on ${formatEventDate(event.createdAt)}`

        return (
          <p key={event.id} className="font-['Satoshi'] text-[0.75rem] leading-[1.6] text-[var(--ink-soft)]">
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
        className={`cursor-none flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-light)] px-4 py-1.5 font-['Satoshi'] text-[0.8rem] font-semibold text-[var(--ink)] transition-colors ${state === 'loading' ? 'opacity-60' : ''}`}
      >
        {state === 'loading' ? (
          <SpinnerIcon />
        ) : (
          <svg className="h-3.5 w-3.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className={`text-right font-['Satoshi'] text-[0.75rem] font-semibold ${
              state === 'success' ? 'text-green-600' : state === 'rate-limited' ? 'text-amber-500' : 'text-red-600'
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
        <div className="flex flex-col gap-4">
          {[1, 2].map((card) => (
            <div key={card} className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-light)] p-6">
              <div className="mb-4 h-6 w-1/3 animate-pulse rounded-[4px] bg-[var(--border-strong)]" />
              <div className="mb-4 h-20 animate-pulse rounded-[16px] bg-[var(--border-strong)]" />
              <div className="h-12 animate-pulse rounded-[32px] bg-[var(--border-strong)]" />
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
        <div className="rounded-[14px] border border-[rgba(215,122,87,0.2)] bg-[rgba(215,122,87,0.05)] p-8 text-left">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-[12px] bg-[var(--electric-dim)] text-[var(--electric)]">
              <Info className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-[family-name:var(--font-dm-mono)] text-[0.75rem] tracking-[0.12em] text-[var(--electric)]">IN QUEUE</div>
              <p className="font-['Satoshi'] text-base font-semibold text-[var(--ink)]">
                {getNoAvailableMissionsMessage(missedMissionCount)}
              </p>
              {activeMissionLabel ? (
                <p className="font-['Satoshi'] text-[0.9rem] text-[var(--ink-soft)]">{activeMissionLabel}</p>
              ) : null}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-4">
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
            <div key={assignment.id} className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-light)] p-5 transition-colors">
              <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row">
                <div className="flex-1">
                  <h3 className="font-['Satoshi'] text-[1.1rem] font-bold text-[var(--ink)]">{assignment.mission.title}</h3>
                  <p className="mt-1 font-['Satoshi'] text-[0.9rem] leading-[1.6] text-[var(--ink-soft)]">{assignment.mission.goal}</p>
                </div>
                <div
                  className={`inline-flex rounded-full border px-3 py-1 font-[family-name:var(--font-dm-mono)] text-[0.7rem] ${
                    assignment.status === 'ASSIGNED'
                      ? 'border-[rgba(74,197,128,0.25)] bg-[rgba(74,197,128,0.12)] text-[#1e7a47]'
                      : 'border-[rgba(251,191,36,0.25)] bg-[rgba(251,191,36,0.12)] text-[#92400e]'
                  }`}
                >
                  {assignment.status.replaceAll('_', ' ')}
                </div>
              </div>

              <div className="mb-6 grid grid-cols-3 gap-4">
                <div>
                  <div className="mb-1 font-[family-name:var(--font-dm-mono)] text-[0.65rem] tracking-[0.12em] text-[var(--ink-soft)]">REWARD</div>
                  <div className="font-['Satoshi'] text-[1.1rem] font-bold text-[var(--ink)]">
                    {formatCoins(assignment.mission.coinPerTester)}
                  </div>
                  <div className="font-['Satoshi'] text-[0.75rem] text-[var(--ink-soft)]">
                    (₹{(assignment.mission.coinPerTester / 100).toFixed(0)})
                  </div>
                </div>
                <div>
                  <div className="mb-1 font-[family-name:var(--font-dm-mono)] text-[0.65rem] tracking-[0.12em] text-[var(--ink-soft)]">DURATION</div>
                  <div className="font-['Satoshi'] text-[1.1rem] font-bold text-[var(--ink)]">
                    {assignment.mission.estimatedMinutes}m
                  </div>
                </div>
                <div>
                  <div className="mb-1 font-[family-name:var(--font-dm-mono)] text-[0.65rem] tracking-[0.12em] text-[var(--ink-soft)]">EXPIRES IN</div>
                  <div
                    className={`font-['Satoshi'] text-[1.1rem] font-bold ${
                      preciseHours <= 0.5 ? 'text-[#c0392b]' : preciseHours <= 2 ? 'text-[#92400e]' : 'text-[var(--ink)]'
                    }`}
                  >
                    {preciseHours <= 0.5 ? (
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[rgba(192,57,43,0.18)]" />
                        EXPIRING
                      </span>
                    ) : (
                      remainingLabel
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href={`/tester/workspace/${assignment.id}`} className="cursor-none flex-1 rounded-full bg-[var(--electric)] px-3 py-3 text-center font-['Satoshi'] text-[0.95rem] font-bold text-[var(--cream)] no-underline">
                  {assignment.status === 'IN_PROGRESS' ? 'CONTINUE →' : 'START MISSION →'}
                </Link>
                <button
                  onClick={() => onAbandon(assignment)}
                  className="cursor-none bg-transparent font-['Satoshi'] text-[0.9rem] text-[var(--ink-soft)] underline"
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
    <div className="mx-auto max-w-6xl animate-[tabEnter_0.22s_ease_forwards]">
      <WelcomeBanner />

      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-[2rem] italic font-normal text-[var(--ink)]">Dashboard</h1>
          <p className="font-['Satoshi'] text-base text-[var(--ink-soft)]">Welcome back! Here&apos;s your mission overview.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-light)] px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-[rgba(74,197,128,0.12)]" />
          <span className="font-['Satoshi'] text-[0.85rem] font-semibold text-[var(--ink)]">Ready for Missions</span>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-light)] p-5 transition-colors">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[rgba(74,197,128,0.12)] text-[#1e7a47]">
              <Coins className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="font-[family-name:var(--font-dm-mono)] text-[0.65rem] tracking-[0.12em] text-[var(--ink-soft)]">BALANCE</div>
          </div>
          <div className="mb-1 font-['Satoshi'] text-[1.8rem] font-bold text-[var(--ink)]">
            {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-[var(--cream)]" /> : formatCoins(balance)}
          </div>
          <div className="font-['Satoshi'] text-[0.8rem] text-[var(--ink-soft)]">≈ {formatRupeesFromCoins(balance)}</div>
        </div>

        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-light)] p-5 transition-colors">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[rgba(139,92,246,0.1)] text-[#5b21b6]">
              <Star className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="font-[family-name:var(--font-dm-mono)] text-[0.65rem] tracking-[0.12em] text-[var(--ink-soft)]">SCORE</div>
          </div>
          <div className="mb-2 font-['Satoshi'] text-2xl font-bold text-[var(--ink)] sm:text-3xl">
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-[var(--cream)]" />
            ) : (
              user?.testerProfile?.reputationScore ?? stats?.reputationScore ?? 0
            )}
          </div>
          {user?.testerProfile?.reputationTier ? <ReputationTierBadge tier={user.testerProfile.reputationTier} /> : null}
          {!isLoading ? <RatingEventList events={ratingEvents} /> : null}
        </div>

        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-light)] p-5 transition-colors">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[rgba(56,189,248,0.12)] text-[#0369a1]">
              <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="font-[family-name:var(--font-dm-mono)] text-[0.65rem] tracking-[0.12em] text-[var(--ink-soft)]">DONE</div>
          </div>
          <div className="mb-1 font-['Satoshi'] text-[1.8rem] font-bold text-[var(--ink)]">
            {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-[var(--cream)]" /> : stats?.totalCompleted ?? 0}
          </div>
          <div className="font-['Satoshi'] text-[0.8rem] text-[var(--ink-soft)]">missions</div>
        </div>

        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-light)] p-5 transition-colors">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[rgba(251,191,36,0.12)] text-[#92400e]">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="font-[family-name:var(--font-dm-mono)] text-[0.65rem] tracking-[0.12em] text-[var(--ink-soft)]">RATE</div>
          </div>
          <div className="mb-1 font-['Satoshi'] text-[1.8rem] font-bold text-[var(--ink)]">
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-[var(--cream)]" />
            ) : (
              `${stats?.completionRate ?? 0}%`
            )}
          </div>
          <div className="font-['Satoshi'] text-[0.8rem] font-bold text-[#1e7a47]">Consistency</div>
          {!isLoading ? <RatingEventList events={ratingEvents} /> : null}
        </div>
      </div>

      <div className="relative mb-8 overflow-hidden rounded-[24px] bg-[var(--electric)] p-8 text-[var(--cream)]">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h3 className="mb-2 font-[family-name:var(--font-fraunces)] text-[1.6rem] italic font-normal text-[var(--cream)]">Ready for payout?</h3>
            <p className="mb-4 font-['Satoshi'] text-[1.1rem] font-semibold text-[rgba(250,247,242,0.9)]">
              You&apos;ve earned <span className="underline decoration-[rgba(250,247,242,0.4)] underline-offset-4">{formatCoins(balance)}</span> coins (≈ ₹{(balance / 100).toFixed(0)})
            </p>
            <div className="flex items-center gap-4">
              <div className="h-3 flex-1 rounded-full bg-[rgba(250,247,242,0.2)]">
                <div
                  className="h-3 rounded-full bg-[var(--cream)] transition-[width] duration-1000 ease-in-out"
                  style={{ width: `${Math.min(100, (balance / minimumWithdrawalCoins) * 100)}%` }}
                />
              </div>
              <span className="font-[family-name:var(--font-dm-mono)] text-[0.75rem] tracking-[0.12em]">{Math.floor((balance / minimumWithdrawalCoins) * 100)}%</span>
            </div>
            <p className="mt-4 flex items-center gap-2 font-[family-name:var(--font-dm-mono)] text-[0.65rem] tracking-[0.12em] text-[rgba(250,247,242,0.8)]">
              <Info className="h-3.5 w-3.5" />
              Minimum withdrawal: 5,000 coins
            </p>
          </div>

          <div>
            {balance >= minimumWithdrawalCoins ? (
              <button
                onClick={onOpenWithdrawal}
                className="cursor-none rounded-full bg-[var(--cream)] px-10 py-4 font-['Satoshi'] text-[0.95rem] font-bold text-[var(--electric)]"
              >
                WITHDRAW NOW →
              </button>
            ) : (
              <button disabled className="cursor-none rounded-full bg-[rgba(250,247,242,0.3)] px-10 py-4 font-['Satoshi'] text-[0.95rem] font-bold text-[rgba(250,247,242,0.8)]">
                COLLECT MORE COINS
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-[12px] border border-[rgba(251,191,36,0.25)] bg-[rgba(251,191,36,0.12)] p-4 font-['Satoshi'] text-[0.9rem] text-[var(--ink)]">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#92400e]" />
          <p>
            Missions expire if not completed within the {"founder's"} set deadline. Missing a deadline reduces your score and consistency rating. Lower ratings mean fewer mission assignments.
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-fraunces)] text-[1.6rem] italic font-normal text-[var(--ink)]">Current Missions</h2>
        <div className="flex items-center gap-4">
          <CheckMissionsButton missedMissionCount={missedMissionCount} onRefresh={onRetry} />
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-light)] px-3 py-1 font-[family-name:var(--font-dm-mono)] text-[0.7rem] text-[var(--ink-soft)]">
            {currentAssignments.length} ACTIVE
          </span>
        </div>
      </div>

      {assignmentCards}

      {missedAssignments.length > 0 ? (
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="font-[family-name:var(--font-fraunces)] text-[1.6rem] italic font-normal text-[var(--ink)]">Missed Missions</h2>
            <p className="mt-1 font-['Satoshi'] text-[0.9rem] text-[var(--ink-soft)]">Expired assignments stay here so you can track what affected your score.</p>
          </div>
          <div className="flex flex-col gap-4">
            {missedAssignments.map((assignment) => {
              const expiredAt = assignment.timedOutAt ?? assignment.timeoutAt

              return (
                <div key={assignment.id} className="rounded-[12px] border border-dashed border-[var(--border)] bg-transparent p-5 opacity-70">
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                    <div>
                      <h3 className="font-['Satoshi'] text-[1.1rem] font-semibold text-[var(--ink)]">{assignment.mission.title}</h3>
                      <p className="mt-1 font-['Satoshi'] text-[0.85rem] text-[var(--ink-soft)]">Expired {formatEventDate(expiredAt)}</p>
                    </div>
                    <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-light)] px-3 py-1 font-[family-name:var(--font-dm-mono)] text-[0.7rem] text-[var(--ink-soft)]">
                      TIMED OUT
                    </span>
                  </div>
                  <p className="mt-4 font-['Satoshi'] text-[0.9rem] text-[var(--ink-soft)]">
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
