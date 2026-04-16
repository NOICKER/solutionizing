"use client"

import { ClipboardList, HelpCircle, LogOut, Settings } from 'lucide-react'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import posthog from 'posthog-js'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { useAuth } from '@/context/AuthContext'
import { deleteAccount } from '@/lib/api/account'
import { ApiTesterAssignmentSummary, ApiTesterStats } from '@/types/api'
import {
  BrandMark,
  ConfirmationDialog,
  SpinnerIcon,
  formatCoins,
  formatRupeesFromCoins,
  primaryButtonClass,
} from '@/components/solutionizing/ui'
import { SupportPage } from '@/components/solutionizing/shared/SupportPage'
import { ThemeToggleButton } from '@/components/solutionizing/shared/ThemeToggleButton'
import { minimumWithdrawalCoins } from '@/components/solutionizing/tester/constants'
import { TesterMissionsTab } from '@/components/solutionizing/tester/TesterMissionsTab'
import { TesterSettingsTab } from '@/components/solutionizing/tester/TesterSettingsTab'

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
  const canUseAllAmount = balance >= minimumWithdrawalCoins
  const safeAllAmount = balance
  const middleAmount = Math.max(minimumWithdrawalCoins, balance - 1000)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-[2.5rem] border border-border-subtle bg-surface p-5 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="mb-1 text-2xl sm:text-3xl font-black text-white">Withdraw Coins</h2>
            <p className="text-sm text-text-muted">Convert your coins to rupees</p>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-elevated hover:bg-border-subtle" onClick={onClose}>
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 rounded-3xl border border-emerald-900/60 bg-emerald-950/30 p-5 sm:p-6">
          <div className="mb-2 text-[0.65rem] font-bold tracking-widest text-text-muted uppercase">CURRENT BALANCE</div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white">{formatCoins(balance)}</span>
            <span className="text-sm font-semibold text-text-muted uppercase">coins</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-400">≈ {formatRupeesFromCoins(balance)}</div>
        </div>

        <div className="mb-6">
          <label className="mb-3 block text-[0.65rem] font-bold tracking-widest text-white uppercase text-center sm:text-left">HOW MANY COINS TO WITHDRAW?</label>
          <div className="relative">
            <input
              type="number"
              min={minimumWithdrawalCoins}
              max={balance}
              value={amount}
              onChange={(event) => onAmountChange(Number(event.target.value))}
              className="w-full rounded-2xl border-2 border-border-subtle bg-surface-elevated px-4 py-4 text-xl sm:text-2xl font-black text-white placeholder:text-text-muted transition-all focus:border-primary focus:outline-none"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted uppercase tracking-tighter">coins</div>
          </div>
          <div className="mt-2 flex items-center justify-between px-2">
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">Min: 5,000</span>
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">Max: {formatCoins(balance)}</span>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-sky-900/60 bg-sky-950/30 p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">You will receive</span>
            <span className="text-2xl sm:text-3xl font-black text-white">₹{(amount / 100).toFixed(0)}</span>
          </div>
          <div className="border-t border-sky-900/40 pt-3 text-[0.65rem] font-semibold text-text-muted uppercase text-center">Conversion rate: 100 coins = ₹1</div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
          <button className="rounded-2xl bg-surface-elevated py-3 text-sm font-bold text-text-main transition-colors hover:bg-border-subtle" onClick={() => onQuickPick(minimumWithdrawalCoins)}>
            5,000
          </button>
          <button className="rounded-2xl bg-surface-elevated py-3 text-sm font-bold text-text-main transition-colors hover:bg-border-subtle" onClick={() => onQuickPick(middleAmount)}>
            {formatCoins(middleAmount)}
          </button>
          <button
            className="rounded-2xl bg-surface-elevated py-3 text-sm font-bold text-text-main transition-colors hover:bg-border-subtle disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => onQuickPick(safeAllAmount)}
            disabled={!canUseAllAmount}
            title={!canUseAllAmount ? 'Minimum withdrawal is 5,000 coins' : undefined}
          >
            All
          </button>
        </div>
        {!canUseAllAmount ? (
          <p className="mb-6 text-center text-[0.65rem] font-black uppercase tracking-widest text-amber-500">Minimum withdrawal is 5,000 coins.</p>
        ) : null}

        <div className="mb-6 rounded-2xl border border-amber-900/50 bg-amber-950/30 p-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-xs font-semibold text-amber-300">
              Withdrawals are processed within 3-5 business days. You&apos;ll receive a confirmation email once complete.
            </div>
          </div>
        </div>

        {errorMessage ? <p className="mb-4 text-center text-xs font-bold text-red-400">{errorMessage}</p> : null}

        <button
          className={`flex w-full items-center justify-center gap-2 py-4 text-base font-black tracking-widest ${primaryButtonClass}`}
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
  glyph: ReactNode
  active: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={`${className} flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-bold transition-all ${active ? 'bg-primary text-white shadow-[0_4px_12px_rgba(249,124,90,0.35)]' : 'text-text-muted hover:bg-surface-elevated hover:text-text-main'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled ? 'true' : undefined}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-white/20' : 'bg-surface-elevated'}`}>
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
  const [activeTab, setActiveTab] = useState<'missions' | 'settings' | 'support'>('missions')
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
        apiFetch<ApiTesterAssignmentSummary[]>(
          '/api/v1/tester/assignments?status=ASSIGNED&status=IN_PROGRESS&page=1&limit=10'
        ),
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
      posthog.capture('withdrawal_requested', {
        amount: withdrawAmount,
      })
      toast.success(`Withdrawal requested! ₹${(withdrawAmount / 100).toFixed(0)} will be processed in 3-5 days.`)
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

  const topBarTitle =
    activeTab === 'support'
      ? 'Support'
      : activeTab === 'settings'
        ? 'Settings'
        : 'Dashboard'

  const topBarDescription =
    activeTab === 'support'
      ? 'Find answers, check system status, and contact the team.'
      : activeTab === 'settings'
        ? 'Manage your profile, alerts, and device preferences.'
        : 'Track active missions, withdrawals, and your current status.'

  const testerNavItems = [
    { id: 'missions', label: 'Missions', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ] as const

  return (
    <div className="min-h-screen bg-background px-4 py-4 sm:px-6 lg:px-8 text-text-main font-sans">
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:flex lg:min-h-[calc(100vh-2rem)] lg:flex-col lg:rounded-panel lg:border lg:border-border-subtle lg:bg-surface lg:p-5">
          <div className="mb-10 flex items-center gap-4 rounded-[1.75rem] bg-surface-elevated px-4 py-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F97C5A] to-[#E45D43] shadow-[0_18px_35px_-18px_rgba(249,124,90,0.4)]">
              <BrandMark className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-text-muted">Solutionizing</div>
              <div className="mt-1 text-base font-black text-white">Precision Core</div>
            </div>
          </div>

          <nav className="space-y-2">
            {testerNavItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                    activeTab === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted hover:bg-surface-elevated hover:text-text-main'
                  }`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    activeTab === item.id ? 'bg-primary/20 text-primary' : 'bg-surface-elevated text-text-muted'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto space-y-2">
            <div className="border-t border-border-subtle pt-4" />
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-500/10"
              onClick={() => void signOut()}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10">
                <LogOut className="h-4 w-4" />
              </div>
              Sign Out
            </button>
          </div>
        </aside>

        <main className="min-w-0 pb-28 lg:pb-0">
          <div className="relative overflow-hidden rounded-panel border border-border-subtle bg-surface p-5 sm:p-6 lg:p-8">
            <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-elevated px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-text-muted">
                    <BrandMark className="h-3.5 w-3.5 text-primary" />
                    Tester Workspace
                  </div>
                  <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                    {topBarTitle}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">{topBarDescription}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
                  <ThemeToggleButton />
                </div>
              </div>

              {activeTab === 'missions' ? (
                <TesterMissionsTab
                  user={user}
                  stats={stats}
                  assignments={assignments}
                  isLoading={isLoading}
                  loadError={loadError}
                  now={now}
                  balance={balance}
                  onRetry={() => void loadDashboard()}
                  onOpenWithdrawal={() => setWithdrawalOpen(true)}
                  onAbandon={(assignment) => setAbandonTarget(assignment)}
                />
              ) : activeTab === 'support' ? (
                <SupportPage role="TESTER" />
              ) : (
                <TesterSettingsTab
                  displayName={user?.testerProfile?.displayName || 'N/A'}
                  email={user?.email || 'N/A'}
                  onOpenDeleteModal={() => setDeleteModalOpen(true)}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      <nav className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center justify-between rounded-panel border border-border-subtle bg-surface-elevated px-2 py-2 lg:hidden">
        {testerNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-2 rounded-card px-2 py-2 transition ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-muted hover:bg-surface hover:text-text-main'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'bg-surface text-text-muted'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em]">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

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

      {deleteModalOpen ? (
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
      ) : null}
    </div>
  )
}

export function TesterDashboardPage() {
  return <TesterDashboardContent />
}
