"use client"

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { differenceInHours } from 'date-fns'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { RequireAuth } from '@/components/RequireAuth'
import { useAuth } from '@/context/AuthContext'
import { ApiTesterAssignmentSummary, ApiTesterStats } from '@/types/api'
import {
  BrandMark,
  ConfirmationDialog,
  ErrorStatePanel,
  ReputationTierBadge,
  SpinnerIcon,
  formatCoins,
  formatRupeesFromCoins,
  primaryButtonClass,
} from '@/components/solutionizing/ui'

const minimumWithdrawalCoins = 5000

function WithdrawalModal({
  balance,
  amount,
  onAmountChange,
  isSubmitting,
  errorMessage,
  onQuickPick,
  onClose,
  onSubmit,
}: {
  balance: number
  amount: number
  onAmountChange: (value: number) => void
  isSubmitting: boolean
  errorMessage: string
  onQuickPick: (value: number) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const safeAllAmount = Math.max(minimumWithdrawalCoins, balance)
  const middleAmount = Math.max(minimumWithdrawalCoins, balance - 1000)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,22,37,0.55)] p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="mb-1 text-3xl font-black text-[#1a1625]">Withdraw Coins</h2>
            <p className="text-[#6b687a]">Convert your coins to rupees</p>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f3f5] hover:bg-[#e5e4e0]" onClick={onClose}>
            <svg className="w-5 h-5 text-[#6b687a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 rounded-3xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
          <div className="mb-2 text-sm text-[#6b687a]">CURRENT BALANCE</div>
          <div className="mb-2 flex items-baseline gap-3">
            <span className="text-4xl font-black text-[#1a1625]">{formatCoins(balance)}</span>
            <span className="text-xl text-[#6b687a]">coins</span>
          </div>
          <div className="text-lg font-semibold text-green-600">≈ {formatRupeesFromCoins(balance)}</div>
        </div>

        <div className="mb-6">
          <label className="mb-3 block text-sm font-semibold text-[#1a1625]">HOW MANY COINS TO WITHDRAW?</label>
          <div className="relative">
            <input
              type="number"
              min={minimumWithdrawalCoins}
              max={balance}
              value={amount}
              onChange={(event) => onAmountChange(Number(event.target.value))}
              className="w-full rounded-2xl border-2 border-[#e5e4e0] bg-[#f3f3f5] px-4 py-4 text-2xl font-black text-[#1a1625] placeholder:text-[#9b98a8] focus:border-[#d77a57] focus:outline-none transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#9b98a8]">coins</div>
          </div>
          <div className="mt-2 flex items-center justify-between px-2">
            <span className="text-xs text-[#9b98a8]">Min: 5,000 coins</span>
            <span className="text-xs text-[#9b98a8]">Max: {formatCoins(balance)} coins</span>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-[#6b687a]">You will receive</span>
            <span className="text-3xl font-black text-[#1a1625]">₹{(amount / 100).toFixed(0)}</span>
          </div>
          <div className="border-t border-blue-200 pt-3 text-xs text-[#6b687a]">Conversion rate: 100 coins = ₹1</div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <button className="rounded-2xl bg-[#f3f3f5] py-3 font-bold text-[#1a1625] transition-colors hover:bg-[#e5e4e0]" onClick={() => onQuickPick(minimumWithdrawalCoins)}>
            5,000
          </button>
          <button className="rounded-2xl bg-[#f3f3f5] py-3 font-bold text-[#1a1625] transition-colors hover:bg-[#e5e4e0]" onClick={() => onQuickPick(middleAmount)}>
            {formatCoins(middleAmount)}
          </button>
          <button className="rounded-2xl bg-[#f3f3f5] py-3 font-bold text-[#1a1625] transition-colors hover:bg-[#e5e4e0]" onClick={() => onQuickPick(safeAllAmount)}>
            All
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 w-5 h-5 flex-shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-amber-900">
              <strong>Processing time:</strong> Withdrawals are processed within 3–5 business days. You&apos;ll receive a confirmation email once complete.
            </div>
          </div>
        </div>

        {errorMessage ? <p className="mb-4 text-sm text-red-600">{errorMessage}</p> : null}

        <button
          className={`flex w-full items-center justify-center gap-2 py-4 text-lg ${primaryButtonClass}`}
          disabled={isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? <SpinnerIcon className="w-5 h-5" /> : null}
          REQUEST WITHDRAWAL →
        </button>
      </div>
    </div>
  )
}

