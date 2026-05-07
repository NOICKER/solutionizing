import { format } from 'date-fns'
import type { ApiMission, MissionStatus } from '@/types/api'

type LifecycleTimestampKey = 'reviewedAt' | 'launchedAt' | 'completedAt'

interface LifecycleStage {
  status: Extract<MissionStatus, 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'ACTIVE' | 'COMPLETED'>
  label: string
  timestampKey?: LifecycleTimestampKey
  timestampLabel?: string
}

type MissionLifecycleTrackerMission = Pick<
  ApiMission,
  'status' | 'reviewedAt' | 'launchedAt' | 'completedAt'
>

const lifecycleStages: LifecycleStage[] = [
  { status: 'DRAFT', label: 'Draft' },
  { status: 'PENDING_REVIEW', label: 'Pending Review' },
  { status: 'APPROVED', label: 'Approved', timestampKey: 'reviewedAt', timestampLabel: 'Reviewed' },
  { status: 'ACTIVE', label: 'Active', timestampKey: 'launchedAt', timestampLabel: 'Launched' },
  { status: 'COMPLETED', label: 'Completed', timestampKey: 'completedAt', timestampLabel: 'Completed' },
]

const statusToneMap: Record<MissionStatus, string> = {
  DRAFT: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
  PENDING_REVIEW: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  APPROVED: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  ACTIVE: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  PAUSED: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  COMPLETED: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  REJECTED: 'border-red-500/30 bg-red-500/10 text-red-300',
}

const stageStateToneMap = {
  complete: {
    card: 'border-emerald-500/25 bg-emerald-500/10 dark:bg-emerald-500/10',
    marker: 'bg-emerald-500 text-white',
    pill: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    label: 'Complete',
  },
  current: {
    card: 'border-[#d77a57]/50 bg-[#d77a57]/10 dark:bg-[#d77a57]/12',
    marker: 'bg-[#d77a57] text-white shadow-[0_10px_25px_-14px_rgba(215,122,87,0.8)]',
    pill: 'border-[#d77a57]/35 bg-[#d77a57]/10 text-[#b85c3a] dark:text-[#f0a98c]',
    label: 'Current',
  },
  upcoming: {
    card: 'border-[#ece6df] bg-white/70 dark:border-gray-700 dark:bg-gray-900/40',
    marker: 'bg-[#f4eee8] text-[#8b8797] dark:bg-gray-700 dark:text-gray-300',
    pill: 'border-[#ece6df] bg-[#faf9f7] text-[#8b8797] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
    label: 'Upcoming',
  },
} as const

function formatMissionStatus(status: MissionStatus) {
  if (status === 'PENDING_REVIEW') return 'Pending Review'
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getLifecycleIndex(status: MissionStatus) {
  if (status === 'PAUSED') return lifecycleStages.findIndex((stage) => stage.status === 'ACTIVE')
  if (status === 'REJECTED') return lifecycleStages.findIndex((stage) => stage.status === 'PENDING_REVIEW')

  const stageIndex = lifecycleStages.findIndex((stage) => stage.status === status)
  return Math.max(stageIndex, 0)
}

function getTimestampLabel(mission: MissionLifecycleTrackerMission, stage: LifecycleStage) {
  if (!stage.timestampKey || !stage.timestampLabel) return 'Timestamp appears when this stage is reached'

  const timestamp = mission[stage.timestampKey]
  if (!timestamp) return 'Timestamp pending'

  const parsedDate = new Date(timestamp)
  if (Number.isNaN(parsedDate.getTime())) return 'Timestamp unavailable'

  return `${stage.timestampLabel} ${format(parsedDate, 'MMM d, yyyy h:mm a')}`
}

export function MissionLifecycleTracker({ mission }: { mission: MissionLifecycleTrackerMission }) {
  const currentIndex = getLifecycleIndex(mission.status)
  const progressPercent = (currentIndex / (lifecycleStages.length - 1)) * 100

  return (
    <section className="overflow-hidden rounded-panel border border-[#ece6df] bg-white/85 p-5 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.24)] backdrop-blur-xl dark:border-gray-700 dark:bg-gray-800/90 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1a1625] dark:text-white">Mission lifecycle</h2>
          <p className="mt-1 text-sm font-medium text-[#6b687a] dark:text-gray-400">
            Track the founder workflow from draft through completion.
          </p>
        </div>

        <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${statusToneMap[mission.status]}`}>
          {formatMissionStatus(mission.status)}
        </span>
      </div>

      <div className="mt-6">
        <div className="h-2 overflow-hidden rounded-full bg-[#ede7e2] dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#d77a57] via-amber-400 to-emerald-400 transition-[width] duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-5 overflow-x-auto pb-1">
          <div className="grid min-w-[760px] grid-cols-5 gap-3">
            {lifecycleStages.map((stage, index) => {
              const state = index < currentIndex || mission.status === 'COMPLETED'
                ? 'complete'
                : index === currentIndex
                  ? 'current'
                  : 'upcoming'
              const tone = stageStateToneMap[state]

              return (
                <div key={stage.status} className={`rounded-2xl border p-4 ${tone.card}`}>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${tone.marker}`}>
                      {state === 'complete' ? 'OK' : index + 1}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[0.7rem] font-bold ${tone.pill}`}>
                      {tone.label}
                    </span>
                  </div>

                  <div className="text-sm font-black text-[#1a1625] dark:text-white">{stage.label}</div>
                  <p className="mt-2 min-h-10 text-xs font-medium leading-5 text-[#6b687a] dark:text-gray-400">
                    {getTimestampLabel(mission, stage)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
