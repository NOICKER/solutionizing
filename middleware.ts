import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  // Refresh session — required for Server Components to read auth state
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register')
    || path.startsWith('/select-role') || path.startsWith('/forgot-password')
    || path.startsWith('/reset-password') || path.startsWith('/verify-email')
  // Not logged in: redirect to login unless on auth or public route
  if (!user && !isAuthRoute && path !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (user) {
    // Logged-in users should not see auth pages
    if (isAuthRoute && path !== '/select-role') {
      // Get role from DB
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      const role = userData?.role
      if (role === 'FOUNDER') return NextResponse.redirect(new URL('/dashboard', request.url))
      if (role === 'TESTER') return NextResponse.redirect(new URL('/tester/dashboard', request.url))
    }
    // Role-based route protection
    if (path.startsWith('/dashboard') || path.startsWith('/missions') || path.startsWith('/coins')) {
      const { data: userData } = await supabase
        .from('users').select('role').eq('id', user.id).single()
      if (userData?.role !== 'FOUNDER')
        return NextResponse.redirect(new URL('/tester/dashboard', request.url))
    }
    if (path.startsWith('/tester')) {
      const { data: userData } = await supabase
        .from('users').select('role').eq('id', user.id).single()
      if (userData?.role !== 'TESTER')
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (path.startsWith('/admin')) {
      const { data: userData } = await supabase
        .from('users').select('role').eq('id', user.id).single()
      if (userData?.role !== 'ADMIN')
        return NextResponse.redirect(new URL('/', request.url))
    }
  }
  return response
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'],
}
