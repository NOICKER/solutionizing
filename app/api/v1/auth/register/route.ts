export const dynamic = 'force-dynamic'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { validateBody } from '@/lib/api/validate'
import { apiError, created, conflict, serverError } from '@/lib/api/response'
import { z } from 'zod'
import { logApiRouteError } from '@/lib/api/log'
import { Prisma } from '@prisma/client'

const RegisterSchema = z.object({
  email: z.string().email().max(255).transform(v => v.toLowerCase()),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    const rateLimitResponse = await enforceRateLimit(request, 'auth-register')

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await validateBody(request, RegisterSchema)
    const { supabase, applySupabaseCookies } = createSupabaseRouteHandlerClient(request)

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
    })

    if (error) {
      console.error('[register] Supabase error:', error)
      if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
        return apiError(
          'Too many sign up attempts. Please wait a few minutes and try again.',
          'EMAIL_RATE_LIMITED',
          429
        )
      }
      if (error.message.toLowerCase().includes('already registered')) {
        return conflict('Email already registered')
      }
      return serverError()
    }

    if (data?.user) {
      // Sync initial role to app_metadata
      try {
        await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
          app_metadata: { role: null },
        })
      } catch (error) {
        console.error('[register] Failed to sync Supabase metadata:', error)
      }

      await prisma.user.upsert({
        where: { id: data.user.id },
        update: {
          email: data.user.email!,
          emailVerified: !!data.user.email_confirmed_at,
        },
        create: {
          id: data.user.id,
          email: data.user.email!,
          emailVerified: !!data.user.email_confirmed_at,
        },
      })
    }

    return applySupabaseCookies(
      created({
        message: 'Verification email sent. Please check your inbox.'
      })
    )
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

