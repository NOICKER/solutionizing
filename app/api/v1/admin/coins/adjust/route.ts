export const dynamic = 'force-dynamic'
import { TxType } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { validateBody } from '@/lib/api/validate'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

const AdjustCoinsSchema = z.object({
  userId: z.string(),
  amount: z.number().int().refine((value) => value !== 0, {
    message: 'Amount must be non-zero',
  }),
  note: z.string().min(10),
})

export async function POST(request: Request) {
  try {
    await requireRole('ADMIN')
    const body = await validateBody(request, AdjustCoinsSchema)

    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      include: {
        founderProfile: true,
        testerProfile: true,
      },
    })

    if (!user) {
      return notFound('User')
    }

    const profile =
      user.role === 'FOUNDER' ? user.founderProfile :
      user.role === 'TESTER' ? user.testerProfile :
      null

    if (!profile) {
      return notFound('User profile')
    }

    const newBalance = profile.coinBalance + body.amount

    if (newBalance < 0) {
      return badRequest('Adjustment would result in negative balance')
    }

    const transaction = await prisma.$transaction(async (tx) => {
      if (user.role === 'FOUNDER') {
        await tx.founderProfile.update({
          where: { id: profile.id },
          data: { coinBalance: newBalance },
        })
      } else {
        await tx.testerProfile.update({
          where: { id: profile.id },
          data: { coinBalance: newBalance },
        })
      }

      return tx.coinTransaction.create({
        data: {
          type: TxType.ADMIN_ADJUSTMENT,
          amount: body.amount,
          balanceAfter: newBalance,
          description: 'Admin adjustment',
          adminNote: body.note,
          userId: body.userId,
        },
      })
    })

    return ok(transaction)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

