import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { EmailOtpType } from '@supabase/gotrue-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const { supabase, applySupabaseCookies } = createSupabaseRouteHandlerClient(request)
  let userId: string | null = null
  let userEmail: string | null = null
  let isEmailConfirmed = false

  if (tokenHash && type) {
    const { data } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    })

    userId = data.user?.id ?? null
    userEmail = data.user?.email ?? null
    isEmailConfirmed = !!data.user?.email_confirmed_at
  } else if (code) {
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    userId = data.user?.id ?? null
    userEmail = data.user?.email ?? null
    isEmailConfirmed = !!data.user?.email_confirmed_at
  }

  let redirectPath = type === 'recovery' ? '/auth/reset-password' : '/dashboard'

  if (userId) {
    try {
      // Upsert: create user record if it doesn't exist (e.g. first-time OAuth),
      // or update emailVerified if already present.
      const dbUser = await prisma.user.upsert({
        where: { id: userId },
        update: {
          emailVerified: isEmailConfirmed || undefined,
        },
        create: {
          id: userId,
          email: userEmail!,
          emailVerified: isEmailConfirmed,
        },
        select: { role: true },
      })

      // Send new users (no role yet) to role selection instead of dashboard
      if (type !== 'recovery' && !dbUser.role) {
        redirectPath = '/select-role'
      }
    } catch (error) {
      console.error('[auth:callback] Failed to upsert user:', error)
    }
  }

  return applySupabaseCookies(
    NextResponse.redirect(new URL(redirectPath, request.url))
  )
}
