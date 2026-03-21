"use client"

import { ClipboardList } from 'lucide-react'
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
  primaryButtonClass,
} from '@/components/solutionizing/ui'
import { WelcomeBanner } from '@/components/solutionizing/shared/WelcomeBanner'

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
    <div className="rounded-card border border-[#ece6df] bg-white/95 p-5 shadow-[0_20px_60px_-42px_rgba(26,22,37,0.28)] dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <DashboardGlyphChip className={className}>{glyph}</DashboardGlyphChip>
        <div className="rounded-full bg-[#faf5f0] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#9b98a8] dark:bg-gray-900 dark:text-gray-400">
          Live
        </div>
      </div>
      <div className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#9b98a8] dark:text-gray-400">{label}</div>
      <div className="text-3xl font-black text-[#1a1625] dark:text-white">
        {isLoading ? <span className="inline-block h-8 w-14 animate-pulse rounded-xl bg-[#f1ebe5] dark:bg-gray-700" /> : value}
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
    <div className="rounded-card border border-[#e5e4e0] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(26,22,37,0.18)] dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="text-lg font-black text-[#1a1625] dark:text-white">{mission.title}</h3>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <MissionStatusBadge status={mission.status} />
          {mission.status === 'COMPLETED' && (mission.retests?.length ?? 0) > 0 ? (
            <RetestCountChip count={mission.retests!.length} />
          ) : null}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-[#6b687a] dark:text-gray-400">
            {mission.testersCompleted} of {mission.testersRequired} testers
          </span>
          <span className="font-bold text-[#1a1625] dark:text-white">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#d77a57] to-[#c4673f]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Link href={href} className="text-sm font-bold text-[#d77a57] transition-colors hover:text-[#c4673f] hover:underline">
        View
      </Link>
    </div>
  )
}

interface FounderDashboardTabProps {
  isLoading: boolean
  loadError: string
  missions: ApiMission[]
  onRetry: () => void
  onViewAllMissions: () => void
}

export function FounderDashboardTab({
  isLoading,
  loadError,
  missions,
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
    { label: 'ACTIVE MISSIONS', value: missionStats.active, glyph: 'A', className: 'bg-emerald-50 text-emerald-600' },
    { label: 'TOTAL MISSIONS', value: missionStats.total, glyph: 'T', className: 'bg-[#faf1eb] text-[#d77a57]' },
    { label: 'COMPLETED', value: missionStats.completed, glyph: 'C', className: 'bg-sky-50 text-sky-600' },
    { label: 'DRAFTS', value: missionStats.drafts, glyph: 'D', className: 'bg-amber-50 text-amber-600' },
  ] as const

  let content

  if (isLoading) {
    content = <DashboardCardSkeleton count={3} variant="full" />
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
      <WelcomeBanner />

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
        className="rounded-panel border border-[#ece6df] bg-white/80 p-4 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.26)] dark:border-gray-700 dark:bg-gray-800/90 sm:p-6"
      >
        <div className="mb-6">
          <div>
            <div className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#9b98a8] dark:text-gray-400">Recent activity</div>
            <h2 className="mt-2 text-2xl font-black text-[#1a1625] dark:text-white">Recent Missions</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#6b687a] dark:text-gray-400">A quick look at your three most recent missions.</p>
          </div>
        </div>

        {content}

        {!isLoading && !loadError ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-[#ece6df] pt-6 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/mission/wizard" className={`px-6 py-3 text-base ${primaryButtonClass}`}>
              + CREATE NEW MISSION
            </Link>
            <button
              type="button"
              className="text-sm font-bold text-[#6b687a] transition-colors hover:text-[#1a1625] hover:underline dark:text-gray-400 dark:hover:text-white"
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
