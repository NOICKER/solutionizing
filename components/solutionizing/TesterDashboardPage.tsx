"use client"

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { differenceInHours } from 'date-fns'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { RequireAuth } from '@/components/RequireAuth'
import { useAuth } from '@/context/AuthContext'
import { deleteAccount } from '@/lib/api/account'
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

function TabButton({
  label,
  glyph,
  active,
  disabled,
  onClick,
  className = '',
}: {
  label: string
  glyph: React.ReactNode
  active: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={`${className} flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all font-bold ${active ? 'bg-[#d77a57] text-white shadow-md' : 'text-[#6b687a] hover:bg-[#f3f3f5] hover:text-[#1a1625]'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled ? 'true' : undefined}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-white/20' : 'bg-[#f3f3f5]'}`}>
        {glyph}
      </div>
      {label}
    </button>
  )
}

function TesterDashboardContent() {
  const { user, refetch, signOut } = useAuth()
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
  const [activeTab, setActiveTab] = useState<'missions' | 'settings'>('missions')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

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

  async function handleAccountDelete() {
    setDeleteError('')
    setIsDeleting(true)

    try {
      await deleteAccount()
      toast.success('Your account has been deleted.')
      await signOut()
    } catch (error) {
      setDeleteError(
        isApiClientError(error) && error.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : 'Failed to delete account. Please try again later.'
      )
    } finally {
      setIsDeleting(false)
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

  const settingsContent = useMemo(() => {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <section className="rounded-3xl border border-[#e5e4e0] bg-white p-8">
          <h3 className="mb-2 text-xl font-black text-[#1a1625]">Personal Information</h3>
          <p className="mb-6 text-[#6b687a]">General details about your tester profile.</p>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#9b98a8]">DISPLAY NAME</label>
              <div className="text-lg font-bold text-[#1a1625]">{user?.testerProfile?.displayName || 'N/A'}</div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#9b98a8]">EMAIL ADDRESS</label>
              <div className="text-lg font-bold text-[#1a1625]">{user?.email || 'N/A'}</div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-red-100 bg-red-50 p-8">
          <h3 className="mb-2 text-xl font-black text-red-900">Danger Zone</h3>
          <p className="mb-6 text-red-700">Irreversible actions for your account.</p>

          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-bold text-[#1a1625]">Delete Account</h4>
                <p className="text-sm text-red-700/80">Permanently remove your account and all data.</p>
              </div>
              <button
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 px-6 font-bold text-white transition-all hover:bg-red-700 active:scale-95 shadow-sm"
                onClick={() => setDeleteModalOpen(true)}
              >
                DELETE ACCOUNT
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }, [user])

  return (
    <div className="min-h-screen bg-[#faf9f7] rounded-3xl p-8 flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <aside className="lg:w-64 flex-shrink-0">
        <div className="sticky top-8 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d77a57] to-[#c4673f]">
              <BrandMark className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#9b98a8] uppercase tracking-wider">Solutionizing</div>
              <div className="font-black text-[#1a1625]">TESTER</div>
            </div>
          </div>

          <nav className="space-y-2">
            <TabButton
              label="Missions"
              active={activeTab === 'missions'}
              onClick={() => setActiveTab('missions')}
              glyph={<span className="material-symbols-outlined !text-xl">task</span>}
            />
            <TabButton
              label="Settings"
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              glyph={<span className="material-symbols-outlined !text-xl">settings</span>}
            />
            <div className="pt-4 border-t border-[#e5e4e0]" />
            <TabButton
              label="Sign Out"
              active={false}
              onClick={() => signOut()}
              glyph={<span className="material-symbols-outlined !text-xl text-red-500">logout</span>}
              className="text-red-500 hover:bg-red-50"
            />
          </nav>
        </div>
      </aside>

      <main className="flex-1">
        {activeTab === 'missions' ? (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-black text-[#1a1625]">Dashboard</h1>
                <p className="text-[#6b687a]">Welcome back! Here&apos;s your mission overview.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#e5e4e0] bg-white px-4 py-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-[#1a1625]">Ready for Missions</span>
              </div>
            </div>

            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
                    <span className="material-symbols-outlined !text-xl">payments</span>
                  </div>
                  <div className="text-xs font-semibold text-[#9b98a8]">COIN BALANCE</div>
                </div>
                <div className="mb-1 text-3xl font-black text-[#1a1625]">{isLoading ? <div className="h-8 w-24 animate-pulse rounded bg-[#e5e4e0]" /> : formatCoins(balance)}</div>
                <div className="text-sm text-[#6b687a]">≈ {formatRupeesFromCoins(balance)}</div>
              </div>

              <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <span className="material-symbols-outlined !text-xl">stars</span>
                  </div>
                  <div className="text-xs font-semibold text-[#9b98a8]">REPUTATION</div>
                </div>
                <div className="mb-2 text-3xl font-black text-[#1a1625]">
                  {isLoading ? <div className="h-8 w-24 animate-pulse rounded bg-[#e5e4e0]" /> : user?.testerProfile?.reputationScore ?? stats?.reputationScore ?? 0}
                </div>
                {user?.testerProfile?.reputationTier ? <ReputationTierBadge tier={user.testerProfile.reputationTier} /> : null}
              </div>

              <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <span className="material-symbols-outlined !text-xl">checklist</span>
                  </div>
                  <div className="text-xs font-semibold text-[#9b98a8]">COMPLETED</div>
                </div>
                <div className="mb-1 text-3xl font-black text-[#1a1625]">
                  {isLoading ? <div className="h-8 w-24 animate-pulse rounded bg-[#e5e4e0]" /> : stats?.totalCompleted ?? 0}
                </div>
                <div className="text-sm text-[#6b687a]">missions</div>
              </div>

              <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <span className="material-symbols-outlined !text-xl">trending_up</span>
                  </div>
                  <div className="text-xs font-semibold text-[#9b98a8]">SUCCESS RATE</div>
                </div>
                <div className="mb-1 text-3xl font-black text-[#1a1625]">
                  {isLoading ? <div className="h-8 w-24 animate-pulse rounded bg-[#e5e4e0]" /> : `${stats?.completionRate ?? 0}%`}
                </div>
                <div className="text-sm text-green-600 font-semibold">Consistency</div>
              </div>
            </div>

            <div className="mb-8 rounded-3xl bg-gradient-to-br from-[#d77a57] to-[#c4673f] p-8 text-white shadow-lg overflow-hidden relative">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <h3 className="mb-2 text-2xl font-black">Ready for payout?</h3>
                  <p className="mb-4 text-white/90 text-lg">
                    You&apos;ve earned {formatCoins(balance)} coins (≈ {formatRupeesFromCoins(balance)})
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-3 flex-1 rounded-full bg-white/20">
                      <div
                        className="h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        style={{ width: `${Math.min(100, (balance / minimumWithdrawalCoins) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-black">
                      {Math.floor((balance / minimumWithdrawalCoins) * 100)}%
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-white/75 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Minimum withdrawal: 5,000 coins (₹50)
                  </p>
                </div>

                {balance >= minimumWithdrawalCoins ? (
                  <button className="rounded-2xl bg-white px-10 py-4 font-black text-[#d77a57] transition-all hover:shadow-xl hover:scale-105 active:scale-95" onClick={() => setWithdrawalOpen(true)}>
                    WITHDRAW NOW →
                  </button>
                ) : (
                  <button className="rounded-2xl bg-white/50 px-10 py-4 font-black text-white/70 cursor-not-allowed" disabled>
                    COLLECT MORE COINS
                  </button>
                )}
              </div>
            </div>

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#1a1625]">Current Missions</h2>
              <span className="px-4 py-1 rounded-full bg-[#f3f3f5] text-sm font-bold text-[#6b687a]">{assignments.length} ACTIVE</span>
            </div>

            {assignmentCards}
          </div>
        ) : (
          settingsContent
        )}
      </main>

      {withdrawalOpen && (
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
      )}

      {abandonTarget && (
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
      )}

      {deleteModalOpen && (
        <ConfirmationDialog
          title="Delete your account?"
          body="This action is irreversible. All your coins, missions, and profile data will be permanently deleted."
          confirmLabel="DELETE ACCOUNT"
          confirmStyle="danger"
          onCancel={() => {
            setDeleteModalOpen(false)
            setDeleteError('')
          }}
          onConfirm={() => void handleAccountDelete()}
          isLoading={isDeleting}
          errorMessage={deleteError}
        />
      )}
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
