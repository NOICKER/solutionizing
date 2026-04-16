export const dynamic = 'force-dynamic'
import { Difficulty } from '@prisma/client'
import { z } from 'zod'
import { requireRole } from '@/lib/api/middleware'
import { validateBody } from '@/lib/api/validate'
import { ok, notFound, serverError } from '@/lib/api/response'
import { computeMissionCoinCost } from '@/lib/business/coins'
import { logApiRouteError } from '@/lib/api/log'

const EstimateMissionCostSchema = z.object({
  difficulty: z.nativeEnum(Difficulty),
  testersRequired: z.number().int().min(5).max(50),
})

export async function POST(request: Request) {
  try {
    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    const body = await validateBody(request, EstimateMissionCostSchema)

    return ok(computeMissionCoinCost(body.difficulty, body.testersRequired))
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
