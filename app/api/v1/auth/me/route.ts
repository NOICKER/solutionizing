import { requireAuth } from '@/lib/api/middleware'
import { prisma } from '@/lib/prisma'
import { ok, notFound, serverError, unauthorized } from '@/lib/api/response'

export async function GET(request: Request) {
  try {
    const authUser = await requireAuth()

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { founderProfile: true, testerProfile: true },
    })

    if (!dbUser) return notFound('User')
    if (dbUser.isDeleted) return unauthorized()

    const normalizedRole =
      dbUser.role === 'ADMIN'
        ? 'ADMIN'
        : dbUser.founderProfile
          ? 'FOUNDER'
          : dbUser.testerProfile
            ? 'TESTER'
            : null

    return ok({
      id: dbUser.id,
      email: dbUser.email,
      role: normalizedRole,
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
    console.error('[me]', err)
    return serverError()
  }
}
