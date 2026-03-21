export const dynamic = 'force-dynamic'
import { AssignmentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, notFound, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100
}

export async function GET(request: Request) {
  try {
    const tester = await requireRole('TESTER')

    if (!tester.testerProfile) {
      return notFound('Tester profile')
    }

    const testerProfileId = tester.testerProfile.id
    const [testerProfile, avgRatingResult, recentActivity] = await Promise.all([
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
        },
        orderBy: { completedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          missionId: true,
          completedAt: true,
          coinsEarned: true,
          mission: {
            select: {
              title: true,
            },
          },
        },
      }),
    ])

    if (!testerProfile) {
      return notFound('Tester profile')
    }

    const totalAttempts = testerProfile.totalCompleted + testerProfile.totalAbandoned
    const completionRate = totalAttempts === 0
      ? 0
      : roundToTwo((testerProfile.totalCompleted / totalAttempts) * 100)

    return ok({
      coinBalance: testerProfile.coinBalance,
      reputationScore: testerProfile.reputationScore,
      reputationTier: testerProfile.reputationTier,
      totalCompleted: testerProfile.totalCompleted,
      totalAbandoned: testerProfile.totalAbandoned,
      completionRate,
      avgRating: avgRatingResult._avg.score === null
        ? null
        : roundToTwo(avgRatingResult._avg.score),
      recentActivity,
    })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

