export const dynamic = 'force-dynamic'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/api/validate'
import { ok, serverError } from '@/lib/api/response'
import { z } from 'zod'
import { logApiRouteError } from '@/lib/api/log'

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const body = await validateBody(request, ForgotPasswordSchema)
    const supabase = createSupabaseServerClient()

    await supabase.auth.resetPasswordForEmail(body.email, {
      redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/reset-password',
    })

    // Always return the same message — never reveal if email exists
    return ok({ 
      message: 'If that email exists you will receive a reset link shortly.' 
    })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

