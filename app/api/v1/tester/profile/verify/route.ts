import { z } from 'zod'
import { requireAuth, requireRole } from '@/lib/api/middleware'
import { prisma } from '@/lib/prisma'
import { validateBody } from '@/lib/api/validate'
import { ok, notFound, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

const VerifyTesterProfileSchema = z.object({
  deviceType: z.enum(['desktop', 'mobile', 'both']),
  browserInfo: z.string().trim().min(1).max(500),
})

export async function POST(request: Request) {
  try {
    await requireAuth()
    const tester = await requireRole('TESTER')

    if (!tester.testerProfile) {
      return notFound('Tester profile')
    }

    const body = await validateBody(request, VerifyTesterProfileSchema)

    await prisma.testerProfile.update({
      where: { id: tester.testerProfile.id },
      data: {
        preferredDevice: body.deviceType,
      },
    })

    return ok({
      message: 'Device verified successfully',
      browserInfo: body.browserInfo,
    })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
