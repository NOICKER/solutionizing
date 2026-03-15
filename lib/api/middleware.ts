import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { apiError, unauthorized, forbidden } from '@/lib/api/response'
import type { Role } from '@prisma/client'

// Returns the authenticated Supabase user or throws a 401 response
export async function requireAuth() {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw unauthorized()
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
