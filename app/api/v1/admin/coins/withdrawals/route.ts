export const dynamic = 'force-dynamic'
import { TxType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

export async function GET(request: Request) {
  try {
    await requireRole('ADMIN')

    const withdrawals = await prisma.coinTransaction.findMany({
      where: {
        type: TxType.TESTER_WITHDRAWAL,
      },
      include: {
        user: {
          select: {
            email: true,
            testerProfile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(withdrawals)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

