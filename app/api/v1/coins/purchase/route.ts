import { z } from 'zod'
import { TxType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { validateBody } from '@/lib/api/validate'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { COIN_PACKS } from '@/lib/business/coins'

const PurchaseCoinsSchema = z.object({
  packId: z.enum(['starter', 'growth', 'scale']),
})

export async function POST(request: Request) {
  try {
    const founder = await requireRole('FOUNDER')
    const body = await validateBody(request, PurchaseCoinsSchema)

    const pack = COIN_PACKS.find((entry) => entry.id === body.packId)

    if (!pack) {
      return badRequest('Invalid pack selected')
    }

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    // TODO: Replace with real payment gateway
    // (Razorpay or Stripe) before going live
    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.founderProfile.update({
        where: { id: founder.founderProfile!.id },
        data: {
          coinBalance: {
            increment: pack.coins,
          },
        },
        select: {
          coinBalance: true,
        },
      })

      await tx.coinTransaction.create({
        data: {
          type: TxType.PURCHASE,
          amount: pack.coins,
          balanceAfter: profile.coinBalance,
          description: `Purchased ${pack.label} pack (${pack.coins} coins)`,
          userId: founder.id,
        },
      })

      return {
        newBalance: profile.coinBalance,
      }
    })

    return ok({
      coinsAdded: pack.coins,
      newBalance: result.newBalance,
      pack,
    })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[coins:purchase:post]', err)
    return serverError()
  }
}
