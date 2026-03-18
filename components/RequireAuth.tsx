"use client"

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface RequireAuthProps {
  children: React.ReactNode
  role?: 'FOUNDER' | 'TESTER' | 'ADMIN'
}

function FullPageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf9f7] p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((card) => (
            <div
              key={card}
              className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-2xl bg-[#e5e4e0] dark:bg-gray-700" />
                <div className="h-3 w-24 animate-pulse rounded bg-[#e5e4e0] dark:bg-gray-700" />
              </div>
              <div className="mb-3 h-8 w-32 animate-pulse rounded bg-[#e5e4e0] dark:bg-gray-700" />
              <div className="mb-2 h-4 w-full animate-pulse rounded bg-[#e5e4e0] dark:bg-gray-700" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-[#e5e4e0] dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RequireAuth({ children, role }: RequireAuthProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useAuth()
  const isRoleSelectionPage = pathname === '/select-role'
  const isAwaitingRoleSelection = user?.role === null
  const shouldAllowRoleSelection =
    isAuthenticated && !role && isRoleSelectionPage && isAwaitingRoleSelection
  const nextPath =
    typeof window === 'undefined'
      ? pathname
      : `${window.location.pathname}${window.location.search}`

  let redirectTarget: string | null = null

  if (!isLoading) {
    if (!isAuthenticated) {
      redirectTarget = `/auth?next=${encodeURIComponent(nextPath)}`
    } else if (isAwaitingRoleSelection && !shouldAllowRoleSelection) {
      redirectTarget = '/select-role'
    } else if (role && user?.role !== role) {
      if (user?.role === 'FOUNDER') {
        redirectTarget = '/dashboard/founder'
      } else if (user?.role === 'TESTER') {
        redirectTarget = '/dashboard/tester'
      } else {
        redirectTarget = '/'
      }
    }
  }

  useEffect(() => {
    if (!redirectTarget) {
      return
    }

    router.replace(redirectTarget)

    const fallbackTimer = window.setTimeout(() => {
      window.location.replace(redirectTarget!)
    }, 250)

    return () => {
      window.clearTimeout(fallbackTimer)
    }
  }, [
    redirectTarget,
    router,
  ])

  if (
    isLoading ||
    !isAuthenticated ||
    !user ||
    (!shouldAllowRoleSelection && isAwaitingRoleSelection) ||
    (role && user.role !== role)
  ) {
    return <FullPageLoadingSkeleton />
  }

  return <>{children}</>
}
