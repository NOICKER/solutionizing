import { createSupabaseServerClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/api/validate'
import { created, conflict, serverError } from '@/lib/api/response'
import { z } from 'zod'

const RegisterSchema = z.object({
  email: z.string().email().max(255).transform(v => v.toLowerCase()),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    const body = await validateBody(request, RegisterSchema)
    const supabase = createSupabaseServerClient()

    const { error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
    })

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        return conflict('Email already registered')
      }
      return serverError()
    }

    return created({ 
      message: 'Verification email sent. Please check your inbox.' 
    })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[register]', err)
    return serverError()
  }
}
