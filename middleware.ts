import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const publicRoutes = new Set([
  '/',
  '/contact',
  '/privacy',
  '/terms',
  '/tester',
])

function redirectWithCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const redirectResponse = NextResponse.redirect(new URL(pathname, request.url))

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })

  return redirectResponse
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
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
          request.cookies.set({ name, value: '', ...options, maxAge: 0 })
          response.cookies.set({ name, value: '', ...options, maxAge: 0 })
        },
      },
    }
  )
  // Refresh session — required for Server Components to read auth state
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublicRoute = publicRoutes.has(path)
  const role = user?.app_metadata?.role
  const isResetPasswordRoute = path === '/reset-password' || path === '/auth/reset-password'

  const isAuthRoute = path.startsWith('/auth') || path.startsWith('/login') || path.startsWith('/register')
    || path.startsWith('/select-role') || path.startsWith('/forgot-password')
    || path.startsWith('/reset-password') || path.startsWith('/verify-email')
  const isAdminDashboardRoute = path === '/dashboard/admin' || path.startsWith('/dashboard/admin/')

  if (isAdminDashboardRoute) {
    if (!user) {
      return redirectWithCookies(request, response, '/login')
    }

    if (role !== 'ADMIN') {
      return redirectWithCookies(request, response, '/dashboard')
    }
  }

  // Not logged in: redirect to login unless on auth or public route
  if (!user && !isAuthRoute && !isPublicRoute) {
    return redirectWithCookies(request, response, '/auth')
  }

  if (user && path === '/') {
    return redirectWithCookies(request, response, '/dashboard')
  }

  if (user) {
    // Logged-in users routing
    if (isAuthRoute) {
      if (isResetPasswordRoute) {
        return response
      }

      if (path === '/select-role') {
        if (role === 'FOUNDER') return redirectWithCookies(request, response, '/dashboard/founder')
        if (role === 'TESTER') return redirectWithCookies(request, response, '/dashboard/tester')
        if (role === 'ADMIN') return redirectWithCookies(request, response, '/')
        // If no role, allow them to stay on /select-role
        return response
      }

      // Other auth routes (like /login)
      if (role === 'FOUNDER') return redirectWithCookies(request, response, '/dashboard/founder')
      if (role === 'TESTER') return redirectWithCookies(request, response, '/dashboard/tester')
      if (role === 'ADMIN') return redirectWithCookies(request, response, '/')

      // Logged in but no role
      return redirectWithCookies(request, response, '/select-role')
    }

    // Force role selection for non-auth routes
    if (!role && !isPublicRoute) {
      return redirectWithCookies(request, response, '/select-role')
    }

    // Role-based route protection
    if (path.startsWith('/dashboard/founder') || path.startsWith('/missions') || path.startsWith('/coins')) {
      if (role !== 'FOUNDER' && role !== 'ADMIN') {
        return redirectWithCookies(request, response, '/dashboard/tester')
      }
    }

    if (!isPublicRoute && (path.startsWith('/tester') || path.startsWith('/dashboard/tester'))) {
      if (role !== 'TESTER' && role !== 'ADMIN') {
        return redirectWithCookies(request, response, '/dashboard/founder')
      }
    }

    if (path.startsWith('/admin')) {
      if (role !== 'ADMIN') {
        return redirectWithCookies(request, response, '/')
      }
    }
  }
  return response
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
