"use client"

import { useRouter } from 'next/navigation'
import { ArrowRightLeft, ClipboardList, HelpCircle, Settings } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
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
} from '@/components/solutionizing/ui'
import { SupportPage } from '@/components/solutionizing/shared/SupportPage'
import { minimumWithdrawalCoins } from '@/components/solutionizing/tester/constants'
import { TesterMissionsTab } from '@/components/solutionizing/tester/TesterMissionsTab'
import { TesterSettingsTab } from '@/components/solutionizing/tester/TesterSettingsTab'

interface TesterDashboardPageProps {
  initialData?: {
    stats: ApiTesterStats | null
    assignments: ApiTesterAssignmentSummary[]
  }
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/70 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[480px] rounded-[20px] border border-[var(--border)] bg-[var(--cream)] p-8 max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-[1.6rem] font-normal italic text-[var(--ink)]">request payout.</h2>
            <p className="mt-1 font-[family-name:var(--font-dm-mono)] text-[0.72rem] uppercase tracking-widest text-[var(--ink-soft)]">CONVERT COINS TO RUPEES</p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="mb-6 rounded-[12px] border border-[var(--border)] bg-[var(--bg-light)] p-5">
          <div className="mb-1 font-[family-name:var(--font-dm-mono)] text-[0.68rem] uppercase tracking-[0.1em] text-[var(--electric)]">YOUR BALANCE</div>
          <div className="font-[family-name:var(--font-fraunces)] text-2xl font-bold leading-none text-[var(--ink)]">{formatCoins(balance)} coins</div>
          <div className="mt-1 font-[family-name:var(--font-dm-mono)] text-[0.8rem] text-[var(--ink-soft)]">≈ {formatRupeesFromCoins(balance)}</div>
        </div>

