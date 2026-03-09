import { requireRole } from '@/lib/api/middleware'
import { ok, serverError } from '@/lib/api/response'
import { COIN_PACKS } from '@/lib/business/coins'

export async function GET(request: Request) {
  try {
    await requireRole('FOUNDER')

    return ok(COIN_PACKS)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[coins:packs:get]', err)
    return serverError()
  }
}
