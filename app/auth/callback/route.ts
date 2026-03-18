import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { EmailOtpType } from '@supabase/gotrue-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const supabase = createSupabaseServerClient()
  let userId: string | null = null
  let isEmailConfirmed = false

  if (tokenHash && type) {
    const { data } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    })

    userId = data.user?.id ?? null
    isEmailConfirmed = !!data.user?.email_confirmed_at
  } else if (code) {
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    userId = data.user?.id ?? null
    isEmailConfirmed = !!data.user?.email_confirmed_at
  }

  if (userId && isEmailConfirmed) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      })
    } catch (error) {
      console.error('[auth:callback] Failed to sync emailVerified:', error)
    }
  }

  return NextResponse.redirect(
    new URL('/select-role', request.url)
  )
}
