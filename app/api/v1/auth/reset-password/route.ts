export const dynamic = 'force-dynamic'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/api/validate'
import { ok, badRequest, serverError } from '@/lib/api/response'
import { z } from 'zod'
import { logApiRouteError } from '@/lib/api/log'

const ResetPasswordSchema = z.object({
  password: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    const body = await validateBody(request, ResetPasswordSchema)
    const { supabase, applySupabaseCookies } = createSupabaseRouteHandlerClient(request)

    const { error } = await supabase.auth.updateUser({
      password: body.password,
    })

    if (error) {
      return badRequest('Password reset failed')
    }

    return applySupabaseCookies(ok({ message: 'Password updated successfully' }))
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

