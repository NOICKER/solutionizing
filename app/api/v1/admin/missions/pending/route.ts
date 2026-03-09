import { MissionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, serverError } from '@/lib/api/response'

export async function GET(request: Request) {
  try {
    await requireRole('ADMIN')

    const missions = await prisma.mission.findMany({
      where: {
        status: MissionStatus.PENDING_REVIEW,
      },
      include: {
        founder: {
          select: {
            displayName: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return ok(missions)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[admin:missions:pending]', err)
    return serverError()
  }
}
