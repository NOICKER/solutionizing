"use client"

import { ClipboardList, Coins } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ApiMission } from '@/types/api'
import {
  DashboardCardSkeleton,
  EmptyStatePanel,
  ErrorStatePanel,
  MissionHealthScoreBadge,
  MissionStatusBadge,
  RetestCountChip,
  SpinnerIcon,
  clampPercent,
  formatCoins,
} from '@/components/solutionizing/ui'

type MissionPulseFilter = 'active' | 'completed' | 'drafts'

function getMissionRecencyTimestamp(mission: ApiMission) {
  const timestamp = Date.parse(mission.completedAt ?? mission.updatedAt ?? mission.createdAt)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function getMissionStartTimestamp(mission: ApiMission) {
  const timestamp = Date.parse(mission.createdAt)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function formatMissionDate(value: string | null | undefined) {
  if (!value) {
    return 'Not completed yet'
  }

  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    return 'Date unavailable'
  }

  return format(new Date(timestamp), 'MMM d, yyyy')
}

function getDashboardMissionHref(mission: ApiMission) {
  if (mission.status === 'COMPLETED') {
    return `/mission/insights/${mission.id}`
  }

  if (mission.status === 'DRAFT' || mission.status === 'REJECTED') {
    return `/mission/wizard?edit=true&missionId=${mission.id}`
  }

  if (mission.status === 'APPROVED') {
    return `/mission/status/${mission.id}`
  }

  return `/mission/status/${mission.id}`
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
  void className
  return (
    <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '8px',
          background: 'var(--electric-dim)', border: '1px solid var(--electric-mid)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'DM Mono, monospace', fontSize: '0.8rem', fontWeight: 600, color: 'var(--electric)',
        }}>
          {glyph}
        </div>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', color: 'var(--electric)', letterSpacing: '0.08em', background: 'var(--electric-dim)', padding: '0.2rem 0.6rem', borderRadius: '100px' }}>
          LIVE
        </span>
      </div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--ink-soft)', letterSpacing: '0.12em', marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: '2.2rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
        {isLoading ? <span style={{ display: 'inline-block', height: '2rem', width: '3rem', background: 'var(--bg)', borderRadius: '4px' }} /> : value}
      </div>
    </div>
  )
}

function RecentMissionCard({
  mission,
  href,
  isLaunching,
  onLaunchMission,
}: {
  mission: ApiMission
  href: string | null
  isLaunching: boolean
  onLaunchMission: (mission: ApiMission) => void
}) {
  const progress = clampPercent((mission.testersCompleted / Math.max(mission.testersRequired, 1)) * 100)
  const isApproved = mission.status === 'APPROVED'

  const content = (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>{mission.title}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '0.4rem' }}>
          <MissionStatusBadge status={mission.status} />
          <MissionHealthScoreBadge score={mission.healthScore} />
          {mission.status === 'COMPLETED' && (mission.retests?.length ?? 0) > 0 ? <RetestCountChip count={mission.retests!.length} /> : null}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
          <span>{mission.testersCompleted} of {mission.testersRequired} testers</span>
          <span style={{ color: 'var(--electric)' }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ background: 'var(--bg)', height: '4px', borderRadius: '100px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, background: 'var(--electric)', height: '4px', borderRadius: '100px' }} />
        </div>
      </div>

      {isApproved ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          <button className="cursor-none"
            type="button"
            disabled={isLaunching}
            onClick={() => onLaunchMission(mission)}
            style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.55rem 1.2rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.82rem', cursor: 'none', opacity: isLaunching ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {isLaunching ? <SpinnerIcon /> : null}
            Launch Mission
          </button>
          {href ? <Link className="cursor-none" href={href} style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: 'var(--electric)' }}>VIEW {'->'}</Link> : null}
        </div>
      ) : href ? (
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: 'var(--electric)' }}>View {'->'}</div>
      ) : (
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: 'var(--electric)' }}>Ready to launch from Mission Control</div>
      )}
    </>
  )

  const cardStyle = { background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem', cursor: href ? 'none' : undefined } as const

  if (!href || isApproved) {
    return <div style={cardStyle}>{content}</div>
  }

  return (
    <Link className="cursor-none" href={href} aria-label={`Open ${mission.title}`} style={{ ...cardStyle, display: 'block', textDecoration: 'none', transition: 'border-color 0.2s' }}>
      {content}
    </Link>
  )
}

