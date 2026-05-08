export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/middleware'
import { ok, notFound, serverError, apiError, badRequest } from '@/lib/api/response'
import { coinsToRupees } from '@/lib/business/coins'
import { logApiRouteError } from '@/lib/api/log'
import { Prisma } from '@prisma/client'

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

    const requestUrl = new URL(request.url)
    const requestedRole = requestUrl.searchParams.get('role')

    if (requestedRole && requestedRole !== 'FOUNDER' && requestedRole !== 'TESTER') {
      return badRequest('Invalid role')
    }

    const selectedRole =
      requestedRole === 'FOUNDER' || requestedRole === 'TESTER'
        ? requestedRole
        : user.role === 'FOUNDER' || user.role === 'TESTER'
          ? user.role
          : user.founderProfile
            ? 'FOUNDER'
            : user.testerProfile
              ? 'TESTER'
              : null

    if (!selectedRole) {
      return apiError('Forbidden', 'FORBIDDEN', 403)
    }

    const profile =
      selectedRole === 'FOUNDER' ? user.founderProfile :
      selectedRole === 'TESTER' ? user.testerProfile :
      null

    if (!profile) {
      return notFound('Profile')
    }

    return ok({
      balance: profile.coinBalance,
      coinBalance: profile.coinBalance,
      rupeeValue: coinsToRupees(profile.coinBalance),
      role: selectedRole,
    })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

