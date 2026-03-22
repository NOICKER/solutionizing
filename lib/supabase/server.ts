import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name, options) {
          try { cookieStore.set({ name, value: '', ...options, maxAge: 0 }) } catch {}
        },
      },
    }
  )
}

export function createSupabaseRouteHandlerClient(request: Request) {
  const cookieStore = cookies()
  const cookieResponse = new NextResponse()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) {
          cookieResponse.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieResponse.cookies.set({ name, value: '', ...options, maxAge: 0 })
        },
      },
    }
  )

  return {
    supabase,
    applySupabaseCookies(response: NextResponse) {
      cookieResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie)
      })

      return response
    },
  }
}