function EmptyMissionPulseState({ filter }: { filter: MissionPulseFilter }) {
  const router = useRouter()
  
  let title = ''
  let description = ''
  let showButton = false
  
  if (filter === 'active') {
    title = 'no active missions right now.'
    description = 'Start a fresh mission to gather insights.'
    showButton = true
  } else if (filter === 'completed') {
    title = 'no completed missions yet.'
    description = 'Completed missions stay here once testers finish the full run.'
  } else {
    title = 'no drafts yet.'
    description = 'Saved missions will appear here until you launch them.'
  }

  return (
    <div style={{ background: 'var(--bg-light)', border: '1px dashed var(--border-strong)', borderRadius: '12px', padding: '2.5rem', textAlign: 'center' }}>
      <ClipboardList style={{ width: 40, height: 40, color: 'var(--ink-soft)', margin: '0 auto 1rem' }} />
      <h3 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.2rem', color: 'var(--ink)', fontWeight: 400, marginBottom: '0.5rem' }}>
        {title}
      </h3>
      <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.88rem', color: 'var(--ink-soft)', maxWidth: '32rem', margin: '0 auto 1.5rem' }}>
        {description}
      </p>
      {showButton ? (
        <button className="cursor-none" type="button" onClick={() => router.push('/mission/wizard')} style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.65rem 1.4rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.88rem', cursor: 'none' }}>
          + new mission
        </button>
      ) : null}
    </div>
  )
}

