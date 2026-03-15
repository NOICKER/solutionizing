"use client"

import Link from 'next/link'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { RequireAuth } from '@/components/RequireAuth'
import { useAuth } from '@/context/AuthContext'
import { ApiMission } from '@/types/api'
import { deleteAccount } from '@/lib/api/account'
import {
  BrandMark,
  ConfirmationDialog,
  DashboardCardSkeleton,
  EmptyStatePanel,
  ErrorStatePanel,
  MissionStatusBadge,
  ModalShell,
  SpinnerIcon,
  clampPercent,
  formatCoins,
  mutedButtonClass,
  outlineButtonClass,
  primaryButtonClass,
} from '@/components/solutionizing/ui'

const coinPacks = [
  { packId: 'starter', name: 'Starter', coins: 10000, price: 'Rs 90', discount: '10% OFF', color: 'from-blue-500 to-blue-600', popular: false },
  { packId: 'growth', name: 'Growth', coins: 25000, price: 'Rs 200', discount: '20% OFF', color: 'from-[#d77a57] to-[#c4673f]', popular: true },
  { packId: 'scale', name: 'Scale', coins: 60000, price: 'Rs 420', discount: '30% OFF', color: 'from-purple-500 to-purple-600', popular: false },
] as const

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
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-black uppercase ${className}`}
    >
      {children}
    </div>
  )
}

function StatCard({
  label,
  value,
  glyph,
  className,
  isLoading,
}: {
  label: string
  value: number
  glyph: string
  className: string
  isLoading: boolean
}) {
  return (
    <div className="rounded-3xl border border-[#ece6df] bg-white/95 p-5 shadow-[0_20px_60px_-42px_rgba(26,22,37,0.28)]">
      <div className="mb-4 flex items-center justify-between">
        <GlyphChip className={className}>{glyph}</GlyphChip>
        <div className="rounded-full bg-[#faf5f0] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#9b98a8]">
          Live
        </div>
      </div>
      <div className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#9b98a8]">
        {label}
      </div>
      <div className="text-3xl font-black text-[#1a1625]">
        {isLoading ? <span className="inline-block h-8 w-14 animate-pulse rounded-xl bg-[#f1ebe5]" /> : value}
      </div>
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
    ? 'flex items-center gap-3 rounded-2xl bg-[#f7ede8] px-4 py-3 text-sm font-bold text-[#d77a57]'
    : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[#6b687a] transition-colors hover:bg-[#f6f1ec] hover:text-[#1a1625]'

  if (href) {
    return (
      <Link href={href} className={className}>
        <GlyphChip className={active ? 'bg-[#f3ddd3] text-[#d77a57]' : 'bg-[#f6f1ec] text-[#8b8797]'}>
          {glyph}
        </GlyphChip>
        {label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={`${className} w-full text-left ${disabled ? 'cursor-default text-[#a39ead] hover:bg-transparent hover:text-[#a39ead]' : ''}`}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled ? 'true' : undefined}
    >
      <GlyphChip className={active ? 'bg-[#f3ddd3] text-[#d77a57]' : 'bg-[#f6f1ec] text-[#8b8797]'}>
        {glyph}
      </GlyphChip>
      {label}
    </button>
  )
}

function BuyCoinsModal({
  loadingPackId,
  errorMessage,
  onClose,
  onPurchase,
}: {
  loadingPackId: string | null
  errorMessage: string
  onClose: () => void
  onPurchase: (packId: (typeof coinPacks)[number]['packId']) => void
}) {
  return (
    <ModalShell onClose={onClose}>
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="mb-1 text-3xl font-black text-[#1a1625]">Buy Coins</h2>
            <p className="text-[#6b687a]">Choose a package to add coins to your balance</p>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f3f5] transition-colors hover:bg-[#e5e4e0]" onClick={onClose}>
            <svg className="h-5 w-5 text-[#6b687a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {coinPacks.map((pack) => {
            const isLoading = loadingPackId === pack.packId
            const purchaseDisabled = loadingPackId !== null

            return (
              <div key={pack.packId} className={`relative rounded-3xl bg-gradient-to-br ${pack.color} p-6 text-white`}>
                {pack.popular ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-xs font-black text-amber-900">
                    POPULAR
                  </div>
                ) : null}
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-xl font-black backdrop-blur-sm">
                    C
                  </div>
                  <h3 className="mb-2 text-xl font-black">{pack.name}</h3>
                  <div className="mb-1 text-4xl font-black">{formatCoins(pack.coins)}</div>
                  <div className="mb-3 text-sm opacity-90">coins</div>
                  <div className="mb-4 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                    {pack.discount}
                  </div>
                  <div className="mb-4 text-3xl font-black">{pack.price}</div>
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-[2rem] bg-white py-2.5 text-sm font-black text-[#1a1625] transition-all hover:shadow-lg disabled:pointer-events-none disabled:opacity-70"
                    disabled={purchaseDisabled}
                    onClick={() => onPurchase(pack.packId)}
                  >
                    {isLoading ? <SpinnerIcon className="h-4 w-4" /> : null}
                    PURCHASE
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Beta notice:</strong> Payment processing coming soon - coins are credited instantly during beta.
        </div>

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      </div>
    </ModalShell>
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
  const [buyModalOpen, setBuyModalOpen] = useState(false)
  const [purchaseLoadingPackId, setPurchaseLoadingPackId] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState('')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'missions' | 'settings'>('dashboard')
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
  const userInitials =
    userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'F'

  const missionStats = useMemo(
    () => ({
      active: missions.filter((mission) => mission.status === 'ACTIVE').length,
      total: missions.length,
      completed: missions.filter((mission) => mission.status === 'COMPLETED').length,
      drafts: missions.filter((mission) => mission.status === 'DRAFT').length,
    }),
    [missions]
  )

  function getMissionDestination(mission: ApiMission) {
    if (mission.status === 'COMPLETED') {
      return `/mission/insights/${mission.id}`
    }

    if (mission.status === 'ACTIVE' || mission.status === 'PENDING_REVIEW') {
      return `/mission/status/${mission.id}`
    }

    if (mission.status === 'DRAFT') {
      return `/mission/wizard?edit=${mission.id}`
    }

    return null
  }

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

  async function handlePurchase(packId: (typeof coinPacks)[number]['packId']) {
    setPurchaseError('')
    setPurchaseLoadingPackId(packId)

    try {
      const response = await apiFetch<{ coinsAdded?: number }>('/api/v1/coins/purchase', {
        method: 'POST',
        body: { packId },
      })
      await loadBalance()
      setBuyModalOpen(false)
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

  let missionContent: ReactNode

  if (isLoading) {
    missionContent = <DashboardCardSkeleton count={3} />
  } else if (loadError) {
    missionContent = (
      <ErrorStatePanel
        title="Couldn't load your missions"
        body="Something went wrong while loading your data. Please check your connection and try again."
        onRetry={() => void loadDashboard()}
        backHref="/dashboard/founder"
      />
    )
  } else if (missions.length === 0) {
    missionContent = (
      <EmptyStatePanel
        buttonLabel="CREATE YOUR FIRST MISSION ->"
        onPrimaryAction={() => router.push('/mission/wizard')}
      />
    )
  } else {
    missionContent = (
      <div className="space-y-4">
        {missions.map((mission) => {
          const progress = clampPercent((mission.testersCompleted / Math.max(mission.testersRequired, 1)) * 100)
          const isSubmitting = actionLoading?.missionId === mission.id && actionLoading.action === 'submit'
          const missionHref = getMissionDestination(mission)
          const isCardClickable = Boolean(missionHref)

          function openMissionCard() {
            if (missionHref) {
              router.push(missionHref)
            }
          }

          return (
            <div
              key={mission.id}
              className={`rounded-3xl border border-[#e5e4e0] bg-white p-6 ${isCardClickable ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`}
              onClick={isCardClickable ? openMissionCard : undefined}
              onKeyDown={
                isCardClickable
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openMissionCard()
                      }
                    }
                  : undefined
              }
              role={isCardClickable ? 'link' : undefined}
              tabIndex={isCardClickable ? 0 : undefined}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-black text-[#1a1625]">{mission.title}</h3>
                  {mission.status !== 'PENDING_REVIEW' ? (
                    <p className="text-sm text-[#6b687a]">{mission.goal}</p>
                  ) : null}
                </div>
                <MissionStatusBadge status={mission.status} />
              </div>

              {mission.status === 'PENDING_REVIEW' ? (
                <p className="text-sm text-[#9b98a8]">Under review - usually within 24 hours</p>
              ) : null}

              {mission.status !== 'PENDING_REVIEW' ? (
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-[#6b687a]">
                      {mission.testersCompleted} of {mission.testersRequired} testers
                    </span>
                    <span className="font-bold text-[#1a1625]">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#d77a57] to-[#c4673f]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {mission.status === 'DRAFT' ? (
                <div className="flex items-center gap-3">
                  <Link
                    href={`/mission/wizard?edit=${mission.id}`}
                    className={`px-4 py-2 text-sm ${outlineButtonClass}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    EDIT
                  </Link>
                  <button
                    className={`flex items-center gap-2 px-6 py-2 text-sm ${primaryButtonClass}`}
                    disabled={isSubmitting}
                    onClick={(event) => {
                      event.stopPropagation()
                      void handleMissionAction(mission, 'submit')
                    }}
                  >
                    {isSubmitting ? <SpinnerIcon /> : null}
                    SUBMIT FOR REVIEW {'->'}
                  </button>
                </div>
              ) : null}

              {mission.status === 'ACTIVE' ? (
                <div className="flex items-center gap-3">
                  <Link
                    href={`/mission/status/${mission.id}`}
                    className={`px-4 py-2 text-sm ${outlineButtonClass}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    VIEW STATUS {'->'}
                  </Link>
                  <button
                    className={`px-4 py-2 text-sm ${mutedButtonClass}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      setDialogMission({ type: 'pause', mission })
                    }}
                  >
                    PAUSE
                  </button>
                  <button
                    className="ml-auto text-sm font-semibold text-red-600 hover:underline"
                    onClick={(event) => {
                      event.stopPropagation()
                      setDialogMission({ type: 'close', mission })
                    }}
                  >
                    CLOSE
                  </button>
                </div>
              ) : null}

              {mission.status === 'PAUSED' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/mission/status/${mission.id}`}
                      className={`px-4 py-2 text-sm ${outlineButtonClass}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      VIEW STATUS {'->'}
                    </Link>
                    <button
                      className="text-sm font-semibold text-red-600 hover:underline"
                      onClick={(event) => {
                        event.stopPropagation()
                        setDialogMission({ type: 'close', mission })
                      }}
                    >
                      CLOSE
                    </button>
                  </div>
                  <p className="text-sm text-[#9b98a8]">Contact support to resume</p>
                </div>
              ) : null}

              {mission.status === 'COMPLETED' ? (
                <div className="space-y-3">
                  <Link
                    href={`/mission/insights/${mission.id}`}
                    className={`inline-flex px-6 py-3 ${primaryButtonClass}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    VIEW INSIGHTS {'->'}
                  </Link>
                  {mission.completedAt ? (
                    <p className="text-sm text-[#9b98a8]">Completed {format(new Date(mission.completedAt), 'MMM d, yyyy')}</p>
                  ) : null}
                </div>
              ) : null}

              {mission.status === 'REJECTED' ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <h4 className="mb-1 text-sm font-bold text-red-900">Feedback from our team</h4>
                    <p className="text-sm text-red-800">{mission.reviewNote ?? 'Your mission needs changes before it can go live.'}</p>
                  </div>
                  <Link
                    href={`/mission/wizard?edit=${mission.id}`}
                    className={`inline-flex px-6 py-3 ${primaryButtonClass}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    EDIT & RESUBMIT {'->'}
                  </Link>
                </div>
              ) : null}

              {cardErrors[mission.id] ? <p className="mt-2 text-sm text-red-600">{cardErrors[mission.id]}</p> : null}
            </div>
          )
        })}
      </div>
    )
  }

  const statsCards = [
    { label: 'ACTIVE MISSIONS', value: missionStats.active, glyph: 'A', className: 'bg-emerald-50 text-emerald-600' },
    { label: 'TOTAL MISSIONS', value: missionStats.total, glyph: 'T', className: 'bg-[#faf1eb] text-[#d77a57]' },
    { label: 'COMPLETED', value: missionStats.completed, glyph: 'C', className: 'bg-sky-50 text-sky-600' },
    { label: 'DRAFTS', value: missionStats.drafts, glyph: 'D', className: 'bg-amber-50 text-amber-600' },
  ] as const

  return (
    <div className="min-h-screen bg-[#faf9f7] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:flex lg:min-h-[calc(100vh-2rem)] lg:flex-col lg:rounded-[2rem] lg:border lg:border-[#ece6df] lg:bg-white/90 lg:p-5 lg:shadow-[0_30px_80px_-52px_rgba(26,22,37,0.32)]">
          <div className="mb-10 flex items-center gap-4 rounded-[1.75rem] bg-[#fcf6f2] px-4 py-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d77a57] to-[#c4673f] shadow-[0_18px_35px_-18px_rgba(215,122,87,0.75)]">
              <BrandMark className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#9b98a8]">Solutionizing</div>
              <div className="mt-1 text-base font-black text-[#1a1625]">Founder Hub</div>
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
            <SidebarNavItem label="Wallets & Coins" glyph="W" onClick={() => setBuyModalOpen(true)} />
            <SidebarNavItem
              label="Settings"
              glyph="S"
              onClick={() => setActiveTab('settings')}
              active={activeTab === 'settings'}
            />
            <SidebarNavItem label="Support" glyph="?" disabled />
          </nav>

          <div className="mt-auto rounded-[1.75rem] border border-[#ece6df] bg-[#fffdfa] p-4">
            <div className="flex items-center gap-3">
              <GlyphChip className="bg-[#f7ede8] text-[#d77a57]">{userInitials}</GlyphChip>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black text-[#1a1625]">{userName}</div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-[#9b98a8]">Founder</div>
              </div>
            </div>
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[1.4rem] border border-[#ece6df] px-4 py-3 text-sm font-bold text-[#6b687a] transition-colors hover:bg-[#f5f1ed] hover:text-[#1a1625]"
              onClick={() => void signOut()}
            >
              <GlyphChip className="h-8 w-8 bg-[#f6f1ec] text-[#8b8797]">O</GlyphChip>
              Log out
            </button>
          </div>
        </aside>

        <main className="min-w-0 pb-28 lg:pb-0">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#ece6df] bg-white/75 p-5 shadow-[0_30px_80px_-52px_rgba(26,22,37,0.2)] backdrop-blur-sm sm:p-6 lg:p-8">
            <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#f7dfd3] opacity-55 blur-3xl" />
            <div className="pointer-events-none absolute bottom-8 left-0 h-64 w-64 rounded-full bg-[#f5f0eb] opacity-90 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#eee5df] bg-white/85 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#9b98a8]">
                    <BrandMark className="h-3.5 w-3.5 text-[#d77a57]" />
                    Dashboard
                  </div>
                  <h1 className="text-3xl font-black leading-tight text-[#1a1625] sm:text-4xl">
                    Welcome back, <span className="text-[#d77a57]">{userName}</span>
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b687a] sm:text-base">
                    Keep your launches, reviews, and completed studies moving from one place.
                    Everything below is powered by your live mission data.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
                  <div className="flex items-center gap-3 rounded-[1.7rem] border border-[#ece6df] bg-white/95 px-4 py-3 shadow-[0_18px_40px_-28px_rgba(26,22,37,0.18)]">
                    <GlyphChip className="bg-amber-50 text-amber-500">C</GlyphChip>
                    <div>
                      <div className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#9b98a8]">Coin balance</div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-[#1a1625]">{formatCoins(coinBalance)} coins</span>
                        <span className="text-sm font-medium text-[#9b98a8]">~ Rs {(coinBalance / 100).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                  <button className={`px-5 py-3 text-sm ${primaryButtonClass}`} onClick={() => setBuyModalOpen(true)}>
                    BUY COINS +
                  </button>
                </div>
              </div>

              {activeTab === 'dashboard' || activeTab === 'missions' ? (
                <>
                  <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {statsCards.map((card) => (
                      <StatCard
                        key={card.label}
                        label={card.label}
                        value={card.value}
                        glyph={card.glyph}
                        className={card.className}
                        isLoading={isLoading}
                      />
                    ))}
                  </div>

                  <section
                    id="missions-section"
                    className="rounded-[1.9rem] border border-[#ece6df] bg-white/80 p-4 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.26)] sm:p-6"
                  >
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#9b98a8]">Mission overview</div>
                        <h2 className="mt-2 text-2xl font-black text-[#1a1625]">Your Missions</h2>
                      </div>
                      <Link href="/mission/wizard" className={`px-6 py-3 text-base ${primaryButtonClass}`}>
                        + CREATE NEW MISSION
                      </Link>
                    </div>

                    {missionContent}
                  </section>
                </>
              ) : (
                <section className="rounded-[1.9rem] border border-[#ece6df] bg-white/80 p-4 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.26)] sm:p-6">
                  <div className="mb-8">
                    <h2 className="text-2xl font-black text-[#1a1625]">Account Settings</h2>
                    <p className="text-[#6b687a]">Manage your founder account and preferences.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6">
                      <h3 className="mb-2 text-lg font-bold text-red-900">Danger Zone</h3>
                      <p className="mb-6 text-sm text-red-700/80">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button
                        onClick={() => setDeleteModalOpen(true)}
                        className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-red-700"
                      >
                        DELETE ACCOUNT
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>
      </div>

      <nav className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center justify-between rounded-[1.9rem] border border-[#ece6df] bg-white/95 px-2 py-2 shadow-[0_30px_80px_-52px_rgba(26,22,37,0.3)] backdrop-blur lg:hidden">
        <Link
          href="/dashboard/founder"
          className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-[1.4rem] bg-[#f5ede7] px-2 py-2 text-[#1a1625]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d77a57] text-sm font-black text-white">D</div>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em]">Dashboard</span>
        </Link>
        <Link
          href="#missions-section"
          className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-[1.4rem] px-2 py-2 text-[#6e6882] transition hover:bg-[#f8f3ef]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f3efe8] text-sm font-black text-[#6b6477]">M</div>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em]">Missions</span>
        </Link>
        <button
          type="button"
          onClick={() => setBuyModalOpen(true)}
          className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-[1.4rem] px-2 py-2 text-[#6e6882] transition hover:bg-[#f8f3ef]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f3efe8] text-sm font-black text-[#6b6477]">W</div>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em]">Wallets</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex min-w-0 flex-1 flex-col items-center gap-2 rounded-[1.4rem] px-2 py-2 transition ${activeTab === 'settings' ? 'bg-[#f5ede7] text-[#1a1625]' : 'text-[#6e6882] hover:bg-[#f8f3ef]'}`}
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black ${activeTab === 'settings' ? 'bg-[#d77a57] text-white' : 'bg-[#f3efe8] text-[#6b6477]'}`}>
            S
          </div>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em]">Settings</span>
        </button>
        <button
          type="button"
          disabled
          className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-[1.4rem] px-2 py-2 text-[#b8b0a8]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6f2ed] text-sm font-black text-[#b8b0a8]">?</div>
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

      {buyModalOpen ? (
        <BuyCoinsModal
          loadingPackId={purchaseLoadingPackId}
          errorMessage={purchaseError}
          onClose={() => setBuyModalOpen(false)}
          onPurchase={(packId) => void handlePurchase(packId)}
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
