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

    if (!userEmail) {
      console.error('[auth:callback] Missing email from Supabase Auth')
      await supabase.auth.signOut().catch(() => { })
      return applySupabaseCookies(
        NextResponse.redirect(new URL('/login?error=missing_email', request.url))
      )
    }

    if (userId) {
      try {
        let dbUser;
        try {
          dbUser = await prisma.user.upsert({
            where: { id: userId },
            update: {
              email: userEmail,
              emailVerified: isEmailConfirmed || undefined,
            },
            create: {
              id: userId,
              email: userEmail,
              emailVerified: isEmailConfirmed,
            },
            select: { id: true, email: true, role: true },
          })
          console.log('[auth:callback] Prisma upsert SUCCEEDED. DB User returned:', {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role
          })
        } catch (upsertError: any) {
          console.error('[auth:callback] Primary DB operation failed. Error name:', upsertError?.name, 'Code:', upsertError?.code, 'Message:', upsertError?.message)

          // Prisma P2002 means a Unique Constraint Violation. Since we upsert by ID, 
          // this guarantees the conflict is on the email address.
          if (upsertError?.code === 'P2002') {
            console.error('[auth:callback] Duplicate email constraint hit. Redirecting.')
            await supabase.auth.signOut().catch(() => { })
            return applySupabaseCookies(
              NextResponse.redirect(new URL('/login?error=account_conflict', request.url))
            )
          }

          // Throw non-P2002 errors down to the unexpected error handler
          throw upsertError
        }

        console.log('[auth:callback] dbUser.role:', dbUser.role)

        if (type !== 'recovery' && !dbUser.role) {
          redirectPath = '/select-role'
        }
      } catch (unexpectedError) {
        console.error('[auth:callback] Failed to process user:', unexpectedError)
        await supabase.auth.signOut().catch(() => { })
        return applySupabaseCookies(
          NextResponse.redirect(new URL('/login?error=auth_error', request.url))
        )
      }
    }
  } catch (error) {
    console.error('[auth:callback] Unexpected error in callback:', error)
    return applySupabaseCookies(
      NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    )
  }

  console.log('[auth:callback] Redirecting to:', redirectPath)
  return applySupabaseCookies(
    NextResponse.redirect(new URL(redirectPath, request.url))
  )
}
