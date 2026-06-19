export const dynamic = 'force-dynamic'
import { requireAuth } from '@/lib/api/middleware'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ok, notFound, serverError, unauthorized } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'
import { Prisma } from '@prisma/client'
import { getDashboardRoles, type AppRole } from '@/lib/auth/current-user'

/**
 * Sign out the Supabase session and clear auth cookies on the response so the
 * middleware no longer treats this session as valid.
 */
async function signOutAndClearCookies(
  request: Request,
  response: ReturnType<typeof notFound>
) {
  const { supabase, applySupabaseCookies } = createSupabaseRouteHandlerClient(request)
  await supabase.auth.signOut().catch(() => {})
  return applySupabaseCookies(response)
}

export async function GET(request: Request) {
  try {
    const authUser = await requireAuth()

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { founderProfile: true, testerProfile: true },
    })

    if (!dbUser) {
      return signOutAndClearCookies(request, notFound('User'))
    }
    if (dbUser.isDeleted) {
      return signOutAndClearCookies(request, unauthorized())
    }

    const appRole = authUser.app_metadata?.role as AppRole | null | undefined
    const roles = getDashboardRoles(dbUser)
    
    // If Supabase says they don't have a role yet, they haven't finished onboarding.
    // Force role to null to keep them on /select-role, regardless of Prisma's default.
    const normalizedRole: AppRole | null = appRole 
      ? (dbUser.role === 'ADMIN'
          ? 'ADMIN'
          : roles.includes(dbUser.role)
            ? dbUser.role
            : roles[0] ?? null)
      : null

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

