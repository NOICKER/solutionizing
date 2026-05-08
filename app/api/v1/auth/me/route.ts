export const dynamic = 'force-dynamic'
import { requireAuth } from '@/lib/api/middleware'
import { prisma } from '@/lib/prisma'
import { ok, notFound, serverError, unauthorized } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'
import { Prisma } from '@prisma/client'
import { getDashboardRoles, type AppRole } from '@/lib/auth/current-user'

export async function GET(request: Request) {
  try {
    const authUser = await requireAuth()

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { founderProfile: true, testerProfile: true },
    })

    if (!dbUser) return notFound('User')
    if (dbUser.isDeleted) return unauthorized()

    const roles = getDashboardRoles(dbUser)
    const normalizedRole: AppRole =
      dbUser.role === 'ADMIN'
        ? 'ADMIN'
        : roles.includes(dbUser.role)
          ? dbUser.role
          : roles[0] ?? null

    return ok({
      id: dbUser.id,
      email: dbUser.email,
      role: normalizedRole,
      roles,
      emailVerified: dbUser.emailVerified,
      founderProfile: dbUser.founderProfile
        ? {
          id: dbUser.founderProfile.id,
          displayName: dbUser.founderProfile.displayName,
          coinBalance: dbUser.founderProfile.coinBalance,
        }
        : null,
      testerProfile: dbUser.testerProfile
        ? {
          id: dbUser.testerProfile.id,
          displayName: dbUser.testerProfile.displayName,
          coinBalance: dbUser.testerProfile.coinBalance,
          reputationScore: dbUser.testerProfile.reputationScore,
          reputationTier: dbUser.testerProfile.reputationTier,
        }
        : null,
    })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

