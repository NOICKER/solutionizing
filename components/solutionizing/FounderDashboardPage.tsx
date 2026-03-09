"use client"

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { RequireAuth } from '@/components/RequireAuth'
import { useAuth } from '@/context/AuthContext'
import { ApiMission } from '@/types/api'
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
  formatRupeesFromCoins,
  mutedButtonClass,
  outlineButtonClass,
  primaryButtonClass,
} from '@/components/solutionizing/ui'

const coinPacks = [
  { packId: 'starter', name: 'Starter', coins: 10000, price: '₹90', discount: '10% OFF', color: 'from-blue-500 to-blue-600', popular: false },
  { packId: 'growth', name: 'Growth', coins: 25000, price: '₹200', discount: '20% OFF', color: 'from-[#d77a57] to-[#c4673f]', popular: true },
  { packId: 'scale', name: 'Scale', coins: 60000, price: '₹420', discount: '30% OFF', color: 'from-purple-500 to-purple-600', popular: false },
] as const

interface BalanceResponse {
  balance?: number
  coinBalance?: number
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
            <svg className="w-5 h-5 text-[#6b687a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
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
                    {isLoading ? <SpinnerIcon className="w-4 h-4" /> : null}
                    PURCHASE
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="flex-1 text-sm text-amber-900">
              <strong>Beta notice:</strong> Payment processing coming soon — coins are credited instantly during beta.
            </p>
          </div>
        </div>

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      </div>
    </ModalShell>
  )
}

function FounderDashboardContent() {
  const router = useRouter()
  const { user } = useAuth()
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

  async function handleMissionAction(
    mission: ApiMission,
    action: 'submit' | 'pause' | 'close'
  ) {
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

  const missionContent = useMemo(() => {
    if (isLoading) {
      return <DashboardCardSkeleton count={3} />
    }

    if (loadError) {
      return (
        <ErrorStatePanel
          title="Couldn't load your missions"
          body="Something went wrong while loading your data. Please check your connection and try again."
          onRetry={() => void loadDashboard()}
          backHref="/dashboard/founder"
        />
      )
    }

    if (missions.length === 0) {
      return (
        <EmptyStatePanel
          buttonLabel="CREATE YOUR FIRST MISSION →"
          onPrimaryAction={() => router.push('/mission/wizard')}
        />
      )
    }

    return (
      <div className="space-y-4">
        {missions.map((mission) => {
          const progress = clampPercent((mission.testersCompleted / Math.max(mission.testersRequired, 1)) * 100)
          const isSubmitting = actionLoading?.missionId === mission.id && actionLoading.action === 'submit'

          return (
            <div key={mission.id} className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
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
                <p className="text-sm text-[#9b98a8]">Under review — usually within 24 hours</p>
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
                  <Link href={`/mission/wizard?edit=${mission.id}`} className={`px-4 py-2 text-sm ${outlineButtonClass}`}>
                    EDIT
                  </Link>
                  <button
                    className={`flex items-center gap-2 px-6 py-2 text-sm ${primaryButtonClass}`}
                    disabled={isSubmitting}
                    onClick={() => void handleMissionAction(mission, 'submit')}
                  >
                    {isSubmitting ? <SpinnerIcon /> : null}
                    SUBMIT FOR REVIEW →
                  </button>
                </div>
              ) : null}

              {mission.status === 'ACTIVE' ? (
                <div className="flex items-center gap-3">
                  <Link href={`/mission/status/${mission.id}`} className={`px-4 py-2 text-sm ${outlineButtonClass}`}>
                    VIEW STATUS →
                  </Link>
                  <button
                    className={`px-4 py-2 text-sm ${mutedButtonClass}`}
                    onClick={() => setDialogMission({ type: 'pause', mission })}
                  >
                    PAUSE
                  </button>
                  <button
                    className="ml-auto text-sm font-semibold text-red-600 hover:underline"
                    onClick={() => setDialogMission({ type: 'close', mission })}
                  >
                    CLOSE
                  </button>
                </div>
              ) : null}

              {mission.status === 'PAUSED' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/mission/status/${mission.id}`} className={`px-4 py-2 text-sm ${outlineButtonClass}`}>
                      VIEW STATUS →
                    </Link>
                    <button
                      className="text-sm font-semibold text-red-600 hover:underline"
                      onClick={() => setDialogMission({ type: 'close', mission })}
                    >
                      CLOSE
                    </button>
                  </div>
                  <p className="text-sm text-[#9b98a8]">Contact support to resume</p>
                </div>
              ) : null}

              {mission.status === 'COMPLETED' ? (
                <div className="space-y-3">
                  <Link href={`/mission/insights/${mission.id}`} className={`inline-flex px-6 py-3 ${primaryButtonClass}`}>
                    VIEW INSIGHTS →
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
                  <Link href={`/mission/wizard?edit=${mission.id}`} className={`inline-flex px-6 py-3 ${primaryButtonClass}`}>
                    EDIT & RESUBMIT →
                  </Link>
                </div>
              ) : null}

              {cardErrors[mission.id] ? <p className="mt-2 text-sm text-red-600">{cardErrors[mission.id]}</p> : null}
            </div>
          )
        })}
      </div>
    )
  }, [actionLoading, cardErrors, isLoading, loadDashboard, loadError, missions, router])

  return (
    <div className="min-h-screen bg-[#faf9f7] rounded-2xl p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d77a57] to-[#c4673f]">
              <BrandMark className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="mb-1 text-xs text-[#9b98a8]">SOLUTIONIZING</div>
              <h1 className="text-2xl font-black text-[#1a1625]">Founder Dashboard</h1>
              <p className="text-sm text-[#6b687a]">Welcome back, {userName}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-full border border-[#e5e4e0] bg-white px-4 py-2">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="text-xl font-black text-[#1a1625]">{formatCoins(coinBalance)} coins</span>
                <span className="ml-2 text-sm text-[#6b687a]">≈ {formatRupeesFromCoins(coinBalance)}</span>
              </div>
            </div>
            <button className={`px-4 py-2 text-sm ${primaryButtonClass}`} onClick={() => setBuyModalOpen(true)}>
              BUY COINS +
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-black text-[#1a1625]">Your Missions</h2>
          <Link href="/mission/wizard" className={`px-6 py-3 text-base ${primaryButtonClass}`}>
            + CREATE NEW MISSION
          </Link>
        </div>

        {missionContent}
      </div>

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
