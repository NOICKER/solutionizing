export const dynamic = 'force-dynamic'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api/middleware'
import { ok, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

export async function POST(request: Request) {
  try {
    await requireAuth()
    const { supabase, applySupabaseCookies } = createSupabaseRouteHandlerClient(request)
    await supabase.auth.signOut()
    return applySupabaseCookies(ok({ success: true }))
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

