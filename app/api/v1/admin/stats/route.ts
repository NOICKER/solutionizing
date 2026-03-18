import { MissionStatus, Role, TxType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

export async function GET(request: Request) {
  try {
    await requireRole('ADMIN')

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      totalFounders,
      totalTesters,
      totalMissions,
      totalCompletedMissions,
      totalResponsesCollected,
      newUsers,
      launchedMissions,
      completedMissionsLast30Days,
      purchaseSum,
      withdrawalSum,
      platformRevenueSum,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.FOUNDER } }),
      prisma.user.count({ where: { role: Role.TESTER } }),
      prisma.mission.count(),
      prisma.mission.count({ where: { status: MissionStatus.COMPLETED } }),
      prisma.missionResponse.count(),
      prisma.user.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.mission.count({
        where: {
          launchedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.mission.count({
        where: {
          completedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.coinTransaction.aggregate({
        where: {
          type: TxType.PURCHASE,
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.coinTransaction.aggregate({
        where: {
          type: TxType.TESTER_WITHDRAWAL,
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.mission.aggregate({
        where: {
          launchedAt: { gte: thirtyDaysAgo },
        },
        _sum: {
          coinPlatformFee: true,
        },
      }),
    ])

    return ok({
      totals: {
        users: totalUsers,
        founders: totalFounders,
        testers: totalTesters,
        missions: totalMissions,
        completedMissions: totalCompletedMissions,
        totalResponsesCollected,
      },
      last30Days: {
        newUsers,
        launchedMissions,
        completedMissions: completedMissionsLast30Days,
        coinsIssued: purchaseSum._sum.amount ?? 0,
        coinsWithdrawn: Math.abs(withdrawalSum._sum.amount ?? 0),
        platformRevenue: platformRevenueSum._sum.coinPlatformFee ?? 0,
      },
    })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

