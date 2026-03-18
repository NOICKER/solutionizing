import { Difficulty } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { validateBody } from '@/lib/api/validate'
import { ok, badRequest, notFound, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

const UpdateFounderProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(50).optional(),
  companyName: z.string().trim().max(100).optional(),
  defaultDifficulty: z.nativeEnum(Difficulty).optional(),
  defaultTestersRequired: z.number().int().min(5).max(50).optional(),
  notifyMissionApproved: z.boolean().optional(),
  notifyMissionCompleted: z.boolean().optional(),
  notifyTesterFeedback: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    const profile = await prisma.founderProfile.findUnique({
      where: { id: founder.founderProfile.id },
      select: {
        displayName: true,
        companyName: true,
        defaultDifficulty: true,
        defaultTestersRequired: true,
        notifyMissionApproved: true,
        notifyMissionCompleted: true,
        notifyTesterFeedback: true,
        darkMode: true,
        onboardingCompleted: true,
      },
    })

    if (!profile) {
      return notFound('Founder profile')
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
    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    const body = await validateBody(request, UpdateFounderProfileSchema)

    if (
      body.displayName === undefined
      && body.companyName === undefined
      && body.defaultDifficulty === undefined
      && body.defaultTestersRequired === undefined
      && body.notifyMissionApproved === undefined
      && body.notifyMissionCompleted === undefined
      && body.notifyTesterFeedback === undefined
      && body.darkMode === undefined
      && body.onboardingCompleted === undefined
    ) {
      return badRequest('At least one profile field must be provided')
    }

    const updatedProfile = await prisma.founderProfile.update({
      where: { id: founder.founderProfile.id },
      data: {
        ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
        ...(body.companyName !== undefined ? { companyName: body.companyName } : {}),
        ...(body.defaultDifficulty !== undefined ? { defaultDifficulty: body.defaultDifficulty } : {}),
        ...(body.defaultTestersRequired !== undefined
          ? { defaultTestersRequired: body.defaultTestersRequired }
          : {}),
        ...(body.notifyMissionApproved !== undefined
          ? { notifyMissionApproved: body.notifyMissionApproved }
          : {}),
        ...(body.notifyMissionCompleted !== undefined
          ? { notifyMissionCompleted: body.notifyMissionCompleted }
          : {}),
        ...(body.notifyTesterFeedback !== undefined
          ? { notifyTesterFeedback: body.notifyTesterFeedback }
          : {}),
        ...(body.darkMode !== undefined ? { darkMode: body.darkMode } : {}),
        ...(body.onboardingCompleted !== undefined
          ? { onboardingCompleted: body.onboardingCompleted }
          : {}),
      },
      select: {
        displayName: true,
        companyName: true,
        defaultDifficulty: true,
        defaultTestersRequired: true,
        notifyMissionApproved: true,
        notifyMissionCompleted: true,
        notifyTesterFeedback: true,
        darkMode: true,
        onboardingCompleted: true,
      },
    })

    return ok(updatedProfile)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
