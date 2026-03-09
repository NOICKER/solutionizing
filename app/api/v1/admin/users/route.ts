import { Role } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, serverError } from '@/lib/api/response'

const AdminUserListQuerySchema = z.object({
  role: z.enum(['FOUNDER', 'TESTER']).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export async function GET(request: Request) {
  try {
    await requireRole('ADMIN')

    const requestUrl = new URL(request.url)
    const queryResult = AdminUserListQuerySchema.safeParse({
      role: requestUrl.searchParams.get('role') || undefined,
      search: requestUrl.searchParams.get('search') || undefined,
      page: requestUrl.searchParams.get('page') ?? undefined,
      limit: requestUrl.searchParams.get('limit') ?? undefined,
    })

    if (!queryResult.success) {
      return badRequest('Validation failed', queryResult.error.flatten())
    }

    const query = queryResult.data
    const skip = (query.page - 1) * query.limit
    const where = {
      ...(query.role ? { role: query.role as Role } : {}),
      ...(query.search
        ? {
            email: {
              contains: query.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          founderProfile: true,
          testerProfile: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
    ])

    return ok(users, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[admin:users:list]', err)
    return serverError()
  }
}
