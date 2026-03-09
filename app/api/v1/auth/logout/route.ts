import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api/middleware'
import { ok, serverError } from '@/lib/api/response'

export async function POST(request: Request) {
  try {
    await requireAuth()
    const supabase = createSupabaseServerClient()
    await supabase.auth.signOut()
    return ok({ success: true })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[logout]', err)
    return serverError()
  }
}
