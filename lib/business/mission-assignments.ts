import { AssignmentStatus, Prisma } from '@prisma/client'

export const OPEN_ASSIGNMENT_STATUSES = [
  AssignmentStatus.ASSIGNED,
  AssignmentStatus.IN_PROGRESS,
] as const

export async function releaseOpenAssignmentsForMission(
  tx: Prisma.TransactionClient,
  missionId: string,
  nextStatus: AssignmentStatus = AssignmentStatus.MISSION_FULL,
  statuses: readonly AssignmentStatus[] = OPEN_ASSIGNMENT_STATUSES
) {
  const openAssignments = await tx.missionAssignment.findMany({
    where: {
      missionId,
      status: {
        in: [...statuses],
      },
    },
    select: {
      testerId: true,
    },
  })

  if (openAssignments.length === 0) {
    return []
  }

  await tx.missionAssignment.updateMany({
    where: {
      missionId,
      status: {
        in: [...statuses],
      },
    },
    data: {
      status: nextStatus,
    },
  })

  const testerIds = [...new Set(openAssignments.map((assignment) => assignment.testerId))]

  if (testerIds.length > 0) {
    await tx.testerProfile.updateMany({
      where: {
        id: {
          in: testerIds,
        },
      },
      data: {
        isAvailable: true,
      },
    })
  }

  return testerIds
}
