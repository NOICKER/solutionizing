export const dynamic = 'force-dynamic'
import { AssignmentStatus } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'
import { touchTesterPresence } from '@/lib/business/tester-availability'

const AssignmentListQuerySchema = z.object({
  statuses: z.array(z.nativeEnum(AssignmentStatus)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

function parseAssignmentStatuses(searchParams: URLSearchParams) {
  const statuses = searchParams
    .getAll('status')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean)

  return statuses.length > 0 ? statuses : undefined
}

export async function GET(request: Request) {
  try {
    const tester = await requireRole('TESTER')

    if (!tester.testerProfile) {
      return notFound('Tester profile')
    }

    await touchTesterPresence(tester.testerProfile.id)

    const requestUrl = new URL(request.url)
    const queryResult = AssignmentListQuerySchema.safeParse({
      statuses: parseAssignmentStatuses(requestUrl.searchParams),
      page: requestUrl.searchParams.get('page') ?? undefined,
      limit: requestUrl.searchParams.get('limit') ?? undefined,
    })

    if (!queryResult.success) {
      return badRequest('Validation failed', queryResult.error.flatten())
    }

    const query = queryResult.data
    const skip = (query.page - 1) * query.limit
    const where = {
      testerId: tester.testerProfile.id,
      ...(query.statuses?.length
        ? {
            status: {
              in: query.statuses,
            },
          }
        : {}),
    }

    const [total, assignments] = await Promise.all([
      prisma.missionAssignment.count({ where }),
      prisma.missionAssignment.findMany({
        where,
        orderBy: { assignedAt: 'desc' },
        skip,
        take: query.limit,
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
              title: true,
              goal: true,
              estimatedMinutes: true,
              coinPerTester: true,
            },
          },
        },
      }),
    ])

    return ok(
      assignments,
      {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      }
    )
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

