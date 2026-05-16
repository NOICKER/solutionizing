export const dynamic = 'force-dynamic'
import { requireAuth } from '@/lib/api/middleware'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { validateBody } from '@/lib/api/validate'
import { ok, notFound, serverError } from '@/lib/api/response'
import { z } from 'zod'
import { logApiRouteError } from '@/lib/api/log'
import { MissionStatus, Prisma } from '@prisma/client'
import type { DashboardRole } from '@/lib/auth/current-user'
import { assignTestersToMission } from '@/lib/business/assignment'
import { OPEN_ASSIGNMENT_STATUSES } from '@/lib/business/mission-assignments'

const SelectRoleSchema = z.object({
  role: z.enum(['FOUNDER', 'TESTER']),
  displayName: z.string().min(2).max(50),
})

const OVERASSIGNMENT_FACTOR = 1.3

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

/**
 * Fire-and-forget: assign the new tester to any ACTIVE missions with open slots.
 * Runs asynchronously so it doesn't block the onboarding response.
 */
async function assignNewTesterToActiveMissions() {
  try {
    const activeMissions = await prisma.mission.findMany({
      where: { status: MissionStatus.ACTIVE },
      select: {
        id: true,
        testersRequired: true,
        testersCompleted: true,
        _count: {
          select: {
            assignments: {
              where: {
                status: { in: [...OPEN_ASSIGNMENT_STATUSES] },
              },
            },
          },
        },
      },
    })

    const missionsNeedingTesters = activeMissions.filter((mission) => {
      const remaining = mission.testersRequired - mission.testersCompleted
      const slotsNeeded =
        Math.ceil(remaining * OVERASSIGNMENT_FACTOR) - mission._count.assignments
      return slotsNeeded > 0
    })

    if (missionsNeedingTesters.length === 0) return

    console.log(
      `[select-role] New tester available — attempting assignment to ${missionsNeedingTesters.length} mission(s)`
    )

    await Promise.allSettled(
      missionsNeedingTesters.map((m) => assignTestersToMission(m.id))
    )
  } catch (err) {
    console.error('[select-role] post-onboarding assignment failed', err)
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

    const isNewTester = body.role === 'TESTER' && !existingProfile

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

    // After a new tester completes onboarding, attempt to assign them
    // to any active missions with open slots (fire-and-forget).
    if (isNewTester) {
      assignNewTesterToActiveMissions().catch((err) =>
        console.error('[select-role] background assignment error', err)
      )
    }

    return ok({ role: body.role, roles: nextRoles, displayName: body.displayName })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

