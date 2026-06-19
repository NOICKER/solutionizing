import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const publicRoutes = new Set([
  '/',
  '/contact',
  '/privacy',
  '/terms',
  '/tester',
  '/pricing',
  '/methodology'
])

function redirectWithCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const redirectResponse = NextResponse.redirect(new URL(pathname, request.url))

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })

  return redirectResponse
}

function hasAuthCookieHint(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.includes('-auth-token'))
}

function clearAuthCookiesAndRedirect(request: NextRequest, pathname: string) {
  const cleanRedirect = NextResponse.redirect(new URL(pathname, request.url))

  request.cookies.getAll()
    .filter((cookie) => cookie.name.includes('-auth-token'))
    .forEach((cookie) => {
      cleanRedirect.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
    })

  return cleanRedirect
}

function getDashboardPathForRole(role: unknown) {
  if (role === 'FOUNDER') {
    return '/dashboard/founder'
  }

  if (role === 'TESTER') {
    return '/dashboard/tester'
  }

  if (role === 'ADMIN') {
    return '/dashboard/admin'
  }

  return null
}

function createMiddlewareSupabaseClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
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
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const path = request.nextUrl.pathname

  // Let specific auth endpoints handle their own logic without middleware interference.
  // Must be skipped entirely — no session check, no redirect.
  if (path === '/auth/callback' || path.startsWith('/auth/callback/') || path === '/auth/logout') {
    return response
  }

  // Let API routes handle their own auth logic and return JSON responses,
  // instead of being redirected to UI pages.
  // This also implicitly covers Cron routes which authenticate via CRON_SECRET header.
  if (path.startsWith('/api/')) {
    return response
  }

  const isPublicRoute = publicRoutes.has(path)

  // Redirect logged-in users away from the landing page in one hop.
  if (path === '/') {
    if (hasAuthCookieHint(request)) {
      const supabase = createMiddlewareSupabaseClient(request, response)
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      const dashboardPath = getDashboardPathForRole(user?.app_metadata?.role)

      if (dashboardPath) {
        return redirectWithCookies(request, response, dashboardPath)
      }

      if (user) {
        return redirectWithCookies(request, response, '/select-role')
      }

      return clearAuthCookiesAndRedirect(request, '/')
    }
  }

  // Skip expensive auth check for public routes
  if (isPublicRoute) {
    return response
  }

  const supabase = createMiddlewareSupabaseClient(request, response)

  // Refresh session — required for Server Components to read auth state
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  // Guard: JWT cookie present but session invalid (e.g. missing `sub` claim).
  // Clear the stale cookies and redirect to landing instead of a raw 403 loop.
  if (!user) {
    if (hasAuthCookieHint(request)) {
      return clearAuthCookiesAndRedirect(request, '/')
    }
  }

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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
