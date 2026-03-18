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
            <div key={card} className="rounded-3xl border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 h-6 w-1/3 animate-pulse rounded bg-[#e5e4e0] dark:bg-gray-700" />
              <div className="mb-4 h-20 animate-pulse rounded-2xl bg-[#f3f3f5] dark:bg-gray-700" />
              <div className="h-12 animate-pulse rounded-[2rem] bg-[#e5e4e0] dark:bg-gray-700" />
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
        <div className="py-8 text-center text-[#6b687a] dark:text-gray-400">
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
            <div key={assignment.id} className="rounded-3xl border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-[#1a1625] dark:text-white">{assignment.mission.title}</h3>
                  <p className="text-sm text-[#6b687a] dark:text-gray-400">{assignment.mission.goal}</p>
                </div>
                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                    assignment.status === 'ASSIGNED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {assignment.status.replaceAll('_', ' ')}
                </div>
              </div>

              <div className="mb-4 grid gap-4 md:grid-cols-3">
                <div>
                  <div className="mb-1 text-xs text-[#9b98a8] dark:text-gray-400">REWARD</div>
                  <div className="text-lg font-black text-[#1a1625] dark:text-white">
                    {formatCoins(assignment.mission.coinPerTester)} coins
                  </div>
                  <div className="text-xs text-[#6b687a] dark:text-gray-400">
                    (≈ {formatRupeesFromCoins(assignment.mission.coinPerTester)})
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-[#9b98a8] dark:text-gray-400">DURATION</div>
                  <div className="text-lg font-black text-[#1a1625] dark:text-white">
                    {assignment.mission.estimatedMinutes} minutes
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-[#9b98a8] dark:text-gray-400">EXPIRES IN</div>
                  <div
                    className={`text-lg font-black ${
                      preciseHours <= 0.5
                        ? 'text-red-600'
                        : preciseHours <= 2
                          ? 'text-amber-600'
                          : 'text-[#6b687a] dark:text-gray-400'
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
                  className="text-sm font-semibold text-[#9b98a8] hover:text-red-600 dark:text-gray-400"
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
          <h1 className="text-3xl font-black text-[#1a1625] dark:text-white">Dashboard</h1>
          <p className="text-[#6b687a] dark:text-gray-400">Welcome back! Here&apos;s your mission overview.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#e5e4e0] bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-semibold text-[#1a1625] dark:text-white">Ready for Missions</span>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <span className="material-symbols-outlined !text-xl">payments</span>
            </div>
            <div className="text-xs font-semibold text-[#9b98a8] dark:text-gray-400">COIN BALANCE</div>
          </div>
          <div className="mb-1 text-3xl font-black text-[#1a1625] dark:text-white">
            {isLoading ? <div className="h-8 w-24 animate-pulse rounded bg-[#e5e4e0] dark:bg-gray-700" /> : formatCoins(balance)}
          </div>
          <div className="text-sm text-[#6b687a] dark:text-gray-400">≈ {formatRupeesFromCoins(balance)}</div>
        </div>

        <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <span className="material-symbols-outlined !text-xl">stars</span>
            </div>
            <div className="text-xs font-semibold text-[#9b98a8] dark:text-gray-400">REPUTATION</div>
          </div>
          <div className="mb-2 text-3xl font-black text-[#1a1625] dark:text-white">
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-[#e5e4e0] dark:bg-gray-700" />
            ) : (
              user?.testerProfile?.reputationScore ?? stats?.reputationScore ?? 0
            )}
          </div>
          {user?.testerProfile?.reputationTier ? <ReputationTierBadge tier={user.testerProfile.reputationTier} /> : null}
        </div>

        <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <span className="material-symbols-outlined !text-xl">checklist</span>
            </div>
            <div className="text-xs font-semibold text-[#9b98a8] dark:text-gray-400">COMPLETED</div>
          </div>
          <div className="mb-1 text-3xl font-black text-[#1a1625] dark:text-white">
            {isLoading ? <div className="h-8 w-24 animate-pulse rounded bg-[#e5e4e0] dark:bg-gray-700" /> : stats?.totalCompleted ?? 0}
          </div>
          <div className="text-sm text-[#6b687a] dark:text-gray-400">missions</div>
        </div>

        <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <span className="material-symbols-outlined !text-xl">trending_up</span>
            </div>
            <div className="text-xs font-semibold text-[#9b98a8] dark:text-gray-400">SUCCESS RATE</div>
          </div>
          <div className="mb-1 text-3xl font-black text-[#1a1625] dark:text-white">
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-[#e5e4e0] dark:bg-gray-700" />
            ) : (
              `${stats?.completionRate ?? 0}%`
            )}
          </div>
          <div className="text-sm font-semibold text-green-600">Consistency</div>
        </div>
      </div>

      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#d77a57] to-[#c4673f] p-8 text-white shadow-lg">
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
              className="rounded-2xl bg-white px-10 py-4 font-black text-[#d77a57] transition-all hover:scale-105 hover:shadow-xl active:scale-95"
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
        <h2 className="text-2xl font-black text-[#1a1625] dark:text-white">Current Missions</h2>
        <span className="rounded-full bg-[#f3f3f5] px-4 py-1 text-sm font-bold text-[#6b687a] dark:bg-gray-700 dark:text-gray-400">
          {assignments.length} ACTIVE
        </span>
      </div>

      {assignmentCards}
    </div>
  )
}
