import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/middleware'
import { ok, notFound, serverError, apiError } from '@/lib/api/response'
import { coinsToRupees } from '@/lib/business/coins'

export async function GET(request: Request) {
  try {
    const authUser = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        founderProfile: true,
        testerProfile: true,
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

    const profile =
      user.role === 'FOUNDER' ? user.founderProfile :
      user.role === 'TESTER' ? user.testerProfile :
      null

    if (!profile) {
      return notFound('Profile')
    }

    return ok({
      balance: profile.coinBalance,
      coinBalance: profile.coinBalance,
      rupeeValue: coinsToRupees(profile.coinBalance),
      role: user.role,
    })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[coins:balance:get]', err)
    return serverError()
  }
}
