import { AssignmentStatus, MissionStatus, RepTier } from '@prisma/client'
import { addHours } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { acquireLock, releaseLock } from '@/lib/redis'

const REP_TIER_VALUES: Record<RepTier, number> = {
  NEWCOMER: 0,
  RELIABLE: 1,
  TRUSTED: 2,
  ELITE: 3,
}

export async function assignTestersToMission(missionId: string) {
  const lockKey = `lock:assignment:${missionId}`
  const lockAcquired = await acquireLock(lockKey, 30)

  if (!lockAcquired) {
    console.warn(`[assignTestersToMission] Lock not acquired for mission ${missionId}`)
    return
  }

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
      return
    }

    const remainingRequired = mission.testersRequired - mission.testersCompleted
    const alreadyAssignedSlots = mission.assignments.filter(
      (assignment) =>
        assignment.status === AssignmentStatus.ASSIGNED ||
        assignment.status === AssignmentStatus.IN_PROGRESS
    ).length
    const slotsNeeded = Math.ceil(remainingRequired * 1.3) - alreadyAssignedSlots

    if (slotsNeeded <= 0) {
      return
    }

    const assignedTesterIds = [...new Set(mission.assignments.map((assignment) => assignment.testerId))]
    const minimumTierValue = REP_TIER_VALUES[mission.minRepTier]

    const testerCandidates = await prisma.testerProfile.findMany({
      where: {
        isAvailable: true,
        ...(assignedTesterIds.length > 0 ? { id: { notIn: assignedTesterIds } } : {}),
        user: {
          isSuspended: false,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        userId: true,
        isAvailable: true,
        reputationScore: true,
        reputationTier: true,
      },
    })

    const selectedTesters = testerCandidates
      .filter((tester) => REP_TIER_VALUES[tester.reputationTier] >= minimumTierValue)
      .map((tester) => ({
        tester,
        score:
          (tester.reputationScore / 100) * 0.5 +
          (tester.isAvailable ? 1 : 0) * 0.3 +
          Math.random() * 0.2,
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, slotsNeeded)
      .map(({ tester }) => tester)

    if (selectedTesters.length === 0) {
      return
    }

    const selectedTesterIds = selectedTesters.map((tester) => tester.id)
    const now = new Date()
    const timeoutAt = addHours(now, 24)

    await prisma.$transaction(async (tx) => {
      await tx.missionAssignment.createMany({
        data: selectedTesters.map((tester) => ({
          missionId,
          testerId: tester.id,
          status: AssignmentStatus.ASSIGNED,
          assignedAt: now,
          timeoutAt,
        })),
      })

      await tx.testerProfile.updateMany({
        where: { id: { in: selectedTesterIds } },
        data: { isAvailable: false },
      })

      await tx.mission.update({
        where: { id: missionId },
        data: {
          testersAssigned: { increment: selectedTesters.length },
        },
      })
    })
  } finally {
    await releaseLock(lockKey)
  }
}
