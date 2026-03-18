import { requireRole } from '@/lib/api/middleware'
import { ok, serverError } from '@/lib/api/response'
import { COIN_PACKS } from '@/lib/business/coins'
import { logApiRouteError } from '@/lib/api/log'

export async function GET(request: Request) {
  try {
    await requireRole('FOUNDER')

    return ok(COIN_PACKS)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

