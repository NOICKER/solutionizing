export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

export async function GET(request: Request) {
  try {
    await requireRole('ADMIN')

    const flags = await prisma.missionFlag.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        missionId: true,
        assignmentId: true,
        reporterRole: true,
        targetRole: true,
        reason: true,
        details: true,
        status: true,
        resolutionNote: true,
        createdAt: true,
        mission: {
          select: {
            title: true,
            status: true,
          },
        },
        reporterUser: {
          select: {
            email: true,
            founderProfile: {
              select: {
                displayName: true,
              },
            },
            testerProfile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        targetUser: {
          select: {
            email: true,
            founderProfile: {
              select: {
                displayName: true,
              },
            },
            testerProfile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    })

    function getDisplayName(user: {
      email: string
      founderProfile: { displayName: string } | null
      testerProfile: { displayName: string } | null
    }) {
      return user.founderProfile?.displayName ?? user.testerProfile?.displayName ?? user.email
    }

    const groupedFlags = flags.reduce<
      Array<{
        missionId: string
        missionTitle: string | null
        missionStatus: string | null
        flags: Array<{
          id: string
          assignmentId: string
          reporterRole: string
          reporterDisplayName: string | null
          targetRole: string
          targetDisplayName: string | null
          reason: string
          details: string | null
          status: string
          resolutionNote: string | null
          createdAt: Date
        }>
      }>
    >((groups, flag) => {
      const existingGroup = groups.find((group) => group.missionId === flag.missionId)

      const normalizedFlag = {
        id: flag.id,
        assignmentId: flag.assignmentId,
        reporterRole: flag.reporterRole,
        reporterDisplayName: getDisplayName(flag.reporterUser),
        targetRole: flag.targetRole,
        targetDisplayName: getDisplayName(flag.targetUser),
        reason: flag.reason,
        details: flag.details,
        status: flag.status,
        resolutionNote: flag.resolutionNote,
        createdAt: flag.createdAt,
      }

      if (existingGroup) {
        existingGroup.flags.push(normalizedFlag)
        return groups
      }

      groups.push({
        missionId: flag.missionId,
        missionTitle: flag.mission.title ?? null,
        missionStatus: flag.mission.status ?? null,
        flags: [normalizedFlag],
      })

      return groups
    }, [])

    return ok(groupedFlags)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

