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
  
  const response = NextResponse.redirect(new URL(next, request.url))
  return applySupabaseCookies(response)
}
