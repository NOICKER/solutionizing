import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { validateBody } from '@/lib/api/validate'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

const UpdateTesterProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(50).optional(),
  notifyNewMission: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  expertiseTags: z.array(z.string()).max(10).optional(),
  preferredDevice: z.enum(['desktop', 'mobile', 'both']).optional(),
  payoutDetails: z.string().trim().max(200).optional(),
  onboardingCompleted: z.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    const tester = await requireRole('TESTER')

    if (!tester.testerProfile) {
      return notFound('Tester profile')
    }

    const profile = await prisma.testerProfile.findUnique({
      where: { id: tester.testerProfile.id },
      select: {
        displayName: true,
        coinBalance: true,
        reputationScore: true,
        reputationTier: true,
        notifyNewMission: true,
        darkMode: true,
        onboardingCompleted: true,
        expertiseTags: true,
        preferredDevice: true,
        payoutDetails: true,
      },
    })

    if (!profile) {
      return notFound('Tester profile')
    }

    return ok(profile)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

export async function PATCH(request: Request) {
  try {
    const tester = await requireRole('TESTER')

    if (!tester.testerProfile) {
      return notFound('Tester profile')
    }

    const body = await validateBody(request, UpdateTesterProfileSchema)

    if (
      body.displayName === undefined
      && body.notifyNewMission === undefined
      && body.darkMode === undefined
      && body.expertiseTags === undefined
      && body.preferredDevice === undefined
      && body.payoutDetails === undefined
      && body.onboardingCompleted === undefined
    ) {
      return badRequest('At least one profile field must be provided')
    }

    const updatedProfile = await prisma.testerProfile.update({
      where: { id: tester.testerProfile.id },
      data: {
        ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
        ...(body.notifyNewMission !== undefined ? { notifyNewMission: body.notifyNewMission } : {}),
        ...(body.darkMode !== undefined ? { darkMode: body.darkMode } : {}),
        ...(body.onboardingCompleted !== undefined
          ? { onboardingCompleted: body.onboardingCompleted }
          : {}),
        ...(body.expertiseTags !== undefined ? { expertiseTags: body.expertiseTags } : {}),
        ...(body.preferredDevice !== undefined ? { preferredDevice: body.preferredDevice } : {}),
        ...(body.payoutDetails !== undefined ? { payoutDetails: body.payoutDetails } : {}),
      },
      select: {
        displayName: true,
        coinBalance: true,
        reputationScore: true,
        reputationTier: true,
        notifyNewMission: true,
        darkMode: true,
        onboardingCompleted: true,
        expertiseTags: true,
        preferredDevice: true,
        payoutDetails: true,
      },
    })

    return ok(updatedProfile)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
