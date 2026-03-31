export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, notFound, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

export async function GET(
  request: Request,
  context: { params: { missionId: string } }
) {
  try {
    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    // Verify the mission belongs to this founder
    const mission = await prisma.mission.findFirst({
      where: {
        id: context.params.missionId,
        founderId: founder.founderProfile.id,
      },
      select: { id: true },
    })

    if (!mission) {
      return notFound('Mission')
    }

    // Fetch all COMPLETED assignments with tester info and their responses
    const assignments = await prisma.missionAssignment.findMany({
      where: {
        missionId: mission.id,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        completedAt: true,
        coinsEarned: true,
        tester: {
          select: {
            displayName: true,
          },
        },
        responses: {
          select: {
            id: true,
            questionId: true,
            responseText: true,
            responseRating: true,
            responseChoice: true,
            question: {
              select: {
                text: true,
                type: true,
                order: true,
              },
            },
          },
          orderBy: {
            question: { order: 'asc' },
          },
        },
      },
      orderBy: { completedAt: 'asc' },
    })

    return ok(assignments)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