function TesterDashboardContent() {
  const { user, refetch } = useAuth()
  const [stats, setStats] = useState<ApiTesterStats | null>(null)
  const [assignments, setAssignments] = useState<ApiTesterAssignmentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [now, setNow] = useState(() => new Date())
  const [withdrawalOpen, setWithdrawalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState(minimumWithdrawalCoins)
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)
  const [withdrawalError, setWithdrawalError] = useState('')
  const [abandonTarget, setAbandonTarget] = useState<ApiTesterAssignmentSummary | null>(null)
  const [abandonLoading, setAbandonLoading] = useState(false)
  const [abandonError, setAbandonError] = useState('')

  const balance = user?.testerProfile?.coinBalance ?? 0

  const loadDashboard = useCallback(async () => {
    setLoadError('')
    setIsLoading(true)

    try {
      const [statsResponse, assignmentsResponse] = await Promise.all([
        apiFetch<ApiTesterStats>('/api/v1/tester/stats'),
        apiFetch<ApiTesterAssignmentSummary[]>('/api/v1/tester/assignments?status=ASSIGNED&page=1&limit=10'),
      ])

      setStats(statsResponse)
      setAssignments(assignmentsResponse)
    } catch (error) {
      setLoadError(
        isApiClientError(error) && error.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : "Couldn't load your missions"
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (withdrawalOpen) {
      setWithdrawAmount(Math.min(Math.max(minimumWithdrawalCoins, balance), balance))
      setWithdrawalError('')
    }
  }, [balance, withdrawalOpen])

  async function handleWithdraw() {
    setWithdrawalError('')
    setWithdrawalLoading(true)

    try {
      await apiFetch('/api/v1/coins/withdraw', {
        method: 'POST',
        body: { amount: withdrawAmount },
      })
      setWithdrawalOpen(false)
      toast.success(`Withdrawal requested! ₹${(withdrawAmount / 100).toFixed(0)} will be processed in 3–5 days.`)
      await refetch()
    } catch (error) {
      if (isApiClientError(error)) {
        if (error.code === 'BELOW_MIN_WITHDRAWAL') {
          setWithdrawalError('Minimum withdrawal is 5,000 coins (₹50)')
        } else if (error.code === 'INSUFFICIENT_COINS') {
          setWithdrawalError("You don't have enough coins")
        } else if (error.code === 'NETWORK_ERROR') {
          setWithdrawalError('Check your internet connection')
        } else {
          setWithdrawalError('Something went wrong. Try again.')
        }
      } else {
        setWithdrawalError('Something went wrong. Try again.')
      }
    } finally {
      setWithdrawalLoading(false)
    }
  }

  async function handleAbandon() {
    if (!abandonTarget) {
      return
    }

    setAbandonLoading(true)
    setAbandonError('')

    try {
      await apiFetch(`/api/v1/tester/assignments/${abandonTarget.id}/abandon`, {
        method: 'POST',
      })
      await loadDashboard()
      setAbandonTarget(null)
      toast.info('Mission abandoned.')
    } catch (error) {
      const message =
        isApiClientError(error) && error.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : 'Something went wrong. Try again.'
      setAbandonError(message)
      toast.error(message)
    } finally {
      setAbandonLoading(false)
    }
  }

  const assignmentCards = useMemo(() => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2].map((card) => (
            <div key={card} className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
              <div className="mb-4 h-6 w-1/3 animate-pulse rounded bg-[#e5e4e0]" />
              <div className="mb-4 h-20 animate-pulse rounded-2xl bg-[#f3f3f5]" />
              <div className="h-12 animate-pulse rounded-[2rem] bg-[#e5e4e0]" />
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
          onRetry={() => void loadDashboard()}
          backHref="/dashboard/tester"
        />
      )
    }

    if (assignments.length === 0) {
      return (
        <div className="py-8 text-center text-[#6b687a]">
          No missions assigned yet. Make sure your profile is complete and check back soon.
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {assignments.map((assignment) => {
          const remainingHours = differenceInHours(new Date(assignment.timeoutAt), now, { roundingMethod: 'floor' })
          const preciseHours = (new Date(assignment.timeoutAt).getTime() - now.getTime()) / 3600000
          const remainingLabel =
            preciseHours <= 0.5
              ? 'Expiring soon!'
              : preciseHours <= 2
                ? `${Math.max(1, Math.floor(preciseHours))}h`
                : `${Math.max(1, remainingHours)} hours`

          return (
            <div key={assignment.id} className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-[#1a1625]">{assignment.mission.title}</h3>
                  <p className="text-sm text-[#6b687a]">{assignment.mission.goal}</p>
                </div>
                <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${assignment.status === 'ASSIGNED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {assignment.status.replaceAll('_', ' ')}
                </div>
              </div>

              <div className="mb-4 grid gap-4 md:grid-cols-3">
                <div>
                  <div className="mb-1 text-xs text-[#9b98a8]">REWARD</div>
                  <div className="text-lg font-black text-[#1a1625]">{formatCoins(assignment.mission.coinPerTester)} coins</div>
                  <div className="text-xs text-[#6b687a]">(≈ {formatRupeesFromCoins(assignment.mission.coinPerTester)})</div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-[#9b98a8]">DURATION</div>
                  <div className="text-lg font-black text-[#1a1625]">{assignment.mission.estimatedMinutes} minutes</div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-[#9b98a8]">EXPIRES IN</div>
                  <div className={`text-lg font-black ${preciseHours <= 0.5 ? 'text-red-600' : preciseHours <= 2 ? 'text-amber-600' : 'text-[#6b687a]'}`}>
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
                <button className="text-sm font-semibold text-[#9b98a8] hover:text-red-600" onClick={() => setAbandonTarget(assignment)}>
                  Abandon
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }, [assignments, isLoading, loadDashboard, loadError, now])

  return (
    <div className="min-h-screen bg-[#faf9f7] rounded-2xl p-8">
      <div className="mx-auto max-w-6xl">
        {user?.testerProfile && user.testerProfile.isVerified === false && (
          <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-amber-900">Action Required</h3>
                <p className="text-sm font-medium text-amber-800">Complete your profile to start receiving missions.</p>
              </div>
            </div>
            <Link
              href="/tester/verify"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-amber-700"
            >
              VERIFY NOW →
            </Link>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d77a57] to-[#c4673f]">
              <BrandMark className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="mb-1 text-xs text-[#9b98a8]">SOLUTIONIZING</div>
              <h1 className="text-2xl font-black text-[#1a1625]">Tester Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-[#e5e4e0] bg-white px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-[#1a1625]">Ready for Missions</span>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-[#9b98a8]">COIN BALANCE</div>
            </div>
            <div className="mb-1 text-3xl font-black text-[#1a1625]">{isLoading ? <div className="h-8 w-24 animate-pulse rounded bg-[#e5e4e0]" /> : formatCoins(balance)}</div>
            <div className="text-sm text-[#6b687a]">≈ {formatRupeesFromCoins(balance)}</div>
          </div>

          <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-[#9b98a8]">REPUTATION</div>
            </div>
            <div className="mb-2 text-3xl font-black text-[#1a1625]">
              {isLoading ? <div className="h-8 w-24 animate-pulse rounded bg-[#e5e4e0]" /> : user?.testerProfile?.reputationScore ?? stats?.reputationScore ?? 0}
            </div>
            {user?.testerProfile?.reputationTier ? <ReputationTierBadge tier={user.testerProfile.reputationTier} /> : null}
          </div>

          <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
            <div className="mb-3 text-xs font-semibold text-[#9b98a8]">COMPLETED MISSIONS</div>
            <div className="mb-1 text-3xl font-black text-[#1a1625]">
              {isLoading ? <div className="h-8 w-24 animate-pulse rounded bg-[#e5e4e0]" /> : stats?.totalCompleted ?? 0}
            </div>
            <div className="text-sm text-[#6b687a]">missions</div>
          </div>

          <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
            <div className="mb-3 text-xs font-semibold text-[#9b98a8]">SUCCESS RATE</div>
            <div className="mb-1 text-3xl font-black text-[#1a1625]">
              {isLoading ? <div className="h-8 w-24 animate-pulse rounded bg-[#e5e4e0]" /> : `${stats?.completionRate ?? 0}%`}
            </div>
            <div className="text-sm text-green-600 font-semibold">Completion consistency</div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl bg-gradient-to-br from-[#d77a57] to-[#c4673f] p-6 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h3 className="mb-2 text-xl font-black">Ready to withdraw?</h3>
              <p className="mb-4 text-white/90">
                You have {formatCoins(balance)} coins (≈ {formatRupeesFromCoins(balance)})
              </p>
              <div className="flex items-center gap-4">
                <div className="h-2 flex-1 rounded-full bg-white/20">
                  <div
                    className="h-2 rounded-full bg-white"
                    style={{ width: `${Math.min(100, (balance / minimumWithdrawalCoins) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold">
                  {formatCoins(balance)} / {formatCoins(minimumWithdrawalCoins)}
                </span>
              </div>
              <p className="mt-2 text-xs text-white/75">Minimum withdrawal: 5,000 coins (₹50)</p>
            </div>

            {balance >= minimumWithdrawalCoins ? (
              <button className="rounded-[2rem] bg-white px-8 py-3 font-black text-[#d77a57] transition-all hover:shadow-lg hover:scale-105" onClick={() => setWithdrawalOpen(true)}>
                WITHDRAW →
              </button>
            ) : (
              <button className="rounded-[2rem] bg-white/70 px-8 py-3 font-black text-[#9b98a8] cursor-not-allowed" disabled title="Complete more missions to reach the minimum">
                WITHDRAW
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#1a1625]">Your Current Missions</h2>
          <span className="text-sm text-[#9b98a8]">{assignments.length} assigned</span>
        </div>

        {assignmentCards}
      </div>

      {withdrawalOpen ? (
        <WithdrawalModal
          balance={balance}
          amount={withdrawAmount}
          onAmountChange={(value) => setWithdrawAmount(Math.min(balance, Math.max(0, value || 0)))}
          isSubmitting={withdrawalLoading}
          errorMessage={withdrawalError}
          onQuickPick={(value) => setWithdrawAmount(Math.min(balance, value))}
          onClose={() => setWithdrawalOpen(false)}
          onSubmit={() => void handleWithdraw()}
        />
      ) : null}

      {abandonTarget ? (
        <ConfirmationDialog
          title="Abandon this mission?"
          body="This will affect your reputation score."
          confirmLabel="ABANDON MISSION"
          confirmStyle="danger"
          onCancel={() => {
            setAbandonTarget(null)
            setAbandonError('')
          }}
          onConfirm={() => void handleAbandon()}
          isLoading={abandonLoading}
          errorMessage={abandonError}
        />
      ) : null}
    </div>
  )
}

export function TesterDashboardPage() {
  return (
    <RequireAuth role="TESTER">
      <TesterDashboardContent />
    </RequireAuth>
  )
}
