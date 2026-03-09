import { TxType } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/middleware'
import { ok, badRequest, notFound, serverError, apiError } from '@/lib/api/response'

const CoinTransactionListQuerySchema = z.object({
  type: z.nativeEnum(TxType).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(request: Request) {
  try {
    const authUser = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        role: true,
        isSuspended: true,
      },
    })

    if (!user) {
      return notFound('User')
    }

    if (user.isSuspended) {
      return apiError('Account suspended', 'ACCOUNT_SUSPENDED', 403)
    }

    if (user.role !== 'FOUNDER' && user.role !== 'TESTER') {
      return apiError('Forbidden', 'FORBIDDEN', 403)
    }

    const requestUrl = new URL(request.url)
    const queryResult = CoinTransactionListQuerySchema.safeParse({
      type: requestUrl.searchParams.get('type') || undefined,
      page: requestUrl.searchParams.get('page') ?? undefined,
      limit: requestUrl.searchParams.get('limit') ?? undefined,
    })

    if (!queryResult.success) {
      return badRequest('Validation failed', queryResult.error.flatten())
    }

    const query = queryResult.data
    const skip = (query.page - 1) * query.limit
    const where = {
      userId: user.id,
      ...(query.type ? { type: query.type } : {}),
    }

    const [total, transactions] = await Promise.all([
      prisma.coinTransaction.count({ where }),
      prisma.coinTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
    ])

    return ok(transactions, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[coins:transactions:get]', err)
    return serverError()
  }
}
