"use client"

import { ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ApiMission } from '@/types/api'
import {
  DashboardCardSkeleton,
  EmptyStatePanel,
  ErrorStatePanel,
  MissionStatusBadge,
  RetestCountChip,
  SpinnerIcon,
  clampPercent,
  mutedButtonClass,
  outlineButtonClass,
  primaryButtonClass,
} from '@/components/solutionizing/ui'

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
}: FounderMissionsTabProps) {
  const router = useRouter()

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
        icon={<ClipboardList className="h-16 w-16 text-text-muted" />}
        onPrimaryAction={() => router.push('/mission/wizard')}
      />
    )
  } else {
    content = (
      <div className="space-y-4">
        {missions.map((mission) => {
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
              className={`rounded-card border border-border-subtle bg-surface p-4 sm:p-5 ${isCardClickable ? 'cursor-pointer transition-all hover:border-primary/30 hover:bg-surface-elevated' : ''}`}
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
                  <h3 className="mb-1 text-lg font-black text-white">{mission.title}</h3>
                  {mission.status !== 'PENDING_REVIEW' ? <p className="text-sm text-text-muted">{mission.goal}</p> : null}
                </div>
                <div className="flex flex-wrap items-center sm:justify-end gap-2">
                  <MissionStatusBadge status={mission.status} />
                  {mission.status === 'COMPLETED' && (mission.retests?.length ?? 0) > 0 ? (
                    <RetestCountChip count={mission.retests!.length} />
                  ) : null}
                </div>
              </div>

              {mission.status === 'PENDING_REVIEW' ? (
                <p className="text-sm text-text-muted">Under review — usually within 24 hours</p>
              ) : null}

              {mission.status === 'APPROVED' ? (
                <div className="space-y-4">
                  <p className="text-sm text-text-muted">
                    Approved and ready to launch. Once you launch, tester assignment begins immediately.
                  </p>
                  <button
                    className={`flex items-center gap-2 px-6 py-2 text-sm ${primaryButtonClass}`}
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
              ) : null}

              {mission.status === 'DRAFT' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/mission/wizard?edit=true&missionId=${mission.id}`}
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
                      onSubmitMission(mission)
                    }}
                  >
                    {isSubmitting ? <SpinnerIcon /> : null}
                    SUBMIT FOR REVIEW {'->'}
                  </button>
                </div>
              ) : null}

              {mission.status === 'ACTIVE' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/mission/status/${mission.id}`}
                    className={`px-4 py-2 text-sm ${outlineButtonClass}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    VIEW STATUS {'->'}
                  </Link>
                  <button
                    className={`px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${mutedButtonClass}`}
                    disabled={isAnyActionLoading}
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenDialog('pause', mission)
                    }}
                  >
                    PAUSE
                  </button>
                  <button
                    className="ml-auto text-sm font-semibold text-red-400 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/mission/status/${mission.id}`}
                      className={`px-4 py-2 text-sm ${outlineButtonClass}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      VIEW STATUS {'->'}
                    </Link>
                    <button
                      className={`flex items-center gap-2 px-4 py-2 text-sm ${primaryButtonClass}`}
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
                      className="ml-auto text-sm font-semibold text-red-400 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="space-y-3">
                  <Link
                    href={`/mission/insights/${mission.id}`}
                    className={`inline-flex px-6 py-3 ${primaryButtonClass}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    VIEW INSIGHTS {'->'}
                  </Link>
                  {mission.completedAt ? (
                    <p className="text-sm text-text-muted">Completed {format(new Date(mission.completedAt), 'MMM d, yyyy')}</p>
                  ) : null}
                </div>
              ) : null}

              {mission.status === 'REJECTED' ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-4">
                    <h4 className="mb-1 text-sm font-bold text-red-300">Feedback from our team</h4>
                    <p className="text-sm text-red-400">{mission.rejectionReason ?? mission.reviewNote ?? 'Your mission needs changes before it can go live.'}</p>
                  </div>
                  <Link
                    href={`/mission/wizard?edit=true&missionId=${mission.id}`}
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

  return (
    <section
      id="missions-section"
      className="rounded-[1.9rem] border border-border-subtle bg-surface p-4 sm:p-5"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-text-muted">Mission Control</div>
          <h2 className="mt-2 text-2xl font-black text-white">Your Missions</h2>
        </div>
        <Link href="/mission/wizard" className={`px-6 py-3 text-base ${primaryButtonClass}`}>
          + Initialize New Node
        </Link>
      </div>

      {content}
    </section>
  )
}