        <div className="mb-6">
          <label className="mb-2 block font-[family-name:var(--font-dm-mono)] text-[0.72rem] uppercase tracking-[0.1em] text-[var(--ink-soft)]">HOW MANY COINS?</label>
          <div className="relative">
            <input
              type="number"
              min={minimumWithdrawalCoins}
              max={balance}
              value={amount}
              onChange={(event) => onAmountChange(Number(event.target.value))}
              className="w-full rounded-[10px] border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-light)] py-3 pl-4 pr-16 font-[family-name:var(--font-fraunces)] text-[1.4rem] font-bold text-[var(--ink)] outline-none cursor-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-[family-name:var(--font-dm-mono)] text-[0.7rem] text-[var(--ink-soft)]">COINS</span>
          </div>
          <div className="mt-2 flex justify-between font-[family-name:var(--font-dm-mono)] text-[0.65rem] text-[var(--ink-soft)]">
            <span>MIN: 5,000</span>
            <span>MAX: {formatCoins(balance)}</span>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between rounded-[10px] border border-[var(--border)] bg-[var(--bg-light)] px-5 py-3">
          <span className="font-[family-name:var(--font-dm-mono)] text-[0.72rem] tracking-[0.08em] text-[var(--ink-soft)]">YOU RECEIVE</span>
          <span className="font-[family-name:var(--font-fraunces)] text-[1.4rem] font-bold text-[var(--ink)]">₹{(amount / 100).toFixed(0)}</span>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2.5">
          {[minimumWithdrawalCoins, middleAmount, safeAllAmount].map((val, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onQuickPick(val)}
              disabled={i === 2 && !canUseAllAmount}
              title={i === 2 && !canUseAllAmount ? 'Minimum withdrawal is 5,000 coins' : undefined}
              className={`cursor-none rounded-lg border border-[var(--border)] bg-[var(--bg-light)] p-2.5 font-[family-name:var(--font-dm-mono)] text-[0.78rem] text-[var(--ink)] transition-colors hover:border-[var(--electric)] ${
                i === 2 && !canUseAllAmount ? 'opacity-50' : 'opacity-100'
              }`}
            >
              {i === 2 ? 'All' : formatCoins(val)}
            </button>
          ))}
        </div>
        {!canUseAllAmount ? (
          <p className="mb-5 text-center font-[family-name:var(--font-dm-mono)] text-[0.72rem] text-[var(--ink-soft)]">Minimum withdrawal is 5,000 coins.</p>
        ) : null}

        <div className="mb-5 flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-light)] px-4 py-3 text-[0.8rem] text-[var(--ink-soft)]">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--electric)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>Withdrawals process within 3-5 business days. You&apos;ll get a confirmation email once complete.</div>
        </div>

        {errorMessage ? <p className="mb-3 text-center font-[family-name:var(--font-dm-mono)] text-[0.75rem] text-[#c0392b]">{errorMessage}</p> : null}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onSubmit}
          className={`cursor-none flex w-full items-center justify-center gap-2 rounded-full bg-[var(--electric)] p-4 font-['Satoshi'] text-[0.95rem] font-bold text-[var(--cream)] transition-all hover:-translate-y-px hover:opacity-90 ${
            isSubmitting ? 'opacity-70' : 'opacity-100'
          }`}
        >
          {isSubmitting ? <SpinnerIcon className="h-4 w-4" /> : null}
          request payout →
        </button>
      </div>
    </div>
  )
}
function TesterDashboardContent({ initialData }: TesterDashboardPageProps) {
  const router = useRouter()
  const { user, refetch, signOut } = useAuth()
  const hasInitialDashboardData = Boolean(initialData)
  const [stats, setStats] = useState<ApiTesterStats | null>(initialData?.stats ?? null)
  const [assignments, setAssignments] = useState<ApiTesterAssignmentSummary[]>(initialData?.assignments ?? [])
  const [isLoading, setIsLoading] = useState(!hasInitialDashboardData)
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
  const [isSwitchingToFounder, setIsSwitchingToFounder] = useState(false)

  const balance = stats?.coinBalance ?? user?.testerProfile?.coinBalance ?? 0

  const loadDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoadError('')
      setIsLoading(true)
    }

    try {
      const [statsResponse, assignmentsResponse] = await Promise.all([
        apiFetch<ApiTesterStats>('/api/v1/tester/stats'),
        apiFetch<ApiTesterAssignmentSummary[]>(
          '/api/v1/tester/assignments?status=ASSIGNED&status=IN_PROGRESS&status=TIMED_OUT&page=1&limit=20'
        ),
      ])

      console.log('Assignments API Response:', assignmentsResponse)

      setStats(statsResponse)
      setAssignments(assignmentsResponse)
    } catch (error) {
      if (!isSilent) {
        setLoadError(
          isApiClientError(error) && error.code === 'NETWORK_ERROR'
            ? 'Check your internet connection'
            : "Couldn't load your missions"
        )
      }
    } finally {
      if (!isSilent) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    // If we don't have initial data, show the loading state. Otherwise, load silently in the background
    void loadDashboard(hasInitialDashboardData)

    let isMounted = true
    const checkBackgroundMissions = async () => {
      try {
        const data = await apiFetch<{ newAssignments: number; missionsChecked: number }>('/api/v1/tester/find-missions', {
          method: 'POST',
        })
        if (isMounted && data.newAssignments > 0) {
          void loadDashboard(true)
        }
      } catch (e) {
        // Silently ignore background check errors
      }
    }

    void checkBackgroundMissions()

    return () => {
      isMounted = false
    }
  }, [hasInitialDashboardData, loadDashboard])

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
      const refreshedUser = await refetch()
      const refreshedBalance = refreshedUser?.testerProfile?.coinBalance

      if (typeof refreshedBalance === 'number') {
        setStats((currentStats) => currentStats ? { ...currentStats, coinBalance: refreshedBalance } : currentStats)
      }
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

  function getFounderSwitchDisplayName() {
    const displayName =
      user?.founderProfile?.displayName
      ?? user?.testerProfile?.displayName
      ?? user?.email.split('@')[0]
      ?? 'Founder'
    const trimmedDisplayName = displayName.trim()

    return trimmedDisplayName.length >= 2 ? trimmedDisplayName : 'Founder'
  }

  async function handleSwitchToFounder() {
    setIsSwitchingToFounder(true)

    try {
      await apiFetch('/api/v1/auth/select-role', {
        method: 'POST',
        body: {
          role: 'FOUNDER',
          displayName: getFounderSwitchDisplayName(),
        },
      })
      await refetch()
      router.push('/dashboard/founder')
    } catch (error) {
      if (user?.founderProfile) {
        router.push('/dashboard/founder')
        return
      }

      const message =
        isApiClientError(error) && error.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : 'Could not switch to founder mode. Please try again.'
      toast.error(message)
    } finally {
      setIsSwitchingToFounder(false)
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


  const testerNavItems = [
    { id: 'missions', label: 'Missions', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ] as const

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">

      <aside className="fixed left-0 top-0 z-[100] hidden h-screen w-[260px] flex-col overflow-y-auto border-r border-[rgba(250,247,242,0.06)] bg-[var(--dark)] py-6 md:flex">
        <div className="border-b border-[rgba(250,247,242,0.04)] px-6 pb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 font-['Satoshi'] text-base font-bold tracking-tight text-[var(--cream)]">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--dark-surface)] font-[family-name:var(--font-dm-mono)] text-[0.7rem] text-[var(--cream)]">S</div>
              solutionizing
            </div>
            <div className="w-6 h-[2px] rounded-full bg-[var(--electric)] mt-1" />
          </div>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {testerNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`cursor-none flex w-full items-center gap-3 border-l-2 px-6 py-3 text-left font-['Satoshi'] text-[0.9rem] font-medium transition-all ${
                  isActive
                    ? 'border-[var(--electric)] bg-[rgba(250,247,242,0.06)] text-[var(--cream)]'
                    : 'border-transparent text-[rgba(250,247,242,0.5)] hover:bg-[rgba(250,247,242,0.03)] hover:text-[rgba(250,247,242,0.7)]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4 border-t border-[rgba(250,247,242,0.04)] p-6">
          <div className="rounded-[10px] border border-[rgba(255,107,26,0.2)] bg-[var(--dark-surface)] px-4 py-3">
            <div className="mb-1 font-[family-name:var(--font-dm-mono)] text-[0.68rem] uppercase tracking-[0.1em] text-[var(--electric)]">TOTAL EARNED</div>
            <div className="mb-1 font-[family-name:var(--font-fraunces)] text-[1.8rem] font-bold leading-none text-[var(--cream)]">
              {formatRupeesFromCoins(balance)}
            </div>
            <div className="text-[0.78rem] text-[rgba(250,247,242,0.4)]">{formatCoins(balance)} coins</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--electric-mid)] bg-[var(--electric-dim)] font-[family-name:var(--font-dm-mono)] text-[0.8rem] font-semibold text-[var(--electric)]">
              {(user?.testerProfile?.displayName ?? user?.email ?? 'T').charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-['Satoshi'] text-[0.88rem] font-semibold leading-[1.2] text-[var(--cream)]">
                {user?.testerProfile?.displayName ?? user?.email?.split('@')[0] ?? 'Tester'}
              </span>
              <span className="font-[family-name:var(--font-dm-mono)] text-[0.68rem] text-[rgba(250,247,242,0.3)]">TESTER</span>
            </div>
          </div>

          <button type="button" onClick={() => void handleSwitchToFounder()} disabled={isSwitchingToFounder} className="flex items-center gap-2 font-[family-name:var(--font-dm-mono)] text-[0.72rem] text-[rgba(250,247,242,0.4)] transition-colors hover:text-[rgba(250,247,242,0.7)] cursor-none">
            <ArrowRightLeft className="h-3 w-3" />
            {isSwitchingToFounder ? 'switching...' : 'switch to founder'}
          </button>

          <button type="button" onClick={() => void signOut()} className="text-left font-[family-name:var(--font-dm-mono)] text-[0.72rem] text-[rgba(250,247,242,0.25)] transition-colors hover:text-[rgba(250,247,242,0.5)] cursor-none">
            sign out
          </button>
        </div>
      </aside>

      <main className="founder-main-canvas min-h-screen w-full bg-[var(--bg)] px-6 pb-24 pt-20 md:ml-[260px] md:w-[calc(100%-260px)] md:px-12 md:py-10 md:pb-10">
        <style>{`
          @keyframes pageIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>

        <div className="mb-10 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-[family-name:var(--font-fraunces)] text-[1.6rem] font-normal italic text-[var(--ink)]">
              {activeTab === 'missions' ? 'your missions.' : activeTab === 'settings' ? 'account settings.' : 'how can we help?'}
            </h1>
            <div className="w-10 h-[3px] rounded-full bg-[var(--electric)] mt-1.5" />
          </div>
          <button type="button" onClick={() => setWithdrawalOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-[var(--electric)] px-5 py-2.5 font-['Satoshi'] text-[0.88rem] font-bold text-[var(--cream)] transition-all hover:-translate-y-px hover:opacity-90 cursor-none">
            get payout →
          </button>
        </div>

        <div key={activeTab} className="animate-[tabEnter_0.22s_ease_forwards]">
          {activeTab === 'missions' ? (
            <TesterMissionsTab user={user} stats={stats} assignments={assignments} isLoading={isLoading} loadError={loadError} now={now} balance={balance} onRetry={() => void loadDashboard()} onOpenWithdrawal={() => setWithdrawalOpen(true)} onAbandon={(assignment) => setAbandonTarget(assignment)} />
          ) : activeTab === 'support' ? (
            <SupportPage role="TESTER" />
          ) : (
            <TesterSettingsTab displayName={user?.testerProfile?.displayName || 'N/A'} email={user?.email || 'N/A'} onOpenDeleteModal={() => setDeleteModalOpen(true)} />
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-[9999] flex h-[56px] w-full items-center justify-around border-t border-[rgba(250,247,242,0.08)] bg-[var(--dark)] md:!hidden">
        {testerNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} className={`flex flex-1 flex-col items-center justify-center p-2 transition-colors ${
              isActive ? 'text-[var(--electric)]' : 'text-[rgba(250,247,242,0.4)]'
            }`}>
              <Icon className="h-5 w-5" strokeWidth={2} />
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

export function TesterDashboardPage({ initialData }: TesterDashboardPageProps) {
  return <TesterDashboardContent initialData={initialData} />
}

