export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { TxType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { validateBody } from '@/lib/api/validate'
import { ok, badRequest, notFound, serverError, apiError } from '@/lib/api/response'
import { COIN_PACKS } from '@/lib/business/coins'
import { logApiRouteError } from '@/lib/api/log'

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

    const allowBetaInstantCoinCredit = process.env.ALLOW_BETA_INSTANT_COIN_CREDIT === 'true'

    if (!allowBetaInstantCoinCredit) {
      return apiError(
        'Coin purchases are temporarily unavailable until checkout is enabled.',
        'PAYMENTS_UNAVAILABLE',
        503
      )
    }

    // Temporary beta flow: direct credits are only allowed behind
    // ALLOW_BETA_INSTANT_COIN_CREDIT=true.
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
    logApiRouteError(request, err)
    return serverError()
  }
}

