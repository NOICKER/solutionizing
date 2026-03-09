"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/sonner'
import { apiFetch } from '@/lib/api/client'
import { registerSessionExpiredHandler } from '@/lib/auth/session'

export type UserRole = 'FOUNDER' | 'TESTER' | 'ADMIN' | null

export interface User {
  id: string
  email: string
  role: UserRole
  emailVerified: boolean
  founderProfile: {
    id: string
    displayName: string
    coinBalance: number
  } | null
  testerProfile: {
    id: string
    displayName: string
    coinBalance: number
    reputationScore: number
    reputationTier: 'NEWCOMER' | 'RELIABLE' | 'TRUSTED' | 'ELITE'
    isVerified?: boolean
  } | null
}

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signOut: () => Promise<void>
  refetch: () => Promise<void>
}

type MeResponse = User | { user: User }

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function normalizeUser(payload: MeResponse | null | undefined) {
  if (!payload) {
    return null
  }

  return 'user' in payload ? payload.user : payload
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const applyUser = useCallback((nextUser: User | null) => {
    setUser(nextUser)
    setIsAuthenticated(Boolean(nextUser))
  }, [])

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      try {
        const response = await apiFetch<MeResponse>('/api/v1/auth/me', {
          skipSessionHandling: true,
        })

        if (!isMounted) {
          return
        }

        applyUser(normalizeUser(response))
      } catch {
        if (!isMounted) {
          return
        }

        applyUser(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      isMounted = false
    }
  }, [applyUser])

  useEffect(() => {
    return registerSessionExpiredHandler((nextPath) => {
      applyUser(null)
      toast.error('Your session expired. Please sign in.')
      router.replace(`/auth?next=${encodeURIComponent(nextPath)}`)
    })
  }, [applyUser, router])

  const refetch = useCallback(async () => {
    try {
      const response = await apiFetch<MeResponse>('/api/v1/auth/me')
      applyUser(normalizeUser(response))
    } catch {
      applyUser(null)
    }
  }, [applyUser])

  const signOut = useCallback(async () => {
    try {
      await apiFetch('/api/v1/auth/logout', {
        method: 'POST',
        skipSessionHandling: true,
      })
    } catch {
      // Ignore logout failures and clear local auth state regardless.
    } finally {
      applyUser(null)
      router.push('/')
    }
  }, [applyUser, router])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      signOut,
      refetch,
    }),
    [isAuthenticated, isLoading, refetch, signOut, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