function ProductJourneySection({ missions }: { missions: ApiMission[] }) {
  const journeyMissions = useMemo(
    () =>
      [...missions].sort(
        (leftMission, rightMission) =>
          getMissionStartTimestamp(leftMission) - getMissionStartTimestamp(rightMission)
      ),
    [missions]
  )

  if (journeyMissions.length === 0) {
    return null
  }

  return (
    <section style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem 2rem', marginTop: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--electric)', letterSpacing: '0.12em' }}>JOURNEY MAP</div>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.3rem', color: 'var(--ink)', fontWeight: 400, marginTop: '0.35rem' }}>product journey.</h2>
        <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '0.4rem' }}>
          {`${journeyMissions.length} missions run - Started ${formatMissionDate(journeyMissions[0].createdAt)}`}
        </p>
      </div>

      <div>
        {journeyMissions.map((mission, index) => {
          const isRetest = Boolean(mission.parentMissionId)

          return (
            <div key={mission.id} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.25rem minmax(0, 1fr)', gap: '1rem', paddingBottom: index < journeyMissions.length - 1 ? '1.2rem' : 0 }}>
              {index < journeyMissions.length - 1 ? <div style={{ position: 'absolute', top: 14, bottom: 0, left: 5, width: 2, background: 'var(--border-strong)' }} /> : null}
              <div style={{ position: 'relative', zIndex: 1, marginTop: 4, background: 'var(--cream)', border: '2px solid var(--electric)', borderRadius: '50%', width: 12, height: 12 }} />
              <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem' }}>
                {isRetest ? <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--electric)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>RETEST</div> : null}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>{mission.title}</h3>
                    <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--ink-soft)', marginTop: '0.25rem' }}>
                      {mission.completedAt ? `Completed ${formatMissionDate(mission.completedAt)}` : 'Not completed yet'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <MissionHealthScoreBadge score={mission.healthScore} />
                    <MissionStatusBadge status={mission.status} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

interface FounderDashboardTabProps {
  isLoading: boolean
  loadError: string
  missions: ApiMission[]
  coinBalance: number
  isBalanceLoading?: boolean
  loadingMessage?: string
  actionLoading: { missionId: string; action: string } | null
  onSkeletonClick?: () => void
  onRetry: () => void
  onLaunchMission: (mission: ApiMission) => void
  onViewAllMissions: () => void
}

export function FounderDashboardTab({
  isLoading,
  loadError,
  missions,
  coinBalance,
  isBalanceLoading,
  loadingMessage,
  actionLoading,
  onSkeletonClick,
  onRetry,
  onLaunchMission,
  onViewAllMissions,
}: FounderDashboardTabProps) {
  const router = useRouter()
  const [missionPulseFilter, setMissionPulseFilter] = useState<MissionPulseFilter>('active')

  const missionStats = useMemo(
    () => ({
      active: missions.filter((mission) => mission.status === 'ACTIVE').length,
      total: missions.length,
      completed: missions.filter((mission) => mission.status === 'COMPLETED').length,
      drafts: missions.filter((mission) => mission.status === 'DRAFT').length,
    }),
    [missions]
  )

  const activeMissions = useMemo(
    () =>
      [...missions]
        .filter((mission) => ['PENDING_REVIEW', 'APPROVED', 'ACTIVE'].includes(mission.status))
        .sort((leftMission, rightMission) => getMissionRecencyTimestamp(rightMission) - getMissionRecencyTimestamp(leftMission))
        .slice(0, 3),
    [missions]
  )

  const completedMissions = useMemo(
    () =>
      [...missions]
        .filter((mission) => mission.status === 'COMPLETED')
        .sort((leftMission, rightMission) => getMissionRecencyTimestamp(rightMission) - getMissionRecencyTimestamp(leftMission))
        .slice(0, 3),
    [missions]
  )
  
  const draftMissions = useMemo(
    () =>
      [...missions]
        .filter((mission) => mission.status === 'DRAFT')
        .sort((leftMission, rightMission) => getMissionRecencyTimestamp(rightMission) - getMissionRecencyTimestamp(leftMission))
        .slice(0, 3),
    [missions]
  )

  const visiblePulseMissions = 
    missionPulseFilter === 'completed' ? completedMissions :
    missionPulseFilter === 'drafts' ? draftMissions :
    activeMissions

  const missionStatsCounts = useMemo(() => ({
    active: missions.filter(m => ['PENDING_REVIEW', 'APPROVED', 'ACTIVE'].includes(m.status)).length,
    completed: missions.filter(m => m.status === 'COMPLETED').length,
    drafts: missions.filter(m => m.status === 'DRAFT').length
  }), [missions])

  const statsCards = [
    { label: 'ACTIVE MISSIONS', value: missionStats.active, glyph: 'A', className: 'bg-[rgba(74,197,128,0.12)] text-[#1e7a47]' },
    { label: 'TOTAL MISSIONS', value: missionStats.total, glyph: 'T', className: 'bg-[var(--electric-dim)] text-[var(--electric)]' },
    { label: 'COMPLETED', value: missionStats.completed, glyph: 'C', className: 'bg-[rgba(56,189,248,0.12)] text-[#0369a1]' },
    { label: 'DRAFTS', value: missionStats.drafts, glyph: 'D', className: 'bg-[rgba(251,191,36,0.12)] text-[#92400e]' },
  ] as const

  let content

  if (isLoading) {
    content = (
      <div className="space-y-3">
        <DashboardCardSkeleton count={3} variant="full" onClick={onSkeletonClick} />
        {loadingMessage ? <p className="text-center text-sm italic text-[var(--ink-soft)]">{loadingMessage}</p> : null}
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
        icon={<ClipboardList className="h-16 w-16 text-[var(--ink-soft)]" />}
        onPrimaryAction={() => router.push('/mission/wizard')}
      />
    )
  } else if (visiblePulseMissions.length === 0) {
    content = <EmptyMissionPulseState filter={missionPulseFilter} />
  } else {
    content = (
      <div className="space-y-4">
        {visiblePulseMissions.map((mission) => (
          <RecentMissionCard
            key={mission.id}
            mission={mission}
            href={getDashboardMissionHref(mission)}
            isLaunching={actionLoading?.missionId === mission.id && actionLoading.action === 'launch'}
            onLaunchMission={onLaunchMission}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="animate-[tabEnter_0.22s_ease_forwards]">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--cream)', border: '1px solid var(--electric-mid)', borderRadius: '12px', padding: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--electric-dim)', border: '1px solid var(--electric-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--electric)' }}>
              <Coins className="h-5 w-5" />
            </div>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', color: 'var(--electric)', letterSpacing: '0.08em', background: 'var(--electric-dim)', padding: '0.2rem 0.6rem', borderRadius: '100px' }}>WALLET</span>
          </div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--ink-soft)', letterSpacing: '0.12em', marginBottom: '0.4rem' }}>COIN BALANCE</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '2.2rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
            {isBalanceLoading ? <span style={{ display: 'inline-block', height: '2rem', width: '3rem', background: 'var(--bg)', borderRadius: '4px' }} /> : formatCoins(coinBalance)}
          </div>
        </div>
        {statsCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} glyph={card.glyph} className={card.className} isLoading={isLoading} />
        ))}
      </div>

      <section id="missions-section" style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <button
            type="button"
            className="cursor-none"
            onClick={() => setMissionPulseFilter('active')}
            style={{ 
              background: 'none', border: 'none', cursor: 'none', 
              fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.95rem', 
              padding: '0.75rem 0.5rem', position: 'relative',
              color: missionPulseFilter === 'active' ? 'var(--electric)' : 'var(--ink-soft)'
            }}
          >
            Active ({missionStatsCounts.active})
            {missionPulseFilter === 'active' && (
              <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: 'var(--electric)' }} />
            )}
          </button>
          
          <button
            type="button"
            className="cursor-none"
            onClick={() => setMissionPulseFilter('completed')}
            style={{ 
              background: 'none', border: 'none', cursor: 'none', 
              fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.95rem', 
              padding: '0.75rem 0.5rem', position: 'relative',
              color: missionPulseFilter === 'completed' ? 'var(--electric)' : 'var(--ink-soft)'
            }}
          >
            Completed ({missionStatsCounts.completed})
            {missionPulseFilter === 'completed' && (
              <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: 'var(--electric)' }} />
            )}
          </button>
          
          <button
            type="button"
            className="cursor-none"
            onClick={() => setMissionPulseFilter('drafts')}
            style={{ 
              background: 'none', border: 'none', cursor: 'none', 
              fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.95rem', 
              padding: '0.75rem 0.5rem', position: 'relative',
              color: missionPulseFilter === 'drafts' ? 'var(--electric)' : 'var(--ink-soft)'
            }}
          >
            Drafts ({missionStatsCounts.drafts})
            {missionPulseFilter === 'drafts' && (
              <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: 'var(--electric)' }} />
            )}
          </button>
        </div>

        {content}

        {!isLoading && !loadError ? (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link className="cursor-none" href="/mission/wizard" style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.65rem 1.4rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.88rem', cursor: 'none', textDecoration: 'none' }}>
              + New Mission
            </Link>
            <button className="cursor-none" type="button" style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: 'var(--ink-soft)', background: 'none', border: 'none', cursor: 'none' }} onClick={onViewAllMissions}>
              View all missions
            </button>
          </div>
        ) : null}
      </section>

      {!isLoading && !loadError && missions.length > 0 ? <ProductJourneySection missions={missions} /> : null}
    </div>
  )
}
