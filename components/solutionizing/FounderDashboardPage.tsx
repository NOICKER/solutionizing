"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { RequireAuth } from '@/components/RequireAuth'
import { useAuth } from '@/context/AuthContext'
import { ApiMission } from '@/types/api'
import { deleteAccount } from '@/lib/api/account'
import { BrandMark, ConfirmationDialog, formatCoins, primaryButtonClass } from '@/components/solutionizing/ui'
import { FounderDashboardTab } from '@/components/solutionizing/founder/FounderDashboardTab'
import { FounderMissionsTab } from '@/components/solutionizing/founder/FounderMissionsTab'
import { FounderSettingsTab } from '@/components/solutionizing/founder/FounderSettingsTab'
import { FounderWalletsTab } from '@/components/solutionizing/founder/FounderWalletsTab'
import { SupportPage } from '@/components/solutionizing/shared/SupportPage'
import { ThemeToggleButton } from '@/components/solutionizing/shared/ThemeToggleButton'

interface BalanceResponse {
  balance?: number
  coinBalance?: number
}

function GlyphChip({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-black uppercase ${className}`}>
      {children}
    </div>
  )
}

function SidebarNavItem({
  label,
  glyph,
  active = false,
  disabled = false,
  href,
  onClick,
}: {
  label: string
  glyph: string
  active?: boolean
  disabled?: boolean
  href?: string
  onClick?: () => void
}) {
  const className = active
    ? 'flex items-center gap-3 rounded-2xl bg-[#f7ede8] px-4 py-3 text-sm font-bold text-[#d77a57] dark:bg-[#d77a57]/20 dark:text-[#d77a57]'
    : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[#6b687a] transition-colors hover:bg-[#f6f1ec] hover:text-[#1a1625] dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'

  if (href) {
    return (
      <Link href={href} className={className}>
        <GlyphChip className={active ? 'bg-[#f3ddd3] text-[#d77a57] dark:bg-[#d77a57]/30 dark:text-[#d77a57]' : 'bg-[#f6f1ec] text-[#8b8797] dark:bg-gray-800 dark:text-gray-400'}>
          {glyph}
        </GlyphChip>
        {label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={`${className} w-full text-left ${disabled ? 'cursor-default text-[#a39ead] hover:bg-transparent hover:text-[#a39ead] dark:text-gray-500 dark:hover:text-gray-500' : ''}`}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled ? 'true' : undefined}
    >
      <GlyphChip className={active ? 'bg-[#f3ddd3] text-[#d77a57] dark:bg-[#d77a57]/30 dark:text-[#d77a57]' : 'bg-[#f6f1ec] text-[#8b8797] dark:bg-gray-800 dark:text-gray-400'}>
        {glyph}
      </GlyphChip>
      {label}
    </button>
  )
}

function FounderDashboardContent() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [missions, setMissions] = useState<ApiMission[]>([])
  const [coinBalance, setCoinBalance] = useState(user?.founderProfile?.coinBalance ?? 0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<{ missionId: string; action: string } | null>(null)
  const [dialogMission, setDialogMission] = useState<{ type: 'pause' | 'close'; mission: ApiMission } | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [purchaseLoadingPackId, setPurchaseLoadingPackId] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState('')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'missions' | 'wallets' | 'settings' | 'support'>('dashboard')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadBalance = useCallback(async () => {
    const response = await apiFetch<BalanceResponse>('/api/v1/coins/balance')
    setCoinBalance(response.balance ?? response.coinBalance ?? 0)
  }, [])

  const loadMissions = useCallback(async () => {
    const response = await apiFetch<ApiMission[]>('/api/v1/missions?page=1&limit=20')
    setMissions(response)
  }, [])

  const loadDashboard = useCallback(async () => {
    setLoadError('')
    setIsLoading(true)

    try {
      await Promise.all([loadMissions(), loadBalance()])
    } catch (error) {
      if (isApiClientError(error) && error.code === 'NETWORK_ERROR') {
        setLoadError('Check your internet connection')
      } else {
        setLoadError("Couldn't load your missions")
      }
    } finally {
      setIsLoading(false)
    }
  }, [loadBalance, loadMissions])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const userName = user?.founderProfile?.displayName ?? 'Founder'
  const userEmail = user?.email ?? 'founder@example.com'
  const userInitials =
    userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'F'

  async function handleAccountDelete() {
    setIsDeleting(true)
    setDeleteError('')

    try {
      const response = await deleteAccount()

      if (response.success) {
        toast.success('Your account has been deleted.')
        await signOut()
        router.push('/')
      } else {
        setDeleteError(response.message || 'Failed to delete account')
      }
    } catch (error) {
      setDeleteError('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleMissionAction(mission: ApiMission, action: 'submit' | 'pause' | 'close') {
    setCardErrors((current) => ({ ...current, [mission.id]: '' }))
    setActionLoading({ missionId: mission.id, action })

    try {
      if (action === 'submit') {
        await apiFetch(`/api/v1/missions/${mission.id}/submit`, { method: 'POST' })
        toast.success('Mission submitted for review!')
        await loadMissions()
      } else if (action === 'pause') {
        await apiFetch(`/api/v1/missions/${mission.id}/pause`, { method: 'POST' })
        await loadMissions()
      } else {
        const response = await apiFetch<{ refundAmount?: number; refundCoins?: number }>(
          `/api/v1/missions/${mission.id}/close`,
          { method: 'POST' }
        )
        await Promise.all([loadMissions(), loadBalance()])
        const refund = response.refundCoins ?? response.refundAmount ?? 0
        toast.success(`Mission closed. ${formatCoins(refund)} coins refunded to your balance.`)
      }
    } catch (error) {
      const message =
        isApiClientError(error) && error.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : 'Something went wrong. Please try again.'
      setCardErrors((current) => ({ ...current, [mission.id]: message }))
      throw error
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDialogConfirm() {
    if (!dialogMission) {
      return
    }

    setDialogLoading(true)
    setDialogError('')

    try {
      await handleMissionAction(dialogMission.mission, dialogMission.type)
      setDialogMission(null)
    } catch {
      setDialogError('Something went wrong. Please try again.')
    } finally {
      setDialogLoading(false)
    }
  }

  async function handlePurchase(packId: string) {
    setPurchaseError('')
    setPurchaseLoadingPackId(packId)

    try {
      const response = await apiFetch<{ coinsAdded?: number }>('/api/v1/coins/purchase', {
        method: 'POST',
        body: { packId },
      })
      await loadBalance()
      toast.success(`${formatCoins(response.coinsAdded ?? 0)} coins added to your balance!`)
    } catch (error) {
      setPurchaseError(
        isApiClientError(error) && error.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : 'Purchase failed. Try again.'
      )
    } finally {
      setPurchaseLoadingPackId(null)
    }
  }

  const headerLabel =
    activeTab === 'missions'
      ? 'Missions'
      : activeTab === 'wallets'
        ? 'Wallets & Coins'
        : activeTab === 'settings'
          ? 'Settings'
          : activeTab === 'support'
            ? 'Support'
          : 'Dashboard'

  const headerDescription =
    activeTab === 'wallets'
      ? 'Manage your coin balance and choose a package to keep upcoming missions funded.'
      : activeTab === 'settings'
        ? 'Manage your founder account and preferences from one place.'
        : activeTab === 'support'
          ? 'Find quick answers, check system status, and reach the team when you need a hand.'
        : 'Keep your launches, reviews, and completed studies moving from one place. Everything below is powered by your live mission data.'

  return (
    <div className="min-h-screen bg-[#faf9f7] px-4 py-4 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:flex lg:min-h-[calc(100vh-2rem)] lg:flex-col lg:rounded-[2rem] lg:border lg:border-[#ece6df] lg:bg-white/90 lg:p-5 lg:shadow-[0_30px_80px_-52px_rgba(26,22,37,0.32)] dark:lg:border-gray-700 dark:lg:bg-gray-800">
          <div className="mb-10 flex items-center gap-4 rounded-[1.75rem] bg-[#fcf6f2] px-4 py-4 dark:bg-gray-900/80">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d77a57] to-[#c4673f] shadow-[0_18px_35px_-18px_rgba(215,122,87,0.75)]">
              <BrandMark className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#9b98a8] dark:text-gray-400">Solutionizing</div>
              <div className="mt-1 text-base font-black text-[#1a1625] dark:text-white">Founder Hub</div>
            </div>
          </div>

          <nav className="space-y-2">
            <SidebarNavItem
              label="Dashboard"
              glyph="D"
              onClick={() => setActiveTab('dashboard')}
              active={activeTab === 'dashboard'}
            />
            <SidebarNavItem
              label="Missions"
              glyph="M"
              onClick={() => setActiveTab('missions')}
              active={activeTab === 'missions'}
            />
            <SidebarNavItem
              label="Wallets & Coins"
              glyph="W"
              onClick={() => setActiveTab('wallets')}
              active={activeTab === 'wallets'}
            />
            <SidebarNavItem
              label="Settings"
              glyph="S"
              onClick={() => setActiveTab('settings')}
              active={activeTab === 'settings'}
            />
            <SidebarNavItem
              label="Support"
              glyph="?"
              onClick={() => setActiveTab('support')}
              active={activeTab === 'support'}
            />
          </nav>

          <div className="mt-auto rounded-[1.75rem] border border-[#ece6df] bg-[#fffdfa] p-4 dark:border-gray-700 dark:bg-gray-900/70">
            <div className="flex items-center gap-3">
              <GlyphChip className="bg-[#f7ede8] text-[#d77a57]">{userInitials}</GlyphChip>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black text-[#1a1625] dark:text-white">{userName}</div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-[#9b98a8] dark:text-gray-400">Founder</div>
              </div>
            </div>
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[1.4rem] border border-[#ece6df] px-4 py-3 text-sm font-bold text-[#6b687a] transition-colors hover:bg-[#f5f1ed] hover:text-[#1a1625] dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              onClick={() => void signOut()}
            >
              <GlyphChip className="h-8 w-8 bg-[#f6f1ec] text-[#8b8797] dark:bg-gray-800 dark:text-gray-400">O</GlyphChip>
              Log out
            </button>
          </div>
        </aside>

        <main className="min-w-0 pb-28 lg:pb-0">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#ece6df] bg-white/75 p-5 shadow-[0_30px_80px_-52px_rgba(26,22,37,0.2)] backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90 sm:p-6 lg:p-8">
            <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#f7dfd3] opacity-55 blur-3xl dark:bg-[#d77a57]/20" />
            <div className="pointer-events-none absolute bottom-8 left-0 h-64 w-64 rounded-full bg-[#f5f0eb] opacity-90 blur-3xl dark:bg-gray-900" />

            <div className="relative z-10">
              <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#eee5df] bg-white/85 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#9b98a8] dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-400">
                    <BrandMark className="h-3.5 w-3.5 text-[#d77a57]" />
                    {headerLabel}
                  </div>
                  <h1 className="text-3xl font-black leading-tight text-[#1a1625] dark:text-white sm:text-4xl">
                    Welcome back, <span className="text-[#d77a57]">{userName}</span>
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b687a] dark:text-gray-400 sm:text-base">{headerDescription}</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
                  <div className="flex items-center gap-3 rounded-[1.7rem] border border-[#ece6df] bg-white/95 px-4 py-3 shadow-[0_18px_40px_-28px_rgba(26,22,37,0.18)] dark:border-gray-700 dark:bg-gray-900/80">
                    <GlyphChip className="bg-amber-50 text-amber-500">C</GlyphChip>
                    <div>
                      <div className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#9b98a8] dark:text-gray-400">Coin balance</div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-[#1a1625] dark:text-white">{formatCoins(coinBalance)} coins</span>
                        <span className="text-sm font-medium text-[#9b98a8] dark:text-gray-400">~ Rs {(coinBalance / 100).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                  <button className={`px-5 py-3 text-sm ${primaryButtonClass}`} onClick={() => setActiveTab('wallets')}>
                    BUY COINS +
                  </button>
                  <ThemeToggleButton />
                </div>
              </div>

              {activeTab === 'dashboard' ? (
                <FounderDashboardTab
                  isLoading={isLoading}
                  loadError={loadError}
                  missions={missions}
                  onRetry={() => void loadDashboard()}
                  onViewAllMissions={() => setActiveTab('missions')}
                />
              ) : activeTab === 'missions' ? (
                <FounderMissionsTab
                  missions={missions}
                  isLoading={isLoading}
                  loadError={loadError}
                  cardErrors={cardErrors}
                  actionLoading={actionLoading}
                  onRetry={() => void loadDashboard()}
                  onSubmitMission={(mission) => void handleMissionAction(mission, 'submit')}
                  onOpenDialog={(type, mission) => setDialogMission({ type, mission })}
                />
              ) : activeTab === 'wallets' ? (
                <FounderWalletsTab
                  coinBalance={coinBalance}
                  purchaseError={purchaseError}
                  purchaseLoadingPackId={purchaseLoadingPackId}
                  onPurchase={(packId) => void handlePurchase(packId)}
                />
              ) : activeTab === 'support' ? (
                <SupportPage role="FOUNDER" />
              ) : (
                <FounderSettingsTab
                  userName={userName}
                  userEmail={userEmail}
                  onOpenDeleteModal={() => setDeleteModalOpen(true)}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      <nav className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center justify-between rounded-[1.9rem] border border-[#ece6df] bg-white/95 px-2 py-2 shadow-[0_30px_80px_-52px_rgba(26,22,37,0.3)] backdrop-blur dark:border-gray-700 dark:bg-gray-800/95 lg:hidden">
        <Link
          href="/dashboard/founder"
          className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-[1.4rem] bg-[#f5ede7] px-2 py-2 text-[#1a1625] dark:bg-[#d77a57]/20 dark:text-white"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d77a57] text-sm font-black text-white">D</div>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em]">Dashboard</span>
        </Link>
        <Link
          href="#missions-section"
          className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-[1.4rem] px-2 py-2 text-[#6e6882] transition hover:bg-[#f8f3ef] dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f3efe8] text-sm font-black text-[#6b6477] dark:bg-gray-700 dark:text-gray-300">M</div>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em]">Missions</span>
        </Link>
        <button
          type="button"
          onClick={() => setActiveTab('wallets')}
          className={`flex min-w-0 flex-1 flex-col items-center gap-2 rounded-[1.4rem] px-2 py-2 transition ${activeTab === 'wallets' ? 'bg-[#f5ede7] text-[#1a1625] dark:bg-[#d77a57]/20 dark:text-white' : 'text-[#6e6882] hover:bg-[#f8f3ef] dark:text-gray-400 dark:hover:bg-gray-700'}`}
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black ${activeTab === 'wallets' ? 'bg-[#d77a57] text-white' : 'bg-[#f3efe8] text-[#6b6477] dark:bg-gray-700 dark:text-gray-300'}`}>
            W
          </div>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em]">Wallets</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex min-w-0 flex-1 flex-col items-center gap-2 rounded-[1.4rem] px-2 py-2 transition ${activeTab === 'settings' ? 'bg-[#f5ede7] text-[#1a1625] dark:bg-[#d77a57]/20 dark:text-white' : 'text-[#6e6882] hover:bg-[#f8f3ef] dark:text-gray-400 dark:hover:bg-gray-700'}`}
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black ${activeTab === 'settings' ? 'bg-[#d77a57] text-white' : 'bg-[#f3efe8] text-[#6b6477] dark:bg-gray-700 dark:text-gray-300'}`}>
            S
          </div>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em]">Settings</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('support')}
          className={`flex min-w-0 flex-1 flex-col items-center gap-2 rounded-[1.4rem] px-2 py-2 transition ${activeTab === 'support' ? 'bg-[#f5ede7] text-[#1a1625] dark:bg-[#d77a57]/20 dark:text-white' : 'text-[#6e6882] hover:bg-[#f8f3ef] dark:text-gray-400 dark:hover:bg-gray-700'}`}
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black ${activeTab === 'support' ? 'bg-[#d77a57] text-white' : 'bg-[#f3efe8] text-[#6b6477] dark:bg-gray-700 dark:text-gray-300'}`}>
            ?
          </div>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em]">Support</span>
        </button>
      </nav>

      {dialogMission ? (
        <ConfirmationDialog
          title={dialogMission.type === 'pause' ? 'Pause this mission?' : 'Close this mission?'}
          body={
            dialogMission.type === 'pause'
              ? "Testers won't receive new assignments while paused."
              : "You'll receive a refund for unfilled tester slots. This cannot be undone."
          }
          confirmLabel={dialogMission.type === 'pause' ? 'PAUSE MISSION' : 'CLOSE MISSION'}
          confirmStyle={dialogMission.type === 'pause' ? 'primary' : 'danger'}
          onCancel={() => {
            setDialogMission(null)
            setDialogError('')
          }}
          onConfirm={() => void handleDialogConfirm()}
          isLoading={dialogLoading}
          errorMessage={dialogError}
        />
      ) : null}
      {deleteModalOpen ? (
        <ConfirmationDialog
          title="Delete your account?"
          body="Once you delete your account, there is no going back. All your missions and coin balance will be permanently lost."
          confirmLabel="DELETE MY ACCOUNT"
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

export function FounderDashboardPage() {
  return (
    <RequireAuth role="FOUNDER">
      <FounderDashboardContent />
    </RequireAuth>
  )
}
