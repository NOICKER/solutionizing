import { TxType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, notFound, serverError } from '@/lib/api/response'

export async function GET(request: Request) {
  try {
    const tester = await requireRole('TESTER')

    if (!tester.testerProfile) {
      return notFound('Tester profile')
    }

    const transactions = await prisma.coinTransaction.findMany({
      where: {
        userId: tester.id,
        type: TxType.TESTER_WITHDRAWAL,
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(transactions)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[coins:withdraw:history:get]', err)
    return serverError()
  }
}
