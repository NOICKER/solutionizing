import { AssignmentStatus, MissionStatus } from '@prisma/client'
import { addHours } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { acquireLock, releaseLock } from '@/lib/redis'
import { OPEN_ASSIGNMENT_STATUSES } from '@/lib/business/mission-assignments'
import { TIER_THRESHOLDS } from '@/lib/business/reputation'
import {
  getTesterAvailabilityPool,
  getTesterAvailabilityScore,
  invalidateTesterAvailabilityCache,
  isTesterOnline,
} from '@/lib/business/tester-availability'

const OVERASSIGNMENT_FACTOR = 1.3
const TESTER_LOCK_TTL_SECONDS = 30

type AssignedTesterNotification = {
  assignmentId: string
  missionId: string
  userId: string
}

export async function assignTestersToMission(
  missionId: string
): Promise<AssignedTesterNotification[]> {
  const lockKey = `lock:assignment:${missionId}`
  const lockAcquired = await acquireLock(lockKey, 30)

  if (!lockAcquired) {
    console.warn(`[assignTestersToMission] Lock not acquired for mission ${missionId}`)
    return []
  }

  const claimedTesterLocks: string[] = []

  try {
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        assignments: {
          select: {
            id: true,
            testerId: true,
            status: true,
          },
        },
      },
    })

    if (!mission || mission.status !== MissionStatus.ACTIVE) {
      return []
    }

    const remainingRequired = mission.testersRequired - mission.testersCompleted
    const alreadyAssignedSlots = mission.assignments.filter(
      (assignment) =>
        assignment.status === AssignmentStatus.ASSIGNED ||
        assignment.status === AssignmentStatus.IN_PROGRESS
    ).length
    const slotsNeeded = Math.ceil(remainingRequired * OVERASSIGNMENT_FACTOR) - alreadyAssignedSlots

    if (slotsNeeded <= 0) {
      return []
    }

    const minimumReputationScore = TIER_THRESHOLDS[mission.minRepTier].min
    const now = new Date()

    const [availabilityPool, blockedAssignments] = await Promise.all([
      getTesterAvailabilityPool(),
      prisma.missionAssignment.findMany({
        where: {
          OR: [
            {
              missionId,
            },
            {
              status: {
                in: [...OPEN_ASSIGNMENT_STATUSES],
              },
              mission: {
                status: MissionStatus.ACTIVE,
              },
            },
          ],
        },
        select: {
          testerId: true,
        },
      }),
    ])

    const blockedTesterIds = new Set(blockedAssignments.map((assignment) => assignment.testerId))

    const testerCandidates = availabilityPool.filter(
      (tester) =>
        tester.reputationScore >= minimumReputationScore &&
        !blockedTesterIds.has(tester.id)
    )

    const selectedTesters = testerCandidates
      .map((tester) => ({
        tester,
        isOnline: isTesterOnline(tester.lastActiveAt, now),
        score:
          tester.reputationScore * 0.5 +
          getTesterAvailabilityScore(tester.lastActiveAt, now) * 0.35 +
          Math.random() * 100 * 0.15,
      }))
      .sort((left, right) => {
        if (left.isOnline !== right.isOnline) {
          return Number(right.isOnline) - Number(left.isOnline)
        }

        return right.score - left.score
      })
      .map(({ tester }) => tester)

    if (selectedTesters.length === 0) {
      return []
    }

    const timeoutAt = addHours(now, 24)

    const createdAssignments = await prisma.$transaction<AssignedTesterNotification[]>(
      async (tx) => {
        const latestMission = await tx.mission.findUnique({
          where: { id: missionId },
          select: {
            id: true,
            status: true,
            testersRequired: true,
            testersCompleted: true,
            minRepTier: true,
          },
        })

        if (!latestMission || latestMission.status !== MissionStatus.ACTIVE) {
          return []
        }

        const currentOpenAssignments = await tx.missionAssignment.count({
          where: {
            missionId,
            status: {
              in: [...OPEN_ASSIGNMENT_STATUSES],
            },
          },
        })

        const currentRemainingRequired =
          latestMission.testersRequired - latestMission.testersCompleted
        const currentSlotsNeeded =
          Math.ceil(currentRemainingRequired * OVERASSIGNMENT_FACTOR) - currentOpenAssignments

        if (currentSlotsNeeded <= 0) {
          return []
        }

        const latestMinimumReputationScore = TIER_THRESHOLDS[latestMission.minRepTier].min
        const created: AssignedTesterNotification[] = []

        for (const tester of selectedTesters) {
          if (created.length >= currentSlotsNeeded) {
            break
          }

          const testerLockKey = `lock:assignment:${missionId}:tester:${tester.id}`
          const testerLockAcquired = await acquireLock(
            testerLockKey,
            TESTER_LOCK_TTL_SECONDS
          )

          if (!testerLockAcquired) {
            continue
          }

          claimedTesterLocks.push(testerLockKey)

          const eligibleTester = await tx.testerProfile.findFirst({
            where: {
              id: tester.id,
              reputationScore: {
                gte: latestMinimumReputationScore,
              },
              user: {
                isSuspended: false,
                deletedAt: null,
              },
              assignments: {
                none: {
                  OR: [
                    {
                      missionId,
                    },
                    {
                      status: {
                        in: [...OPEN_ASSIGNMENT_STATUSES],
                      },
                      mission: {
                        status: MissionStatus.ACTIVE,
                      },
                    },
                  ],
                },
              },
            },
            select: {
              id: true,
              userId: true,
            },
          })

          if (!eligibleTester) {
            continue
          }

          const assignment = await tx.missionAssignment.create({
            data: {
              missionId,
              testerId: eligibleTester.id,
              status: AssignmentStatus.ASSIGNED,
              assignedAt: now,
              timeoutAt,
            },
            select: {
              id: true,
            },
          })

          await tx.testerProfile.update({
            where: { id: eligibleTester.id },
            data: { isAvailable: false },
          })

          created.push({
            assignmentId: assignment.id,
            missionId,
            userId: eligibleTester.userId,
          })
        }

        if (created.length > 0) {
          await tx.mission.update({
            where: { id: missionId },
            data: {
              testersAssigned: { increment: created.length },
            },
          })
        }

        return created
      }
    )

    if (createdAssignments.length > 0) {
      await invalidateTesterAvailabilityCache()
    }

    return createdAssignments
  } finally {
    await Promise.allSettled(
      claimedTesterLocks.map((claimedLockKey) => releaseLock(claimedLockKey))
    )
    await releaseLock(lockKey)
  }
}
