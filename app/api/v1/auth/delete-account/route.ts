export const dynamic = 'force-dynamic'
import { requireAuth } from '@/lib/api/middleware'
import { prisma } from '@/lib/prisma'
import { ok, serverError } from '@/lib/api/response'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logApiRouteError } from '@/lib/api/log'
import { Prisma } from '@prisma/client'

export async function DELETE(request: Request) {
  try {
    const authUser = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    })

    await prisma.$transaction(async (tx) => {
      // Anonymize the base user record
      await tx.user.update({
        where: { id: authUser.id },
        data: {
          email: `deleted_${authUser.id}@deleted.com`,
          deletedAt: new Date(),
          isDeleted: true,
        },
      })

      if (user?.role === 'FOUNDER') {
        await tx.founderProfile.updateMany({
          where: { userId: authUser.id },
          data: {
            displayName: 'Deleted Founder',
            companyName: null,
            stripeCustomerId: null,
          },
        })
      } else if (user?.role === 'TESTER') {
        await tx.testerProfile.updateMany({
          where: { userId: authUser.id },
          data: {
            displayName: 'Deleted Tester',
            stripeAccountId: null,
          },
        })
      }
    })

    // Sign out the user from Supabase Auth
    await supabaseAdmin.auth.admin.signOut(authUser.id)

    return ok({ message: 'Account deleted successfully' })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

