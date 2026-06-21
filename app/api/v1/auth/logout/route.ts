export const dynamic = 'force-dynamic'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api/middleware'
import { ok, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

export async function POST(request: Request) {
  try {
    const { supabase, applySupabaseCookies } = createSupabaseRouteHandlerClient(request)
    
    // We don't use requireAuth() here because if the user was deleted,
    // requireAuth() would throw 401 and prevent us from clearing the stale cookies locally.
    await supabase.auth.signOut().catch(() => {})
    
    const response = applySupabaseCookies(ok({ success: true }))

    // Force clear cookies because signOut() might fail if the user was deleted
    request.headers.get('cookie')?.split(';').forEach((cookie) => {
      const [name] = cookie.split('=')
      const trimmedName = name.trim()
      if (trimmedName.includes('-auth-token')) {
        response.cookies.set(trimmedName, '', { maxAge: 0, path: '/' })
      }
    })

    return response
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

