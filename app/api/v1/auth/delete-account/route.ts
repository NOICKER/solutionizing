export const dynamic = 'force-dynamic'
import { requireAuth } from '@/lib/api/middleware'
import { prisma } from '@/lib/prisma'
import { ok, serverError } from '@/lib/api/response'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logApiRouteError } from '@/lib/api/log'

export async function DELETE(request: Request) {
  try {
    const authUser = await requireAuth()

    // Hard delete the Prisma User row — cascade rules in schema.prisma
    // automatically wipe FounderProfile and TesterProfile
    await prisma.user.delete({
      where: { id: authUser.id },
    })

    // Permanently delete from Supabase Auth — this user can never be
    // resurrected; re-signing in with same Google account creates a fresh user
    await supabaseAdmin.auth.admin.deleteUser(authUser.id)

    return ok({ message: 'Account deleted successfully' })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}