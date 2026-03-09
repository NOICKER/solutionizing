import { TxType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, serverError } from '@/lib/api/response'

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
    console.error('[admin:coins:withdrawals:get]', err)
    return serverError()
  }
}
