"use client"

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface RequireAuthProps {
  children: React.ReactNode
  role?: 'FOUNDER' | 'TESTER'
}

function FullPageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf9f7] p-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((card) => (
            <div
              key={card}
              className="rounded-3xl border border-[#e5e4e0] bg-white p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-2xl bg-[#e5e4e0]" />
                <div className="h-3 w-24 animate-pulse rounded bg-[#e5e4e0]" />
              </div>
              <div className="mb-3 h-8 w-32 animate-pulse rounded bg-[#e5e4e0]" />
              <div className="mb-2 h-4 w-full animate-pulse rounded bg-[#e5e4e0]" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-[#e5e4e0]" />
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

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (!isAuthenticated) {
      const nextPath =
        typeof window === 'undefined'
          ? pathname
          : `${window.location.pathname}${window.location.search}`
      router.replace(`/auth?next=${encodeURIComponent(nextPath)}`)
      return
    }

    if (user?.role === null) {
      router.replace('/select-role')
      return
    }

    if (role && user?.role !== role) {
      if (user?.role === 'FOUNDER') {
        router.replace('/dashboard/founder')
        return
      }

      if (user?.role === 'TESTER') {
        router.replace('/dashboard/tester')
        return
      }

      router.replace('/')
    }
  }, [isAuthenticated, isLoading, pathname, role, router, user?.role])

  if (isLoading || !isAuthenticated || !user || user.role === null || (role && user.role !== role)) {
    return <FullPageLoadingSkeleton />
  }

  return <>{children}</>
}
