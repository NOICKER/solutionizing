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

  let redirectPath = type === 'recovery' ? '/auth/reset-password' : '/dashboard'

  try {
    let userId: string | null = null
    let userEmail: string | null = null
    let isEmailConfirmed = false

    if (tokenHash && type) {
      console.log('[auth:callback] Verifying OTP, type:', type)
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType,
      })
      if (error) {
        console.error('[auth:callback] verifyOtp error:', error.message)
      }

      userId = data.user?.id ?? null
      userEmail = data.user?.email ?? null
      isEmailConfirmed = !!data.user?.email_confirmed_at
    } else if (code) {
      console.log('[auth:callback] Exchanging code for session')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('[auth:callback] exchangeCodeForSession error:', error.message)
      }

      userId = data.user?.id ?? null
      userEmail = data.user?.email ?? null
      isEmailConfirmed = !!data.user?.email_confirmed_at
    }

    console.log('[auth:callback] userId:', userId, '| isEmailConfirmed:', isEmailConfirmed)

    if (userId) {
      try {
        // Upsert: create user record if it doesn't exist (e.g. first-time OAuth),
        // or update emailVerified if already present.
        let dbUser;
        try {
          dbUser = await prisma.user.upsert({
            where: { email: userEmail! },
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
        } catch (upsertError) {
          console.error('[auth:callback] Primary DB operation failed, retrying:', upsertError)
          try {
            dbUser = await prisma.user.upsert({
              where: { email: userEmail! },
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
          } catch (retryError) {
            console.error('[auth:callback] Retry failed:', retryError)
            await supabase.auth.signOut().catch(() => {})
            return applySupabaseCookies(new NextResponse('Internal Server Error', { status: 500 }))
          }
        }

        console.log('[auth:callback] dbUser.role:', dbUser.role)

        // Send new users (no role yet) to role selection instead of dashboard
        if (type !== 'recovery' && !dbUser.role) {
          redirectPath = '/select-role'
        }
      } catch (unexpectedError) {
        console.error('[auth:callback] Failed to process user:', unexpectedError)
        await supabase.auth.signOut().catch(() => {})
        return applySupabaseCookies(new NextResponse('Internal Server Error', { status: 500 }))
      }
    }
  } catch (error) {
    console.error('[auth:callback] Unexpected error in callback:', error)
    // On any unexpected failure, fall through to redirect with cookies applied
  }

  console.log('[auth:callback] Redirecting to:', redirectPath)
  return applySupabaseCookies(
    NextResponse.redirect(new URL(redirectPath, request.url))
  )
}
