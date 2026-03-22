"use client"

import { usePathname } from 'next/navigation'
import { ThemeProvider } from '@/context/ThemeContext'

function isThemeManagedPath(pathname: string) {
  return pathname === '/onboarding' || pathname.startsWith('/dashboard') || pathname.startsWith('/mission')
}

export function AppThemeBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (!isThemeManagedPath(pathname)) {
    return <>{children}</>
  }

  return <ThemeProvider>{children}</ThemeProvider>
}
