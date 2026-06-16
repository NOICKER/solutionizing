"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, ClipboardList, HelpCircle, LayoutDashboard, Settings, Wallet } from 'lucide-react'
import posthog from 'posthog-js'
import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { useAuth } from '@/context/AuthContext'
import { ApiMission } from '@/types/api'
import { deleteAccount } from '@/lib/api/account'
import { BrandMark, ConfirmationDialog, PageLoadingBar, formatCoins } from '@/components/solutionizing/ui'
import { FounderDashboardTab } from '@/components/solutionizing/founder/FounderDashboardTab'
import { FounderMissionsTab } from '@/components/solutionizing/founder/FounderMissionsTab'
import { FounderSettingsTab } from '@/components/solutionizing/founder/FounderSettingsTab'
import { FounderWalletsTab, type PurchaseFlowState } from '@/components/solutionizing/founder/FounderWalletsTab'
import { SupportPage } from '@/components/solutionizing/shared/SupportPage'

interface BalanceResponse {
  balance?: number
  coinBalance?: number
}

interface FounderDashboardPageProps {
  initialData?: {
    missions: ApiMission[]
    coinBalance: number
  }
}

type ChecklistStep = {
  label: string
  sub: string
  complete: boolean
  locked: boolean
  action: { label: string; href: string } | { label: string; onClick: () => void } | null
}

