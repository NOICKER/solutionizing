import { NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const nextParam = searchParams.get('next')
  
  // Ensure we only redirect to relative paths to prevent open redirects
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/login'
  
  const { supabase, applySupabaseCookies } = createSupabaseRouteHandlerClient(request)
  
  await supabase.auth.signOut().catch(() => {})
  
  const response = applySupabaseCookies(NextResponse.redirect(new URL(next, request.url)))
  
  // Force clear cookies because signOut() might fail if the user was deleted,
  // leaving stale auth cookies behind and causing a redirect loop.
  request.headers.get('cookie')?.split(';').forEach((cookie) => {
    const [name] = cookie.split('=')
    const trimmedName = name.trim()
    if (trimmedName.includes('-auth-token')) {
      response.cookies.set(trimmedName, '', { maxAge: 0, path: '/' })
    }
  })

  return response
}
