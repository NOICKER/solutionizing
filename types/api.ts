export type ReputationTier = 'NEWCOMER' | 'RELIABLE' | 'TRUSTED' | 'ELITE'
export type MissionStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'REJECTED'
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type AssignmentStatus =
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ABANDONED'
  | 'TIMED_OUT'
  | 'MISSION_FULL'
export type QuestionType =
  | 'TEXT_SHORT'
  | 'TEXT_LONG'
  | 'RATING_1_5'
  | 'MULTIPLE_CHOICE'
  | 'YES_NO'
export type BackendAssetType = 'LINK' | 'SCREENSHOT' | 'TEXT_DESCRIPTION' | 'SHORT_VIDEO'
export type WizardAssetType = 'LINK' | 'SCREENSHOT' | 'VIDEO' | 'TEXT'

export interface ApiMissionAsset {
  id?: string
  type: BackendAssetType
  url: string
  label: string | null
  order: number
}

export interface ApiMissionQuestion {
  id: string
  order: number
  type: QuestionType
  text: string
  options: string[]
  isRequired: boolean
}

export interface ApiMission {
  id: string
  title: string
  goal: string
  difficulty: Difficulty
  estimatedMinutes: number
  testersRequired: number
  testersAssigned: number
  testersCompleted: number
  minRepTier: ReputationTier
  coinPerTester: number
  coinPlatformFee: number
  coinCostTotal: number
  status: MissionStatus
  reviewNote: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  launchedAt: string | null
  completedAt: string | null
  pausedAt: string | null
  reportCount: number
  createdAt: string
  updatedAt: string
  assets: ApiMissionAsset[]
  questions: ApiMissionQuestion[]
}

export interface ApiMissionDetail extends ApiMission {
  assignmentCounts?: Partial<Record<AssignmentStatus, number>>
  completedAssignments?: Array<{ id: string, rating: { id: string } | null }>
}

export interface ApiTesterAssignmentSummary {
  id: string
  missionId: string
  testerId: string
  status: AssignmentStatus
  assignedAt: string
  startedAt: string | null
  completedAt: string | null
  abandonedAt: string | null
  timedOutAt: string | null
  timeoutAt: string
  coinsEarned: number
  mission: {
    title: string
    goal: string
    estimatedMinutes: number
    coinPerTester: number
  }
}

export interface ApiTesterAssignmentDetail {
  id: string
  missionId: string
  testerId: string
  status: AssignmentStatus
  assignedAt: string
  startedAt: string | null
  completedAt: string | null
  abandonedAt: string | null
  timedOutAt: string | null
  timeoutAt: string
  coinsEarned: number
  mission: ApiMission
}

export interface ApiTesterStats {
  coinBalance: number
  reputationScore: number
  reputationTier: ReputationTier
  totalCompleted: number
  totalAbandoned: number
  completionRate: number
  avgRating: number | null
  recentActivity: Array<{
    id: string
    missionId: string
    completedAt: string
    coinsEarned: number
    mission: {
      title: string
    }
  }>
}

export type ApiFeedbackQuestion =
  | {
      questionId: string
      order: number
      text: string
      type: 'RATING_1_5'
      responseCount: number
      averageRating: number | null
      distribution: Array<{
        rating: number
        count: number
        percentage: number
      }>
    }
  | {
      questionId: string
      order: number
      text: string
      type: 'MULTIPLE_CHOICE' | 'YES_NO'
      responseCount: number
      breakdown: Array<{
        option: string
        count: number
        percentage: number
      }>
    }
  | {
      questionId: string
      order: number
      text: string
      type: 'TEXT_SHORT' | 'TEXT_LONG'
      responseCount: number
      sampleResponses: string[]
      allResponses: string[]
    }

export interface ApiMissionFeedback {
  summary: {
    completedCount: number
    clarityScore: number | null
    recommendationLikelihood: number | null
    representativeQuote: string | null
  }
  byQuestion: ApiFeedbackQuestion[]
  timingMetrics: {
    avgCompletionSeconds: number | null
  } | null
}

export interface WizardAsset {
  type: WizardAssetType
  url?: string
  text?: string
  label?: string
}

export interface WizardQuestion {
  text: string
  type: QuestionType
  required: boolean
  options?: string[]
  order: number
}
