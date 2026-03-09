import { AssignmentStatus } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'

const AssignmentListQuerySchema = z.object({
  status: z.nativeEnum(AssignmentStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(request: Request) {
  try {
    const tester = await requireRole('TESTER')

    if (!tester.testerProfile) {
      return notFound('Tester profile')
    }

    const requestUrl = new URL(request.url)
    const queryResult = AssignmentListQuerySchema.safeParse({
      status: requestUrl.searchParams.get('status') || undefined,
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
      ...(query.status ? { status: query.status } : {}),
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
    console.error('[tester:assignments:list]', err)
    return serverError()
  }
}
