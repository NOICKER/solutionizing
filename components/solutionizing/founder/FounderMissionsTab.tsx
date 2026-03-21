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
        buttonLabel="CREATE YOUR FIRST MISSION ->"
        icon={<ClipboardList className="h-16 w-16 text-[#9b98a8] dark:text-gray-400" />}
        onPrimaryAction={() => router.push('/mission/wizard')}
      />
    )
  } else {
    content = (
      <div className="space-y-4">
        {missions.map((mission) => {
          const progress = clampPercent((mission.testersCompleted / Math.max(mission.testersRequired, 1)) * 100)
          const isSubmitting = actionLoading?.missionId === mission.id && actionLoading.action === 'submit'
          const isResuming = actionLoading?.missionId === mission.id && actionLoading.action === 'resume'
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
              className={`rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800 ${isCardClickable ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`}
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
                  <h3 className="mb-1 text-lg font-black text-[#1a1625] dark:text-white">{mission.title}</h3>
                  {mission.status !== 'PENDING_REVIEW' ? <p className="text-sm text-[#6b687a] dark:text-gray-400">{mission.goal}</p> : null}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <MissionStatusBadge status={mission.status} />
                  {mission.status === 'COMPLETED' && (mission.retests?.length ?? 0) > 0 ? (
                    <RetestCountChip count={mission.retests!.length} />
                  ) : null}
                </div>
              </div>

              {mission.status === 'PENDING_REVIEW' ? (
                <p className="text-sm text-[#9b98a8] dark:text-gray-400">Under review - usually within 24 hours</p>
              ) : null}

              {mission.status !== 'PENDING_REVIEW' ? (
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
              ) : null}

              {mission.status === 'DRAFT' ? (
                <div className="flex items-center gap-3">
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
                      onOpenDialog('pause', mission)
                    }}
                  >
                    PAUSE
                  </button>
                  <button
                    className="ml-auto text-sm font-semibold text-red-600 hover:underline"
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
                  <div className="flex items-center gap-3">
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
                      className="ml-auto text-sm font-semibold text-red-600 hover:underline"
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
                    <p className="text-sm text-[#9b98a8] dark:text-gray-400">Completed {format(new Date(mission.completedAt), 'MMM d, yyyy')}</p>
                  ) : null}
                </div>
              ) : null}

              {mission.status === 'REJECTED' ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/70 dark:bg-red-950/40">
                    <h4 className="mb-1 text-sm font-bold text-red-900">Feedback from our team</h4>
                    <p className="text-sm text-red-800">{mission.reviewNote ?? 'Your mission needs changes before it can go live.'}</p>
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
      className="rounded-[1.9rem] border border-[#ece6df] bg-white/80 p-4 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.26)] dark:border-gray-700 dark:bg-gray-800/90 sm:p-6"
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#9b98a8] dark:text-gray-400">Mission overview</div>
          <h2 className="mt-2 text-2xl font-black text-[#1a1625] dark:text-white">Your Missions</h2>
        </div>
        <Link href="/mission/wizard" className={`px-6 py-3 text-base ${primaryButtonClass}`}>
          + CREATE NEW MISSION
        </Link>
      </div>

      {content}
    </section>
  )
}
