export const dynamic = 'force-dynamic'
import { requireAuth } from '@/lib/api/middleware'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { validateBody } from '@/lib/api/validate'
import { ok, notFound, serverError } from '@/lib/api/response'
import { z } from 'zod'
import { logApiRouteError } from '@/lib/api/log'
import { Prisma } from '@prisma/client'
import type { DashboardRole } from '@/lib/auth/current-user'

const SelectRoleSchema = z.object({
  role: z.enum(['FOUNDER', 'TESTER']),
  displayName: z.string().min(2).max(50),
})

async function syncRoleMetadata(
  userId: string,
  appMetadata: Record<string, unknown>,
  role: DashboardRole,
  roles: DashboardRole[]
) {
  try {
    const result = await Promise.race([
      supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: {
          ...appMetadata,
          role,
          roles,
        },
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Supabase role sync timed out')), 1500)
      }),
    ])

    if ('error' in result && result.error) {
      console.error('[select-role] metadata sync failed', result.error)
    }
  } catch (error) {
    console.error('[select-role] metadata sync failed', error)
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await requireAuth()
    const body = await validateBody(request, SelectRoleSchema)

    const existingUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { founderProfile: true, testerProfile: true },
    })

    if (!existingUser) {
      return notFound('User')
    }

    const existingProfile = body.role === 'FOUNDER'
      ? existingUser.founderProfile
      : existingUser.testerProfile
    const founderRoles: DashboardRole[] =
      existingUser.founderProfile || body.role === 'FOUNDER' ? ['FOUNDER'] : []
    const testerRoles: DashboardRole[] =
      existingUser.testerProfile || body.role === 'TESTER' ? ['TESTER'] : []
    const nextRoles: DashboardRole[] = [...founderRoles, ...testerRoles]

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: authUser.id },
        data: { role: body.role },
      })

      if (existingProfile) {
        return
      }

      if (body.role === 'FOUNDER') {
        await tx.founderProfile.create({
          data: {
            userId: authUser.id,
            displayName: body.displayName,
          },
        })
      } else {
        await tx.testerProfile.create({
          data: {
            userId: authUser.id,
            displayName: body.displayName,
          },
        })
      }
    })

    await syncRoleMetadata(
      authUser.id,
      (authUser.app_metadata ?? {}) as Record<string, unknown>,
      body.role,
      nextRoles
    )

    return ok({ role: body.role, roles: nextRoles, displayName: body.displayName })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

