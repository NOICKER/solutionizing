import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { apiError, unauthorized, forbidden } from '@/lib/api/response'
import { cookies } from 'next/headers'
import type { Role } from '@prisma/client'

/**
 * Returns the authenticated Supabase user or throws a 401 response.
 * If a JWT cookie is present but the session is invalid (e.g. missing `sub`
 * claim), the stale auth cookies are cleared so the client isn't stuck in a
 * broken auth loop.
 */
export async function requireAuth() {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    // Detect stale / malformed JWT: cookie exists but Supabase rejected it
    const cookieStore = cookies()
    const hasAuthCookie = cookieStore.getAll().some(c => c.name.includes('-auth-token'))

    if (hasAuthCookie) {
      // Nuke stale auth cookies so the client falls back cleanly
      const response = apiError(
        'Session expired or invalid. Please log in again.',
        'SESSION_INVALID',
        401
      )
      // Clear every Supabase auth cookie fragment
      cookieStore.getAll()
        .filter(c => c.name.includes('-auth-token'))
        .forEach(c => {
          response.cookies.set(c.name, '', { maxAge: 0, path: '/' })
        })
      throw response
    }

    throw unauthorized()
  }

  return user
}
// Returns the DB user + profile or throws 401/403
export async function requireRole(role: Role) {
  const authUser = await requireAuth()
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      founderProfile: role === 'FOUNDER',
      testerProfile: role === 'TESTER',
    }
  })
  if (!dbUser) throw unauthorized()
  if (dbUser.isSuspended) {
    throw apiError('Account suspended', 'ACCOUNT_SUSPENDED', 403)
  }
  if (dbUser.isDeleted) {
    throw apiError('Account deleted. Please contact support to reactivate.', 'ACCOUNT_DELETED', 403)
  }
  if (dbUser.role !== role && dbUser.role !== 'ADMIN') throw forbidden()
  return dbUser
}
