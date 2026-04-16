"use client"

import { CheckSquare, Coins, Info, Star, TrendingUp } from 'lucide-react'

import Link from 'next/link'
import { differenceInHours } from 'date-fns'
import { useMemo } from 'react'
import type { User } from '@/context/AuthContext'
import { ApiTesterAssignmentSummary, ApiTesterStats } from '@/types/api'
import {
  ErrorStatePanel,
  ReputationTierBadge,
  formatCoins,
  formatRupeesFromCoins,
  primaryButtonClass,
} from '@/components/solutionizing/ui'
import { minimumWithdrawalCoins } from '@/components/solutionizing/tester/constants'
import { WelcomeBanner } from '@/components/solutionizing/shared/WelcomeBanner'

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

    if (assignments.length === 0) {
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
                You&apos;re eligible and in the queue. Missions are assigned automatically when founders launch — check back soon.
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
        {assignments.map((assignment) => {
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
  }, [assignments, isLoading, loadError, now, onAbandon, onRetry, stats?.activeMissionCount])

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

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-black text-white">Current Missions</h2>
        <span className="rounded-full border border-border-subtle bg-surface-elevated px-4 py-1 text-sm font-bold text-text-muted">
          {assignments.length} ACTIVE
        </span>
      </div>

      {assignmentCards}
    </div>
  )
}
