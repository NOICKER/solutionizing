"use client"

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
      return (
        <div className="py-8 text-center text-text-muted">
          No missions assigned yet. Make sure your profile is complete and check back soon.
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
            <div key={assignment.id} className="rounded-card border border-border-subtle bg-surface p-6 transition-all hover:border-primary/30 hover:bg-surface-elevated">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-white">{assignment.mission.title}</h3>
                  <p className="text-sm text-text-muted">{assignment.mission.goal}</p>
                </div>
                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                    assignment.status === 'ASSIGNED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60' : 'bg-amber-950/60 text-amber-400 border border-amber-900/60'
                  }`}
                >
                  {assignment.status.replaceAll('_', ' ')}
                </div>
              </div>

              <div className="mb-4 grid gap-4 md:grid-cols-3">
                <div>
                  <div className="mb-1 text-xs text-text-muted">REWARD</div>
                  <div className="text-lg font-black text-white">
                    {formatCoins(assignment.mission.coinPerTester)} coins
                  </div>
                  <div className="text-xs text-text-muted">
                    (≈ {formatRupeesFromCoins(assignment.mission.coinPerTester)})
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-text-muted">DURATION</div>
                  <div className="text-lg font-black text-white">
                    {assignment.mission.estimatedMinutes} minutes
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-text-muted">EXPIRES IN</div>
                  <div
                    className={`text-lg font-black ${
                      preciseHours <= 0.5
                        ? 'text-red-400'
                        : preciseHours <= 2
                          ? 'text-amber-400'
                          : 'text-text-muted'
                    }`}
                  >
                    {preciseHours <= 0.5 ? (
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                        {remainingLabel}
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
  }, [assignments, isLoading, loadError, now, onAbandon, onRetry])

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

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-card border border-border-subtle bg-surface p-6 transition-all hover:border-primary/30 hover:bg-surface-elevated">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/60 text-emerald-400">
              <span className="material-symbols-outlined !text-xl">payments</span>
            </div>
            <div className="text-xs font-semibold text-text-muted">COIN BALANCE</div>
          </div>
          <div className="mb-1 text-3xl font-black text-white">
            {isLoading ? <div className="h-8 w-24 animate-pulse rounded bg-surface-elevated" /> : formatCoins(balance)}
          </div>
          <div className="text-sm text-text-muted">≈ {formatRupeesFromCoins(balance)}</div>
        </div>

        <div className="rounded-card border border-border-subtle bg-surface p-6 transition-all hover:border-primary/30 hover:bg-surface-elevated">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-950/60 text-purple-400">
              <span className="material-symbols-outlined !text-xl">stars</span>
            </div>
            <div className="text-xs font-semibold text-text-muted">REPUTATION</div>
          </div>
          <div className="mb-2 text-3xl font-black text-white">
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-surface-elevated" />
            ) : (
              user?.testerProfile?.reputationScore ?? stats?.reputationScore ?? 0
            )}
          </div>
          {user?.testerProfile?.reputationTier ? <ReputationTierBadge tier={user.testerProfile.reputationTier} /> : null}
        </div>

        <div className="rounded-card border border-border-subtle bg-surface p-6 transition-all hover:border-primary/30 hover:bg-surface-elevated">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-950/60 text-sky-400">
              <span className="material-symbols-outlined !text-xl">checklist</span>
            </div>
            <div className="text-xs font-semibold text-text-muted">COMPLETED</div>
          </div>
          <div className="mb-1 text-3xl font-black text-white">
            {isLoading ? <div className="h-8 w-24 animate-pulse rounded bg-surface-elevated" /> : stats?.totalCompleted ?? 0}
          </div>
          <div className="text-sm text-text-muted">missions</div>
        </div>

        <div className="rounded-card border border-border-subtle bg-surface p-6 transition-all hover:border-primary/30 hover:bg-surface-elevated">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950/60 text-amber-400">
              <span className="material-symbols-outlined !text-xl">trending_up</span>
            </div>
            <div className="text-xs font-semibold text-text-muted">SUCCESS RATE</div>
          </div>
          <div className="mb-1 text-3xl font-black text-white">
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-surface-elevated" />
            ) : (
              `${stats?.completionRate ?? 0}%`
            )}
          </div>
          <div className="text-sm font-semibold text-emerald-400">Consistency</div>
        </div>
      </div>

      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#F97C5A] to-[#E45D43] p-8 text-white shadow-[0_8px_32px_-8px_rgba(249,124,90,0.4)]">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <h3 className="mb-2 text-2xl font-black">Ready for payout?</h3>
            <p className="mb-4 text-lg text-white/90">
              You&apos;ve earned {formatCoins(balance)} coins (≈ {formatRupeesFromCoins(balance)})
            </p>
            <div className="flex items-center gap-4">
              <div className="h-3 flex-1 rounded-full bg-white/20">
                <div
                  className="h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  style={{ width: `${Math.min(100, (balance / minimumWithdrawalCoins) * 100)}%` }}
                />
              </div>
              <span className="text-sm font-black">{Math.floor((balance / minimumWithdrawalCoins) * 100)}%</span>
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-white/75">
              <span className="material-symbols-outlined text-sm">info</span>
              Minimum withdrawal: 5,000 coins (₹50)
            </p>
          </div>

          {balance >= minimumWithdrawalCoins ? (
            <button
              className="rounded-2xl bg-white px-10 py-4 font-black text-[#F97C5A] transition-all hover:scale-105 hover:shadow-xl active:scale-95"
              onClick={onOpenWithdrawal}
            >
              WITHDRAW NOW →
            </button>
          ) : (
            <button className="cursor-not-allowed rounded-2xl bg-white/50 px-10 py-4 font-black text-white/70" disabled>
              COLLECT MORE COINS
            </button>
          )}
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
