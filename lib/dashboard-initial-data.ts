import { AssignmentStatus, MissionStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { touchTesterPresence } from '@/lib/business/tester-availability'
import type { ApiMission, ApiTesterAssignmentSummary, ApiTesterStats } from '@/types/api'

export interface FounderDashboardInitialData {
  missions: ApiMission[]
  coinBalance: number
}

export interface TesterDashboardInitialData {
  stats: ApiTesterStats | null
  assignments: ApiTesterAssignmentSummary[]
}

const founderMissionInclude = {
  assets: { orderBy: { order: 'asc' as const } },
  questions: { orderBy: { order: 'asc' as const } },
  retests: {
    select: {
      id: true,
      title: true,
      completedAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.MissionInclude

const testerAssignmentSelect = {
  id: true,
  missionId: true,
  testerId: true,
  status: true,
  assignedAt: true,
  startedAt: true,
  completedAt: true,
  abandonedAt: true,
  timedOutAt: true,
  timeoutAt: true,
  coinsEarned: true,
  mission: {
    select: {
      title: true,
      goal: true,
      estimatedMinutes: true,
      coinPerTester: true,
    },
  },
} satisfies Prisma.MissionAssignmentSelect

const recentActivitySelect = {
  id: true,
  missionId: true,
  completedAt: true,
  coinsEarned: true,
  mission: {
    select: {
      title: true,
    },
  },
} satisfies Prisma.MissionAssignmentSelect

type FounderMissionRecord = Prisma.MissionGetPayload<{ include: typeof founderMissionInclude }>
type TesterAssignmentRecord = Prisma.MissionAssignmentGetPayload<{ select: typeof testerAssignmentSelect }>
type RecentActivityRecord = Prisma.MissionAssignmentGetPayload<{ select: typeof recentActivitySelect }>

function toIso(value: Date | null) {
  return value ? value.toISOString() : null
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100
}

function serializeMission(mission: FounderMissionRecord): ApiMission {
  return {
    id: mission.id,
    title: mission.title,
    goal: mission.goal,
    difficulty: mission.difficulty,
    estimatedMinutes: mission.estimatedMinutes,
    testersRequired: mission.testersRequired,
    testersAssigned: mission.testersAssigned,
    testersCompleted: mission.testersCompleted,
    minRepTier: mission.minRepTier,
    coinPerTester: mission.coinPerTester,
    coinPlatformFee: mission.coinPlatformFee,
    coinCostTotal: mission.coinCostTotal,
    status: mission.status,
    reviewNote: mission.reviewNote,
    rejectionReason: mission.rejectionReason,
    reviewedBy: mission.reviewedBy,
    reviewedAt: toIso(mission.reviewedAt),
    launchedAt: toIso(mission.launchedAt),
    completedAt: toIso(mission.completedAt),
    pausedAt: toIso(mission.pausedAt),
    reportCount: mission.reportCount,
    healthScore: mission.healthScore,
    createdAt: mission.createdAt.toISOString(),
    updatedAt: mission.updatedAt.toISOString(),
    parentMissionId: mission.parentMissionId,
    assets: mission.assets.map((asset) => ({
      id: asset.id,
      type: asset.type,
      url: asset.url,
      label: asset.label,
      order: asset.order,
    })),
    questions: mission.questions.map((question) => ({
      id: question.id,
      order: question.order,
      type: question.type,
      text: question.text,
      options: question.options,
      isRequired: question.isRequired,
    })),
    retests: mission.retests.map((retest) => ({
      id: retest.id,
      title: retest.title,
      completedAt: toIso(retest.completedAt),
    })),
  }
}

function serializeAssignment(assignment: TesterAssignmentRecord): ApiTesterAssignmentSummary {
  return {
    id: assignment.id,
    missionId: assignment.missionId,
    testerId: assignment.testerId,
    status: assignment.status,
    assignedAt: assignment.assignedAt.toISOString(),
    startedAt: toIso(assignment.startedAt),
    completedAt: toIso(assignment.completedAt),
    abandonedAt: toIso(assignment.abandonedAt),
    timedOutAt: toIso(assignment.timedOutAt),
    timeoutAt: assignment.timeoutAt.toISOString(),
    coinsEarned: assignment.coinsEarned,
    mission: assignment.mission,
  }
}

function serializeRecentActivity(assignment: RecentActivityRecord) {
  return {
    id: assignment.id,
    missionId: assignment.missionId,
    completedAt: assignment.completedAt!.toISOString(),
    coinsEarned: assignment.coinsEarned,
    mission: assignment.mission,
  }
}

export async function getFounderDashboardInitialData(
  founderProfileId: string
): Promise<FounderDashboardInitialData> {
  const [founderProfile, missions] = await Promise.all([
    prisma.founderProfile.findUnique({
      where: { id: founderProfileId },
      select: { coinBalance: true },
    }),
    prisma.mission.findMany({
      where: { founderId: founderProfileId },
      include: founderMissionInclude,
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return {
    coinBalance: founderProfile?.coinBalance ?? 0,
    missions: missions.map(serializeMission),
  }
}

export async function getTesterDashboardInitialData(
  testerProfileId: string
): Promise<TesterDashboardInitialData> {
  await touchTesterPresence(testerProfileId)

  const [testerProfile, avgRatingResult, recentActivity, activeMissionCount, assignments] =
    await Promise.all([
      prisma.testerProfile.findUnique({
        where: { id: testerProfileId },
        select: {
          coinBalance: true,
          reputationScore: true,
          reputationTier: true,
          totalCompleted: true,
          totalAbandoned: true,
        },
      }),
      prisma.testerRating.aggregate({
        where: { testerId: testerProfileId },
        _avg: {
          score: true,
        },
      }),
      prisma.missionAssignment.findMany({
        where: {
          testerId: testerProfileId,
          status: AssignmentStatus.COMPLETED,
          completedAt: { not: null },
        },
        orderBy: { completedAt: 'desc' },
        take: 5,
        select: recentActivitySelect,
      }),
      prisma.mission.count({
        where: {
          status: MissionStatus.ACTIVE,
        },
      }),
      prisma.missionAssignment.findMany({
        where: {
          testerId: testerProfileId,
          status: {
            in: [AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS],
          },
        },
        orderBy: { assignedAt: 'desc' },
        take: 10,
        select: testerAssignmentSelect,
      }),
    ])

  if (!testerProfile) {
    console.log(`[getTesterDashboardInitialData] testerProfileId:`, testerProfileId, `| Profile not found. Raw assignments result:`, assignments)
    return {
      stats: null,
      assignments: assignments.map(serializeAssignment),
    }
  }

  console.log(`[getTesterDashboardInitialData] testerProfileId:`, testerProfileId, `| Raw assignments result:`, assignments)

  const totalAttempts = testerProfile.totalCompleted + testerProfile.totalAbandoned
  const completionRate = totalAttempts === 0
    ? 0
    : roundToTwo((testerProfile.totalCompleted / totalAttempts) * 100)

  return {
    stats: {
      coinBalance: testerProfile.coinBalance,
      reputationScore: testerProfile.reputationScore,
      reputationTier: testerProfile.reputationTier,
      totalCompleted: testerProfile.totalCompleted,
      totalAbandoned: testerProfile.totalAbandoned,
      completionRate,
      avgRating: avgRatingResult._avg.score === null
        ? null
        : roundToTwo(avgRatingResult._avg.score),
      activeMissionCount,
      recentActivity: recentActivity.map(serializeRecentActivity),
    },
    assignments: assignments.map(serializeAssignment),
  }
}
