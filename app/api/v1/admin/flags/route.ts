import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, serverError } from '@/lib/api/response'

export async function GET(request: Request) {
  try {
    await requireRole('ADMIN')

    const reports = await prisma.missionReport.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    const missionIds = [...new Set(reports.map((report) => report.missionId))]
    const testerIds = [...new Set(reports.map((report) => report.testerId))]

    const [missions, testers] = await Promise.all([
      prisma.mission.findMany({
        where: {
          id: { in: missionIds },
        },
        select: {
          id: true,
          title: true,
          status: true,
        },
      }),
      prisma.testerProfile.findMany({
        where: {
          id: { in: testerIds },
        },
        select: {
          id: true,
          displayName: true,
        },
      }),
    ])

    const missionMap = new Map(missions.map((mission) => [mission.id, mission]))
    const testerMap = new Map(testers.map((tester) => [tester.id, tester]))
    const groupedReports = reports.reduce<
      Array<{
        missionId: string
        missionTitle: string | null
        missionStatus: string | null
        reports: Array<{
          id: string
          testerId: string
          testerDisplayName: string | null
          reason: string
          createdAt: Date
        }>
      }>
    >((groups, report) => {
      const mission = missionMap.get(report.missionId)
      const tester = testerMap.get(report.testerId)
      const existingGroup = groups.find((group) => group.missionId === report.missionId)

      const normalizedReport = {
        id: report.id,
        testerId: report.testerId,
        testerDisplayName: tester?.displayName ?? null,
        reason: report.reason,
        createdAt: report.createdAt,
      }

      if (existingGroup) {
        existingGroup.reports.push(normalizedReport)
        return groups
      }

      groups.push({
        missionId: report.missionId,
        missionTitle: mission?.title ?? null,
        missionStatus: mission?.status ?? null,
        reports: [normalizedReport],
      })

      return groups
    }, [])

    return ok(groupedReports)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[admin:flags]', err)
    return serverError()
  }
}
