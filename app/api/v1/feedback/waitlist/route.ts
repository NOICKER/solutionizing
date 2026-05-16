import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, serverError } from '@/lib/api/response'
import { validateBody } from '@/lib/api/validate'
import { logApiRouteError } from '@/lib/api/log'

export const dynamic = 'force-dynamic'

const waitlistSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export async function POST(request: Request) {
  try {
    const body = await validateBody(request, waitlistSchema)

    await prisma.feedbackWidgetWaitlist.upsert({
      where: { email: body.email },
      update: {},
      create: { email: body.email }
    })

    return ok({ success: true })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
