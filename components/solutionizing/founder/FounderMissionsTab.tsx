"use client"

import { ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useState } from 'react'
import { toast } from '@/components/ui/sonner'
import { ApiMission, MissionStatus } from '@/types/api'
import {
  DashboardCardSkeleton,
  EmptyStatePanel,
  ErrorStatePanel,
  MissionHealthScoreBadge,
  MissionStatusBadge,
  RetestCountChip,
  SpinnerIcon,
  clampPercent,
} from '@/components/solutionizing/ui'

type MissionFilterId = 'ALL' | Extract<MissionStatus, 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'PENDING_REVIEW' | 'COMPLETED' | 'REJECTED'>

const missionFilters: { id: MissionFilterId; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'PAUSED', label: 'Paused' },
  { id: 'PENDING_REVIEW', label: 'In Review' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'REJECTED', label: 'Rejected' },
]

function getMissionDestination(mission: ApiMission) {
  if (mission.status === 'COMPLETED') {
    return `/mission/insights/${mission.id}`
  }

  if (mission.status === 'ACTIVE' || mission.status === 'PENDING_REVIEW') {
    return `/mission/status/${mission.id}`
  }

  if (mission.status === 'DRAFT') {
    return `/mission/wizard?edit=true&missionId=${mission.id}`
  }

  if (mission.status === 'REJECTED') {
    return `/mission/safety-review/${mission.id}`
  }

  return null
}

interface FounderMissionsTabProps {
  missions: ApiMission[]
  isLoading: boolean
  loadError: string
  cardErrors: Record<string, string>
  actionLoading: { missionId: string; action: string } | null
  onRetry: () => void
  onSubmitMission: (mission: ApiMission) => void
  onLaunchMission: (mission: ApiMission) => void
  onResumeMission: (mission: ApiMission) => void
  onOpenDialog: (type: 'pause' | 'close', mission: ApiMission) => void
  onDeleteMission?: (missionId: string) => Promise<void>
}

