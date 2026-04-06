"use client"

import { ClipboardList, Coins } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { ApiMission } from '@/types/api'
import {
  DashboardCardSkeleton,
  EmptyStatePanel,
  ErrorStatePanel,
  MissionStatusBadge,
  RetestCountChip,
  clampPercent,
  formatCoins,
  primaryButtonClass,
} from '@/components/solutionizing/ui'

function getMissionRecencyTimestamp(mission: ApiMission) {
  const timestamp = Date.parse(mission.completedAt ?? mission.updatedAt ?? mission.createdAt)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function getDashboardMissionHref(mission: ApiMission) {
  if (mission.status === 'COMPLETED') {
    return `/mission/insights/${mission.id}`
  }

  if (mission.status === 'DRAFT' || mission.status === 'REJECTED') {
    return `/mission/wizard?edit=true&missionId=${mission.id}`
  }

  return `/mission/status/${mission.id}`
}

function DashboardGlyphChip({
  children,
  className = '',
}: {
  children: string
  className?: string
}) {
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-black uppercase ${className}`}>
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
    <div className="rounded-card border border-border-subtle bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <DashboardGlyphChip className={className}>{glyph}</DashboardGlyphChip>
        <div className="rounded-full bg-surface-elevated px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-text-muted">
          Live
        </div>
      </div>
      <div className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-text-muted">{label}</div>
      <div className="text-3xl font-black text-white">
        {isLoading ? <span className="inline-block h-8 w-14 animate-pulse rounded-xl bg-surface-elevated" /> : value}
      </div>
    </div>
  )
}

function RecentMissionCard({
  mission,
  href,
}: {
  mission: ApiMission
  href: string
}) {
  const progress = clampPercent((mission.testersCompleted / Math.max(mission.testersRequired, 1)) * 100)

  return (
    <Link
      href={href}
      aria-label={`Open ${mission.title}`}
      className="group block rounded-card border border-border-subtle bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="text-lg font-black text-white transition-colors group-hover:text-primary">
          {mission.title}
        </h3>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <MissionStatusBadge status={mission.status} />
          {mission.status === 'COMPLETED' && (mission.retests?.length ?? 0) > 0 ? (
            <RetestCountChip count={mission.retests!.length} />
          ) : null}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-text-muted">
            {mission.testersCompleted} of {mission.testersRequired} testers
          </span>
          <span className="font-bold text-white">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#F97C5A] to-[#E45D43]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 text-sm font-bold text-primary transition-colors group-hover:text-primary-hover">
        View
        <svg
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

interface FounderDashboardTabProps {
  isLoading: boolean
  loadError: string
  missions: ApiMission[]
  coinBalance: number
  isBalanceLoading?: boolean
  loadingMessage?: string
  onSkeletonClick?: () => void
  onRetry: () => void
  onViewAllMissions: () => void
}

export function FounderDashboardTab({
  isLoading,
  loadError,
  missions,
  coinBalance,
  isBalanceLoading,
  loadingMessage,
  onSkeletonClick,
  onRetry,
  onViewAllMissions,
}: FounderDashboardTabProps) {
  const router = useRouter()

  const missionStats = useMemo(
    () => ({
      active: missions.filter((mission) => mission.status === 'ACTIVE').length,
      total: missions.length,
      completed: missions.filter((mission) => mission.status === 'COMPLETED').length,
      drafts: missions.filter((mission) => mission.status === 'DRAFT').length,
    }),
    [missions]
  )

  const recentMissions = useMemo(
    () =>
      [...missions]
        .sort((leftMission, rightMission) => getMissionRecencyTimestamp(rightMission) - getMissionRecencyTimestamp(leftMission))
        .slice(0, 3),
    [missions]
  )

  const statsCards = [
    { label: 'ACTIVE MISSIONS', value: missionStats.active, glyph: 'A', className: 'bg-emerald-900/30 text-emerald-300' },
    { label: 'TOTAL MISSIONS', value: missionStats.total, glyph: 'T', className: 'bg-primary/10 text-primary' },
    { label: 'COMPLETED', value: missionStats.completed, glyph: 'C', className: 'bg-sky-900/30 text-sky-300' },
    { label: 'DRAFTS', value: missionStats.drafts, glyph: 'D', className: 'bg-amber-900/30 text-amber-300' },
  ] as const

  let content

  if (isLoading) {
    content = (
      <div className="space-y-3">
        <DashboardCardSkeleton count={3} variant="full" onClick={onSkeletonClick} />
        {loadingMessage ? <p className="text-center text-sm italic text-[#6b687a] dark:text-gray-400">{loadingMessage}</p> : null}
      </div>
    )
  } else if (loadError) {
    content = (
      <ErrorStatePanel
        title="Couldn't load your missions"
        body="Something went wrong while loading your data. Please check your connection and try again."
        onRetry={onRetry}
        backHref="/dashboard/founder"
      />
    )
  } else if (missions.length === 0) {
    content = (
      <EmptyStatePanel
        buttonLabel="CREATE YOUR FIRST MISSION ->"
        icon={<ClipboardList className="h-16 w-16 text-[#9b98a8] dark:text-gray-400" />}
        onPrimaryAction={() => router.push('/mission/wizard')}
      />
    )
  } else {
    content = (
      <div className="space-y-4">
        {recentMissions.map((mission) => (
          <RecentMissionCard key={mission.id} mission={mission} href={getDashboardMissionHref(mission)} />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-card border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <Coins className="h-5 w-5" />
            </div>
            <div className="rounded-full bg-primary/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary">
              Wallet
            </div>
          </div>
          <div className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-text-muted">COIN BALANCE</div>
          <div className="text-3xl font-black text-white">
            {isBalanceLoading ? (
              <span className="inline-block h-8 w-14 animate-pulse rounded-xl bg-surface-elevated" />
            ) : (
              formatCoins(coinBalance)
            )}
          </div>
        </div>
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
        className="rounded-panel border border-border-subtle bg-surface p-4 sm:p-6"
      >
        <div className="mb-6">
          <div>
            <div className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-text-muted">Mission Pulse</div>
            <h2 className="mt-2 text-2xl font-black text-white">Recent Missions</h2>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">A quick look at your three most recent missions.</p>
          </div>
        </div>

        {content}

        {!isLoading && !loadError ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/mission/wizard" className={`px-6 py-3 text-base ${primaryButtonClass}`}>
              + Initialize New Node
            </Link>
            <button
              type="button"
              className="text-sm font-bold text-text-muted transition-colors hover:text-text-main hover:underline"
              onClick={onViewAllMissions}
            >
              View all missions
            </button>
          </div>
        ) : null}
      </section>
    </>
  )
}
