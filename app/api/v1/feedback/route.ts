import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/middleware'
import { ok, serverError } from '@/lib/api/response'
import { validateBody } from '@/lib/api/validate'
import { logApiRouteError } from '@/lib/api/log'

export const dynamic = 'force-dynamic'

const feedbackSchema = z.object({
  message: z.string().min(1, "Message is required"),
  category: z.string(),
  page: z.string(),
  screenshotUrl: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    let userId = null
    try {
      const user = await requireAuth()
      userId = user.id
    } catch {
      // Anonymous user
    }

    const body = await validateBody(request, feedbackSchema)

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        message: body.message,
        category: body.category,
        page: body.page,
        screenshotUrl: body.screenshotUrl,
      }
    })

    return ok({ id: feedback.id })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