export function FounderMissionsTab({
  missions,
  isLoading,
  loadError,
  cardErrors,
  actionLoading,
  onRetry,
  onSubmitMission,
  onLaunchMission,
  onResumeMission,
  onOpenDialog,
  onDeleteMission,
}: FounderMissionsTabProps) {
  const router = useRouter()
  const [selectedFilter, setSelectedFilter] = useState<MissionFilterId>('ALL')
  const [deletingMissionId, setDeletingMissionId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const selectedFilterLabel = missionFilters.find((filter) => filter.id === selectedFilter)?.label ?? 'All'
  const filteredMissions =
    selectedFilter === 'ALL' ? missions : missions.filter((mission) => mission.status === selectedFilter)

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
        buttonLabel="INITIALIZE FIRST NODE ->"
        icon={<ClipboardList className="h-16 w-16 text-[var(--ink-soft)]" />}
        onPrimaryAction={() => router.push('/mission/wizard')}
      />
    )
  } else if (filteredMissions.length === 0) {
    content = (
      <EmptyStatePanel
        title={`No ${selectedFilterLabel.toLowerCase()} missions`}
        description="Try another filter to see more missions."
        icon={<ClipboardList className="h-16 w-16 text-[var(--ink-soft)]" />}
      />
    )
  } else {
    content = (
      <div className="space-y-4">
        {filteredMissions.map((mission) => {
          const progress = clampPercent((mission.testersCompleted / Math.max(mission.testersRequired, 1)) * 100)
          const isSubmitting = actionLoading?.missionId === mission.id && actionLoading.action === 'submit'
          const isLaunching = actionLoading?.missionId === mission.id && actionLoading.action === 'launch'
          const isResuming = actionLoading?.missionId === mission.id && actionLoading.action === 'resume'
          const isAnyActionLoading = actionLoading?.missionId === mission.id
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
              className={`group block transition-all ${isCardClickable ? 'rounded-[12px] border border-[var(--border)] bg-[var(--bg-light)] p-4 sm:p-5 cursor-none hover:border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--electric-dim)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]' : 'rounded-[12px] border border-[var(--border)] bg-[var(--bg-light)] p-4 sm:p-5'}`}
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
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-[var(--ink)] transition-colors group-hover:text-[var(--electric)]">{mission.title}</h3>
                  {mission.status !== 'PENDING_REVIEW' ? <p className="text-sm text-[var(--ink-soft)]">{mission.goal}</p> : null}
                </div>
                <div className="flex flex-wrap items-center sm:justify-end gap-2">
                  <MissionStatusBadge status={mission.status} />
                  <MissionHealthScoreBadge score={mission.healthScore} />
                  {mission.status === 'COMPLETED' && (mission.retests?.length ?? 0) > 0 ? (
                    <RetestCountChip count={mission.retests!.length} />
                  ) : null}
                </div>
              </div>

              {mission.status === 'PENDING_REVIEW' ? (
                <p className="text-sm text-[var(--ink-soft)] mt-4">Under review — usually within 24 hours</p>
              ) : null}

              {mission.status === 'APPROVED' ? (
                <div className="space-y-4 mt-4">
                  <p className="text-sm text-[var(--ink-soft)]">Approved and ready to launch. Once you launch, tester assignment begins immediately.</p>
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--electric)] px-5 py-2.5 text-sm font-bold text-[var(--cream)] cursor-none disabled:opacity-70 transition-opacity hover:opacity-90"
                    disabled={isLaunching}
                    onClick={(event) => {
                      event.stopPropagation()
                      onLaunchMission(mission)
                    }}
                  >
                    {isLaunching ? <SpinnerIcon /> : null}
                    LAUNCH MISSION {'->'}
                  </button>
                </div>
              ) : null}

              {mission.status !== 'PENDING_REVIEW' && mission.status !== 'APPROVED' ? (
                <div className="mb-4 mt-4">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-[var(--ink-soft)]">
                      {mission.testersCompleted} of {mission.testersRequired} testers
                    </span>
                    <span className="font-bold text-[var(--ink)]">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--bg)]">
                    <div className="h-1 rounded-full bg-[var(--electric)] transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : null}

              {mission.status === 'DRAFT' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/mission/wizard?edit=true&missionId=${mission.id}`}
                    className="rounded-full border border-[var(--border-strong)] bg-transparent px-4 py-2.5 text-sm font-semibold text-[var(--ink)] cursor-none transition-colors hover:bg-[var(--bg-light)]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    EDIT
                  </Link>
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--electric)] px-5 py-2.5 text-sm font-bold text-[var(--cream)] cursor-none disabled:opacity-70 transition-opacity hover:opacity-90"
                    disabled={isSubmitting}
                    onClick={(event) => {
                      event.stopPropagation()
                      onSubmitMission(mission)
                    }}
                  >
                    {isSubmitting ? <SpinnerIcon /> : null}
                    SUBMIT FOR REVIEW {'->'}
                  </button>
                </div>
              ) : null}

              {mission.status === 'ACTIVE' ? (
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <Link
                    href={`/mission/status/${mission.id}`}
                    className="rounded-full border border-[var(--border-strong)] bg-transparent px-4 py-2.5 text-sm font-semibold text-[var(--ink)] cursor-none transition-colors hover:bg-[var(--bg-light)]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    VIEW STATUS {'->'}
                  </Link>
                  <button
                    className="rounded-full border border-[var(--border-strong)] bg-transparent px-4 py-2.5 text-sm font-semibold text-[var(--ink)] cursor-none transition-colors hover:bg-[var(--bg-light)]"
                    disabled={isAnyActionLoading}
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenDialog('pause', mission)
                    }}
                  >
                    PAUSE
                  </button>
                  <button
                    className="ml-auto text-sm font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.08em] text-[#c0392b] hover:underline disabled:opacity-50 cursor-none"
                    disabled={isAnyActionLoading}
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenDialog('close', mission)
                    }}
                  >
                    CLOSE
                  </button>
                </div>
              ) : null}

              {mission.status === 'PAUSED' ? (
                <div className="space-y-3 mt-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/mission/status/${mission.id}`}
                      className="rounded-full border border-[var(--border-strong)] bg-transparent px-4 py-2.5 text-sm font-semibold text-[var(--ink)] cursor-none transition-colors hover:bg-[var(--bg-light)]"
                      onClick={(event) => event.stopPropagation()}
                    >
                      VIEW STATUS {'->'}
                    </Link>
                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--electric)] px-5 py-2.5 text-sm font-bold text-[var(--cream)] cursor-none disabled:opacity-70 transition-opacity hover:opacity-90"
                      disabled={isResuming}
                      onClick={(event) => {
                        event.stopPropagation()
                        onResumeMission(mission)
                      }}
                    >
                      {isResuming ? <SpinnerIcon /> : null}
                      RESUME
                    </button>
                    <button
                      className="ml-auto text-sm font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.08em] text-[#c0392b] hover:underline disabled:opacity-50 cursor-none"
                      disabled={isAnyActionLoading}
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenDialog('close', mission)
                      }}
                    >
                      CLOSE
                    </button>
                  </div>
                </div>
              ) : null}

              {mission.status === 'COMPLETED' ? (
                <div className="space-y-3 mt-4">
                  <Link
                    href={`/mission/insights/${mission.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--electric)] px-5 py-2.5 text-sm font-bold text-[var(--cream)] cursor-none transition-opacity hover:opacity-90"
                    onClick={(event) => event.stopPropagation()}
                  >
                    VIEW INSIGHTS {'->'}
                  </Link>
                  {mission.completedAt ? (
                    <p className="text-xs font-[family-name:var(--font-dm-mono)] text-[var(--ink-soft)] mt-2">Completed {format(new Date(mission.completedAt), 'MMM d, yyyy')}</p>
                  ) : null}
                </div>
              ) : null}

              {mission.status === 'REJECTED' ? (
                <div className="space-y-4 mt-4">
                  <div className="rounded-[10px] border border-[rgba(192,57,43,0.18)] bg-[rgba(192,57,43,0.04)] p-4">
                    <h4 className="mb-1 text-sm font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.08em] text-[#c0392b]">Feedback from our team</h4>
                    <p className="text-sm text-[var(--ink-soft)]">{mission.rejectionReason ?? mission.reviewNote ?? 'Your mission needs changes before it can go live.'}</p>
                  </div>
                  <Link
                    href={`/mission/wizard?edit=true&missionId=${mission.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--electric)] px-5 py-2.5 text-sm font-bold text-[var(--cream)] cursor-none transition-opacity hover:opacity-90"
                    onClick={(event) => event.stopPropagation()}
                  >
                    EDIT & RESUBMIT {'->'}
                  </Link>
                  {onDeleteMission && (
                    confirmDeleteId === mission.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--ink-soft)]">Are you sure?</span>
                        <button
                          type="button"
                          disabled={deletingMissionId === mission.id}
                          onClick={async (event) => {
                            event.stopPropagation()
                            setDeletingMissionId(mission.id)
                            try {
                              await onDeleteMission(mission.id)
                              toast.success('Mission deleted')
                            } catch {
                              toast.error('Failed to delete mission')
                            } finally {
                              setDeletingMissionId(null)
                              setConfirmDeleteId(null)
                            }
                          }}
                          className="rounded-full bg-[#c0392b] px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 cursor-none disabled:opacity-50"
                        >
                          {deletingMissionId === mission.id ? 'Deleting...' : 'Yes, delete'}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); setConfirmDeleteId(null) }}
                          className="rounded-full border border-[var(--border)] px-4 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--cream)] cursor-none"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); setConfirmDeleteId(mission.id) }}
                        className="text-sm font-semibold text-[#c0392b] hover:underline cursor-none"
                      >
                        Delete mission
                      </button>
                    )
                  )}
                </div>
              ) : null}

              {cardErrors[mission.id] ? <p className="mt-2 text-sm text-[#c0392b]">{cardErrors[mission.id]}</p> : null}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <section
      id="missions-section"
      className="rounded-[14px] border border-[var(--border)] bg-[var(--cream)] p-6 animate-[tabEnter_0.22s_ease_forwards]"
    >

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">MISSION CONTROL</div>
          <h2 className="text-2xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] mt-1">your missions.</h2>
        </div>
        <Link href="/mission/wizard" className="inline-flex items-center justify-center rounded-full bg-[var(--electric)] px-5 py-2.5 text-sm font-bold text-[var(--cream)] cursor-none hover:opacity-90 transition-opacity">+ New Mission</Link>
      </div>

      {!isLoading && !loadError && missions.length > 0 ? (
        <div className="mb-5 flex flex-wrap gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-2">
          {missionFilters.map((filter) => {
            const isActive = selectedFilter === filter.id

            return (
              <button
                key={filter.id}
                type="button"
                className={`cursor-none rounded-full px-4 py-1.5 text-[0.7rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-wide transition-colors ${
                  isActive
                    ? 'border border-[var(--electric)] bg-[var(--electric)] text-[var(--cream)]'
                    : 'border border-transparent text-[var(--ink-soft)] hover:bg-[var(--bg-light)] hover:text-[var(--ink)]'
                }`}
                onClick={() => setSelectedFilter(filter.id)}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      ) : null}

      {content}
    </section>
  )
}
