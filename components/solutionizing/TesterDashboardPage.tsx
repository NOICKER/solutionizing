"use client"

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,22,37,0.55)] p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-panel bg-white p-8 shadow-2xl">
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

        <div className="mb-6 rounded-card border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
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
              className="w-full rounded-2xl border-2 border-[#e5e4e0] bg-[#f3f3f5] px-4 py-4 text-2xl font-black text-[#1a1625] placeholder:text-[#9b98a8] transition-all focus:border-[#d77a57] focus:outline-none"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#9b98a8]">coins</div>
          </div>
          <div className="mt-2 flex items-center justify-between px-2">
            <span className="text-xs text-[#9b98a8]">Min: 5,000 coins</span>
            <span className="text-xs text-[#9b98a8]">Max: {formatCoins(balance)} coins</span>
          </div>
        </div>

        <div className="mb-6 rounded-card border border-blue-100 bg-blue-50 p-6">
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
          <button
            className="rounded-2xl bg-[#f3f3f5] py-3 font-bold text-[#1a1625] transition-colors hover:bg-[#e5e4e0] disabled:cursor-not-allowed disabled:bg-[#f3f3f5]/70 disabled:text-[#9b98a8]"
            onClick={() => onQuickPick(safeAllAmount)}
            disabled={!canUseAllAmount}
            title={!canUseAllAmount ? 'Minimum withdrawal is 5,000 coins' : undefined}
          >
            All
          </button>
        </div>
        {!canUseAllAmount ? (
          <p className="mb-6 text-sm text-[#9b98a8]">Minimum withdrawal is 5,000 coins.</p>
        ) : null}

        <div className="mb-6 rounded-card border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-amber-900">
              <strong>Processing time:</strong> Withdrawals are processed within 3-5 business days. You&apos;ll receive a confirmation email once complete.
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
  glyph: ReactNode
  active: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={`${className} flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-bold transition-all ${active ? 'bg-[#d77a57] text-white shadow-md' : 'text-[#6b687a] hover:bg-[#f3f3f5] hover:text-[#1a1625] dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled ? 'true' : undefined}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-white/20' : 'bg-[#f3f3f5] dark:bg-gray-700'}`}>
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
        : 'Tester Dashboard'

  const topBarDescription =
    activeTab === 'support'
      ? 'Find answers, check system status, and contact the team.'
      : activeTab === 'settings'
        ? 'Manage your profile, alerts, and device preferences.'
        : 'Track active missions, withdrawals, and your current tester status.'

  return (
    <div className="flex min-h-screen flex-col gap-8 rounded-panel bg-[#faf9f7] p-8 dark:bg-gray-900 lg:flex-row">
      <aside className="flex-shrink-0 lg:w-64">
        <div className="sticky top-8 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d77a57] to-[#c4673f]">
              <BrandMark className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#9b98a8] dark:text-gray-400">Solutionizing</div>
              <div className="font-black text-[#1a1625] dark:text-white">TESTER</div>
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
            <TabButton
              label="Support"
              active={activeTab === 'support'}
              onClick={() => setActiveTab('support')}
              glyph={<span className="material-symbols-outlined !text-xl">help</span>}
            />
            <div className="border-t border-[#e5e4e0] pt-4 dark:border-gray-700" />
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

      <main className="flex-1 space-y-6">
        <div className="flex flex-col gap-4 rounded-[1.9rem] border border-[#ece6df] bg-white/80 p-4 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.26)] dark:border-gray-700 dark:bg-gray-800/90 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#9b98a8] dark:text-gray-400">Tester workspace</div>
            <h1 className="mt-2 text-2xl font-black text-[#1a1625] dark:text-white">{topBarTitle}</h1>
            <p className="mt-2 text-sm text-[#6b687a] dark:text-gray-400">{topBarDescription}</p>
          </div>
          <ThemeToggleButton />
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
      </main>

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
