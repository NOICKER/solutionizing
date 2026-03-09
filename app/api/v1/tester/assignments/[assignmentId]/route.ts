import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, notFound, serverError } from '@/lib/api/response'

export async function GET(
  request: Request,
  context: { params: { assignmentId: string } }
) {
  try {
    const tester = await requireRole('TESTER')

    if (!tester.testerProfile) {
      return notFound('Tester profile')
    }

    const assignment = await prisma.missionAssignment.findFirst({
      where: {
        id: context.params.assignmentId,
        testerId: tester.testerProfile.id,
      },
      select: {
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
            id: true,
            title: true,
            goal: true,
            difficulty: true,
            estimatedMinutes: true,
            testersRequired: true,
            testersAssigned: true,
            testersCompleted: true,
            minRepTier: true,
            coinPlatformFee: true,
            coinCostTotal: true,
            status: true,
            reviewNote: true,
            reviewedBy: true,
            reviewedAt: true,
            launchedAt: true,
            completedAt: true,
            pausedAt: true,
            reportCount: true,
            createdAt: true,
            updatedAt: true,
            assets: {
              orderBy: { order: 'asc' },
            },
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!assignment) {
      return notFound('Assignment')
    }

    return ok(assignment)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[tester:assignments:get]', err)
    return serverError()
  }
}
