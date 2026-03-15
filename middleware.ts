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

  const isAuthRoute = path.startsWith('/auth') || path.startsWith('/login') || path.startsWith('/register')
    || path.startsWith('/select-role') || path.startsWith('/forgot-password')
    || path.startsWith('/reset-password') || path.startsWith('/verify-email')

  // Not logged in: redirect to login unless on auth or public route
  if (!user && !isAuthRoute && path !== '/') {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  if (user) {
    // Role comes from app_metadata set during register/login/select-role
    const role = user.app_metadata?.role

    // Logged-in users routing
    if (isAuthRoute) {
      if (path === '/select-role') {
        if (role === 'FOUNDER') return NextResponse.redirect(new URL('/dashboard/founder', request.url))
        if (role === 'TESTER') return NextResponse.redirect(new URL('/dashboard/tester', request.url))
        if (role === 'ADMIN') return NextResponse.redirect(new URL('/', request.url))
        // If no role, allow them to stay on /select-role
        return response
      }

      // Other auth routes (like /login)
      if (role === 'FOUNDER') return NextResponse.redirect(new URL('/dashboard/founder', request.url))
      if (role === 'TESTER') return NextResponse.redirect(new URL('/dashboard/tester', request.url))
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/', request.url))

      // Logged in but no role
      return NextResponse.redirect(new URL('/select-role', request.url))
    }

    // Force role selection for non-auth routes
    if (!role) {
      return NextResponse.redirect(new URL('/select-role', request.url))
    }

    // Role-based route protection
    if (path.startsWith('/dashboard/founder') || path.startsWith('/missions') || path.startsWith('/coins')) {
      if (role !== 'FOUNDER' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard/tester', request.url))
      }
    }

    if (path.startsWith('/tester') || path.startsWith('/dashboard/tester')) {
      if (role !== 'TESTER' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard/founder', request.url))
      }
    }

    if (path.startsWith('/admin')) {
      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }
  return response
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
