export const dynamic = 'force-dynamic'
import { MissionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { assignTestersToMission } from '@/lib/business/assignment'
import { OPEN_ASSIGNMENT_STATUSES } from '@/lib/business/mission-assignments'
import { apiError, ok, unauthorized, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

const OVERASSIGNMENT_FACTOR = 1.3

/**
 * Cron endpoint that runs every 15 minutes.
 * Finds all ACTIVE missions with fewer assigned testers than their target
 * and runs assignTestersToMission for each one.
 */
export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      return apiError('CRON_SECRET is not configured', 'SERVER_ERROR', 500)
    }

    const secret = request.headers.get('x-cron-secret')
    const authorization = request.headers.get('authorization')
    const bearerToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null

    if (secret !== cronSecret && bearerToken !== cronSecret) {
      return unauthorized()
    }

    // Find all ACTIVE missions that still have open tester slots
    const activeMissions = await prisma.mission.findMany({
      where: {
        status: MissionStatus.ACTIVE,
      },
      select: {
        id: true,
        testersRequired: true,
        testersCompleted: true,
        _count: {
          select: {
            assignments: {
              where: {
                status: {
                  in: [...OPEN_ASSIGNMENT_STATUSES],
                },
              },
            },
          },
        },
      },
    })

    // Filter to missions that actually need more testers
    const missionsNeedingTesters = activeMissions.filter((mission) => {
      const remainingRequired = mission.testersRequired - mission.testersCompleted
      const openSlots = mission._count.assignments
      const slotsNeeded =
        Math.ceil(remainingRequired * OVERASSIGNMENT_FACTOR) - openSlots

      return slotsNeeded > 0
    })

    console.log(
      `[assign-pending] Found ${missionsNeedingTesters.length} active mission(s) needing testers`
    )

    const results = await Promise.allSettled(
      missionsNeedingTesters.map(async (mission) => {
        const assignments = await assignTestersToMission(mission.id)
        return { missionId: mission.id, assigned: assignments.length }
      })
    )

    const summary = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      }
      return {
        missionId: missionsNeedingTesters[index].id,
        error: String(result.reason),
      }
    })

    console.log(`[assign-pending] Results:`, JSON.stringify(summary))

    return ok({
      missionsChecked: missionsNeedingTesters.length,
      results: summary,
    })
  } catch (err) {
    logApiRouteError(request, err)
    return serverError()
  }
}