function GetStartedChecklist({
  coinBalance,
  missionsCount,
  onBuyCoins,
}: {
  coinBalance: number
  missionsCount: number
  onBuyCoins: () => void
}) {
  const step1Complete = coinBalance > 0
  const step2Complete = missionsCount > 0

  const steps: ChecklistStep[] = [
    {
      label: 'create your account',
      sub: 'done on signup',
      complete: true,
      locked: false,
      action: null,
    },
    {
      label: 'buy coins',
      sub: step1Complete ? 'coins purchased' : 'get coins to fund your first mission',
      complete: step1Complete,
      locked: false,
      action: !step1Complete ? { label: 'buy coins ->', onClick: onBuyCoins } : null,
    },
    {
      label: 'post your first mission',
      sub: step2Complete ? 'mission created' : 'takes 5 minutes',
      complete: step2Complete,
      locked: false,
      action: !step2Complete ? { label: 'create mission ->', href: '/mission/wizard' } : null,
    },
    {
      label: 'review your first report',
      sub: 'unlocks after mission completes',
      complete: false,
      locked: true,
      action: null,
    },
  ]

  return (
    <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem 2rem', marginBottom: '2rem' }}>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: 'var(--electric)', letterSpacing: '0.1em', marginBottom: '1rem' }}>
        GETTING STARTED
      </div>

      {steps.map((step, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.75rem 0',
            borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none',
            opacity: step.locked ? 0.6 : 1,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              flexShrink: 0,
              border: step.complete ? 'none' : '1.5px solid var(--border-strong)',
              background: step.complete ? 'var(--electric)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.3s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {step.complete && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4.5l2.5 2.5L9 1" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '0.95rem',
                fontWeight: 500,
                color: step.complete ? 'var(--ink-soft)' : 'var(--ink)',
                textDecoration: step.complete ? 'line-through' : 'none',
                transition: 'color 0.3s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {step.label}
            </span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
              {step.sub}
            </span>
          </div>

          {step.action && (
            'href' in step.action ? (
              <Link className="cursor-none"
                href={step.action.href}
                style={{
                  background: 'var(--electric)',
                  color: 'var(--cream)',
                  borderRadius: '100px',
                  padding: '0.5rem 1.1rem',
                  fontFamily: 'Satoshi, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.action.label}
              </Link>
            ) : (
              <button className="cursor-none"
                type="button"
                onClick={step.action.onClick}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '0.78rem',
                  color: 'var(--electric)',
                  fontWeight: 500,
                  cursor: 'none',
                }}
              >
                {step.action.label}
              </button>
            )
          )}
        </div>
      ))}
    </div>
  )
}
const founderNavItems = [
  { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Dashboard', icon: LayoutDashboard },
  { id: 'missions', label: 'Missions', mobileLabel: 'Missions', icon: ClipboardList },
  { id: 'wallets', label: 'Wallets & Coins', mobileLabel: 'Wallets', icon: Wallet },
  { id: 'settings', label: 'Settings', mobileLabel: 'Settings', icon: Settings },
  { id: 'support', label: 'Support', mobileLabel: 'Support', icon: HelpCircle },
] as const

type FounderTab = (typeof founderNavItems)[number]['id']

const dashboardLoadingMessages = [
  "Hang tight, we're syncing your missions... unlike your last standup.",
  "Loading... this is the part where enterprise software plays jazz.",
  "Why did the founder cross the road? To get feedback. Still waiting on that too.",
  "Fetching data. Our intern is very fast, don't worry.",
  "Did you know 'loading' is just the app's way of saying it needs a moment to think?",
  "We're not slow, we're just building suspense.",
  "Knock knock. Who's there? Your dashboard. Your dashboard who? Exactly, still loading.",
  "Pro tip: clicking faster does not make it faster. We checked.",
  "This is fine. Everything is fine. The data is coming.",
  'Our servers are powered by chai and determination.',
  'Why do programmers prefer dark mode? Because light attracts bugs.',
  'Almost there... (this message has been approved by the loading committee)',
] as const

function FounderDashboardContent({ initialData }: FounderDashboardPageProps) {
  const router = useRouter()
  const { user, refetch, signOut } = useAuth()
  const hasInitialDashboardData = Boolean(initialData)
  const [missions, setMissions] = useState<ApiMission[]>(initialData?.missions ?? [])
  const [coinBalance, setCoinBalance] = useState(initialData?.coinBalance ?? user?.founderProfile?.coinBalance ?? 0)
  const [isBalanceLoading, setIsBalanceLoading] = useState(!hasInitialDashboardData)
  const [isLoading, setIsLoading] = useState(!hasInitialDashboardData)
  const [loadError, setLoadError] = useState('')
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<{ missionId: string; action: string } | null>(null)
  const [dialogMission, setDialogMission] = useState<{ type: 'pause' | 'close'; mission: ApiMission } | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [purchaseLoadingPackId, setPurchaseLoadingPackId] = useState<string | null>(null)
  const [purchaseResult, setPurchaseResult] = useState<PurchaseFlowState>(null)
  const [activeTab, setActiveTab] = useState<FounderTab>('dashboard')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [isSwitchingToTester, setIsSwitchingToTester] = useState(false)

  const loadBalance = useCallback(async () => {
    setIsBalanceLoading(true)

    try {
      const response = await apiFetch<BalanceResponse>('/api/v1/coins/balance?role=FOUNDER')
      setCoinBalance(response.balance ?? response.coinBalance ?? 0)
    } finally {
      setIsBalanceLoading(false)
    }
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
    if (hasInitialDashboardData) {
      return
    }

    void loadDashboard()
  }, [hasInitialDashboardData, loadDashboard])

  useEffect(() => {
    if (isLoading) {
      setLoadingMessageIndex(0)
    }
  }, [isLoading])

  const userName = user?.founderProfile?.displayName ?? 'Founder'
  const userEmail = user?.email ?? 'founder@example.com'
  const userInitials =
    userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'F'

  function getTesterSwitchDisplayName() {
    const displayName =
      user?.testerProfile?.displayName
      ?? user?.founderProfile?.displayName
      ?? user?.email.split('@')[0]
      ?? 'Tester'
    const trimmedDisplayName = displayName.trim()

    return trimmedDisplayName.length >= 2 ? trimmedDisplayName : 'Tester'
  }

  async function handleSwitchToTester() {
    setIsSwitchingToTester(true)

    try {
      await apiFetch('/api/v1/auth/select-role', {
        method: 'POST',
        body: {
          role: 'TESTER',
          displayName: getTesterSwitchDisplayName(),
        },
      })
      await refetch()
      router.push('/dashboard/tester')
    } catch (error) {
      if (user?.testerProfile) {
        router.push('/dashboard/tester')
        return
      }

      const message =
        isApiClientError(error) && error.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : 'Could not switch to tester mode. Please try again.'
      toast.error(message)
    } finally {
      setIsSwitchingToTester(false)
    }
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

  async function handleMissionAction(
    mission: ApiMission,
    action: 'submit' | 'launch' | 'pause' | 'resume' | 'close'
  ) {
    setCardErrors((current) => ({ ...current, [mission.id]: '' }))
    setActionLoading({ missionId: mission.id, action })

    try {
      if (action === 'submit') {
        await apiFetch(`/api/v1/missions/${mission.id}/submit`, { method: 'POST' })
        toast.success('Mission submitted for review!')
        await loadMissions()
      } else if (action === 'launch') {
        await apiFetch(`/api/v1/missions/${mission.id}/launch`, { method: 'POST' })
        await Promise.all([loadMissions(), loadBalance()])
        toast.success('Mission launched.')
      } else if (action === 'pause') {
        await apiFetch(`/api/v1/missions/${mission.id}/pause`, { method: 'POST' })
        await loadMissions()
      } else if (action === 'resume') {
        await apiFetch(`/api/v1/missions/${mission.id}/resume`, { method: 'POST' })
        await loadMissions()
        toast.success('Mission resumed.')
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
      const message = isApiClientError(error)
        ? error.code === 'INSUFFICIENT_COINS'
          ? "You don't have enough coins to launch this mission. Top up your wallet first."
          : error.code === 'NETWORK_ERROR'
            ? 'Check your internet connection'
            : error.message
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
    setPurchaseResult(null)
    setPurchaseLoadingPackId(packId)

    try {
      const response = await apiFetch<{
        coinsAdded?: number
        newBalance?: number
        pack?: {
          id: string
          label: string
        }
      }>('/api/v1/coins/purchase', {
        method: 'POST',
        body: { packId },
      })
      await loadBalance()
      posthog.capture('coins_purchased', {
        amount: response.coinsAdded ?? 0,
      })
      setPurchaseResult({
        status: 'success',
        packId: packId as 'starter' | 'growth' | 'scale',
        packName: response.pack?.label ?? 'Coin pack',
        coinsAdded: response.coinsAdded ?? 0,
        newBalance: response.newBalance ?? coinBalance + (response.coinsAdded ?? 0),
        message:
          'Your wallet was credited successfully. You can use these coins immediately for upcoming missions in this beta environment.',
      })
    } catch (error) {
      const message =
        isApiClientError(error) && error.code === 'NETWORK_ERROR'
          ? 'We could not reach checkout. Check your internet connection and try again.'
          : isApiClientError(error) && error.code === 'PAYMENTS_UNAVAILABLE'
            ? error.message
            : 'The purchase request failed before coins were credited. Retry the same pack or contact support if it keeps happening.'

      setPurchaseResult({
        status: 'failure',
        packId: packId as 'starter' | 'growth' | 'scale',
        packName:
          packId === 'starter' ? 'Starter' : packId === 'growth' ? 'Growth' : 'Scale',
        message,
      })
    } finally {
      setPurchaseLoadingPackId(null)
    }
  }

  const handleSkeletonClick = useCallback(() => {
    if (!isLoading) {
      return
    }

    setLoadingMessageIndex((currentIndex) => (currentIndex + 1) % dashboardLoadingMessages.length)
  }, [isLoading])

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <PageLoadingBar isLoading={isLoading} />

      <div
        className="lg:hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '50px',
          background: 'rgba(232, 224, 212, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          zIndex: 500,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>
          <BrandMark className="h-4 w-4 text-ink" />
          solutionizing
        </div>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--electric-dim)',
            border: '1px solid var(--electric-mid)',
            color: 'var(--electric)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.7rem',
            fontWeight: 600,
          }}
        >
          {userInitials}
        </div>
      </div>

      <aside
        className="hidden lg:flex lg:flex-col"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '260px',
          height: '100vh',
          background: 'var(--dark)',
          borderRight: '1px solid rgba(250, 247, 242, 0.06)',
          padding: '1.5rem 0',
          zIndex: 100,
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid rgba(250, 247, 242, 0.04)' }}>
          <div className="flex flex-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '1rem', color: 'var(--cream)', letterSpacing: '-0.03em' }}>
              <BrandMark className="h-5 w-5 text-cream" />
              solutionizing
            </div>
            <div className="w-6 h-[2px] rounded-full bg-[var(--electric)] mt-1" />
          </div>
        </div>

        <nav style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {founderNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button className="cursor-none"
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                style={{
                  padding: '0.7rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontFamily: 'Satoshi, sans-serif',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  color: isActive ? 'var(--cream)' : 'rgba(250, 247, 242, 0.5)',
                  background: isActive ? 'rgba(250, 247, 242, 0.06)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '2px solid var(--electric)' : '2px solid transparent',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'color 0.2s cubic-bezier(0.16,1,0.3,1), background 0.2s cubic-bezier(0.16,1,0.3,1), border-color 0.3s cubic-bezier(0.16,1,0.3,1)',
                  cursor: 'none',
                }}
              >
                <Icon style={{ width: 16, height: 16, strokeWidth: 1.8 }} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid rgba(250, 247, 242, 0.04)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--dark-surface)', border: '1px solid rgba(255, 107, 26, 0.2)', borderRadius: '10px', padding: '0.8rem 1rem' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--electric)', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>COIN BALANCE</div>
            {isBalanceLoading ? (
              <div style={{ height: '1.8rem', width: '80px', background: 'rgba(250,247,242,0.08)', borderRadius: '4px', marginBottom: '0.2rem' }} />
            ) : (
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.8rem', fontWeight: 700, color: 'var(--cream)', lineHeight: 1, marginBottom: '0.2rem' }}>
                {formatCoins(coinBalance)}
              </div>
            )}
            <div style={{ fontSize: '0.78rem', color: 'rgba(250, 247, 242, 0.4)' }}>~ Rs {(coinBalance / 100).toFixed(0)} value</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--electric-dim)',
                border: '1px solid var(--electric-mid)',
                color: 'var(--electric)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'DM Mono, monospace',
                fontSize: '0.8rem',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {userInitials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--cream)', lineHeight: 1.2 }}>{userName}</span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'rgba(250, 247, 242, 0.3)' }}>FOUNDER</span>
            </div>
          </div>

          <button className="cursor-none"
            type="button"
            onClick={() => void handleSwitchToTester()}
            disabled={isSwitchingToTester}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.72rem',
              color: 'rgba(250, 247, 242, 0.4)',
              background: 'none',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              cursor: 'none',
              transition: 'color 0.2s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <ArrowRightLeft style={{ width: 12, height: 12 }} />
            {isSwitchingToTester ? 'switching...' : 'switch to tester'}
          </button>

          <button className="cursor-none"
            type="button"
            onClick={() => void signOut()}
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.72rem',
              color: 'rgba(250, 247, 242, 0.25)',
              background: 'none',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              cursor: 'none',
              transition: 'color 0.2s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            sign out
          </button>
        </div>
      </aside>

      <main
        className="founder-main-canvas lg:pb-0"
        style={{ marginLeft: '260px', minHeight: '100vh', background: 'var(--bg)', padding: '2.5rem 3rem', width: 'calc(100% - 260px)' }}
      >
        <style>{`
          @keyframes pageIn { from { opacity: 0; } to { opacity: 1; } }
          @media (max-width: 1024px) {
            .founder-main-canvas {
              margin-left: 0 !important;
              width: 100% !important;
              padding: 5rem 1.5rem 6rem !important;
            }
          }
        `}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', gap: '1rem' }}>
          <div className="flex flex-col">
            <h1 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.6rem', color: 'var(--ink)', fontWeight: 400 }}>
              {activeTab === 'dashboard' ? `good to see you, ${userName.split(' ')[0]}.` :
               activeTab === 'missions' ? 'your missions.' :
               activeTab === 'wallets' ? 'wallet & coins.' :
               activeTab === 'settings' ? 'account settings.' :
               'how can we help?'}
            </h1>
            <div className="w-10 h-[3px] rounded-full bg-[var(--electric)] mt-1.5" />
          </div>
          <Link className="cursor-none"
            href="/mission/wizard"
            style={{
              background: 'var(--electric)',
              color: 'var(--cream)',
              border: 'none',
              borderRadius: '100px',
              padding: '0.65rem 1.4rem',
              fontFamily: 'Satoshi, sans-serif',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              textDecoration: 'none',
              transition: 'background 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s cubic-bezier(0.16,1,0.3,1)',
              whiteSpace: 'nowrap',
            }}
          >
            new mission -&gt;
          </Link>
        </div>

        <div key={activeTab} className="animate-[tabEnter_0.22s_ease_forwards]">
          {activeTab === 'dashboard' ? (
            missions.length === 0 && !isLoading ? (
              <GetStartedChecklist
                coinBalance={coinBalance}
                missionsCount={missions.length}
                onBuyCoins={() => setActiveTab('wallets')}
              />
            ) : (
              <FounderDashboardTab
                isLoading={isLoading}
                loadError={loadError}
                missions={missions}
                coinBalance={coinBalance}
                isBalanceLoading={isBalanceLoading}
                loadingMessage={dashboardLoadingMessages[loadingMessageIndex]}
                actionLoading={actionLoading}
                onSkeletonClick={handleSkeletonClick}
                onRetry={() => void loadDashboard()}
                onLaunchMission={(mission) => void handleMissionAction(mission, 'launch')}
                onViewAllMissions={() => setActiveTab('missions')}
              />
            )
          ) : activeTab === 'missions' ? (
            <FounderMissionsTab
              missions={missions}
              isLoading={isLoading}
              loadError={loadError}
              cardErrors={cardErrors}
              actionLoading={actionLoading}
              onRetry={() => void loadDashboard()}
              onSubmitMission={(mission) => void handleMissionAction(mission, 'submit')}
              onLaunchMission={(mission) => void handleMissionAction(mission, 'launch')}
              onResumeMission={(mission) => void handleMissionAction(mission, 'resume')}
              onOpenDialog={(type, mission) => setDialogMission({ type, mission })}
            />
          ) : activeTab === 'wallets' ? (
            <FounderWalletsTab
              coinBalance={coinBalance}
              purchaseLoadingPackId={purchaseLoadingPackId}
              purchaseResult={purchaseResult}
              onPurchase={(packId) => void handlePurchase(packId)}
              onResetPurchaseResult={() => setPurchaseResult(null)}
              onGoToMissions={() => {
                setPurchaseResult(null)
                setActiveTab('missions')
              }}
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
      </main>

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '56px',
          background: 'var(--dark)',
          borderTop: '1px solid rgba(250, 247, 242, 0.08)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
        className="lg:hidden"
      >
        {founderNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button className="cursor-none"
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive ? 'var(--electric)' : 'rgba(250, 247, 242, 0.4)',
                background: 'none',
                border: 'none',
                padding: '0.4rem',
                transition: 'color 0.2s cubic-bezier(0.16,1,0.3,1)',
                cursor: 'none',
                flex: 1,
              }}
            >
              <Icon style={{ width: 20, height: 20, strokeWidth: 2 }} />
            </button>
          )
        })}
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

export function FounderDashboardPage({ initialData }: FounderDashboardPageProps) {
  return <FounderDashboardContent initialData={initialData} />
}
