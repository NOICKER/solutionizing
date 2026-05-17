export const dynamic = 'force-dynamic'
import { MissionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'
import { assignTestersToMission } from '@/lib/business/assignment'
import { OPEN_ASSIGNMENT_STATUSES } from '@/lib/business/mission-assignments'
import { enforceRateLimit } from '@/lib/api/rate-limit'

const OVERASSIGNMENT_FACTOR = 1.3

/**
 * POST /api/v1/tester/find-missions
 *
 * Allows a tester to manually check for and get assigned to active missions
 * with open slots. Same logic as the post-onboarding assignment in select-role.
 * Rate-limited to 1 call per 10 minutes per user.
 */
export async function POST(request: Request) {
  try {
    const tester = await requireRole('TESTER')

    if (!tester.testerProfile) {
      return ok({ missionsChecked: 0, newAssignments: 0 })
    }

    // Rate limit: 1 call per 10 minutes per user
    const rateLimitResponse = await enforceRateLimit(request, 'tester-find-missions')

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Find all ACTIVE missions that still have open tester slots
    const activeMissions = await prisma.mission.findMany({
      where: { status: MissionStatus.ACTIVE },
      select: {
        id: true,
        testersRequired: true,
        testersCompleted: true,
        _count: {
          select: {
            assignments: {
              where: {
                status: { in: [...OPEN_ASSIGNMENT_STATUSES] },
              },
            },
          },
        },
      },
    })

    const missionsNeedingTesters = activeMissions.filter((mission) => {
      const remaining = mission.testersRequired - mission.testersCompleted
      const slotsNeeded =
        Math.ceil(remaining * OVERASSIGNMENT_FACTOR) - mission._count.assignments
      return slotsNeeded > 0
    })

    if (missionsNeedingTesters.length === 0) {
      return ok({ missionsChecked: 0, newAssignments: 0 })
    }

    console.log(
      `[find-missions] Tester ${tester.testerProfile.id} triggered check — ${missionsNeedingTesters.length} mission(s) with open slots`
    )

    const results = await Promise.allSettled(
      missionsNeedingTesters.map((m) => assignTestersToMission(m.id))
    )

    // Count how many assignments were actually made for this tester
    let newAssignments = 0

    for (const result of results) {
      if (result.status === 'fulfilled') {
        newAssignments += result.value.filter(
          (a) => a.userId === tester.id
        ).length
      }
    }

    return ok({
      missionsChecked: missionsNeedingTesters.length,
      newAssignments,
    })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
