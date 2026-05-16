import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireRole('ADMIN')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const category = searchParams.get('category') || undefined
    const pageSize = 20

    const where = category ? { category } : {}

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.feedback.count({ where }),
    ])

    return ok({ items, total, page, pageSize })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
