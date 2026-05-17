export const dynamic = 'force-dynamic'
import { MissionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, notFound, apiError, serverError, tooManyRequests } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'
import { assignTestersToMission } from '@/lib/business/assignment'
import { enforceRateLimit } from '@/lib/api/rate-limit'

/**
 * POST /api/v1/missions/[missionId]/reassign
 *
 * Manually triggers tester assignment for a specific ACTIVE mission.
 * Rate-limited to 1 call per 10 minutes per user.
 * Only the mission's owner can call this.
 */
export async function POST(
  request: Request,
  context: { params: { missionId: string } }
) {
  try {
    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    // Rate limit: 1 call per 10 minutes per user
    const rateLimitResponse = await enforceRateLimit(request, 'mission-reassign')

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const mission = await prisma.mission.findFirst({
      where: {
        id: context.params.missionId,
        founderId: founder.founderProfile.id,
      },
      select: {
        id: true,
        status: true,
        testersRequired: true,
        testersAssigned: true,
      },
    })

    if (!mission) {
      return notFound('Mission')
    }

    if (mission.status !== MissionStatus.ACTIVE) {
      return apiError(
        'Mission must be ACTIVE to find more testers',
        'MISSION_NOT_ACTIVE',
        400
      )
    }

    const assignments = await assignTestersToMission(mission.id)

    return ok({
      newTestersAssigned: assignments.length,
      missionId: mission.id,
    })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
