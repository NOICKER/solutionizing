export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { TxType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { validateBody } from '@/lib/api/validate'
import { ok, apiError, notFound, serverError } from '@/lib/api/response'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { MIN_WITHDRAWAL_COINS, coinsToRupees } from '@/lib/business/coins'
import { logApiRouteError } from '@/lib/api/log'

const WithdrawCoinsSchema = z.object({
  amount: z.number().int().positive(),
})

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, 'coins-withdraw')
    if (rateLimited) return rateLimited

    const tester = await requireRole('TESTER')
    const body = await validateBody(request, WithdrawCoinsSchema)

    if (!tester.testerProfile) {
      return notFound('Tester profile')
    }

    if (body.amount < MIN_WITHDRAWAL_COINS) {
      return apiError('Minimum withdrawal is 5,000 coins (₹50)', 'BELOW_MIN_WITHDRAWAL', 400)
    }



    const rupeeAmount = coinsToRupees(body.amount)

    // TODO: Trigger real bank transfer via
    // Razorpay or Stripe before going live
    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.testerProfile.update({
        where: { id: tester.testerProfile!.id },
        data: {
          coinBalance: {
            decrement: body.amount,
          },
        },
        select: {
          coinBalance: true,
        },
      })

      if (profile.coinBalance < 0) {
        throw new Error('INSUFFICIENT_COINS')
      }

      await tx.coinTransaction.create({
        data: {
          type: TxType.TESTER_WITHDRAWAL,
          amount: -body.amount,
          balanceAfter: profile.coinBalance,
          description: `Withdrawal of ${body.amount} coins (₹${rupeeAmount})`,
          userId: tester.id,
        },
      })

      return {
        newBalance: profile.coinBalance,
      }
    })

    return ok({
      coinsWithdrawn: body.amount,
      rupeesRequested: rupeeAmount,
      newCoinBalance: result.newBalance,
      status: 'PENDING',
      message: 'Withdrawal request received. Payment will be processed within 3-5 business days.',
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'INSUFFICIENT_COINS') {
      return apiError("You don't have enough coins", 'INSUFFICIENT_COINS', 400)
    }
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

