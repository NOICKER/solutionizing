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
import posthog from 'posthog-js'
import { toast } from '@/components/ui/sonner'
import { apiFetch } from '@/lib/api/client'
import { identifyUser } from '@/lib/analytics/identify'
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
  refetch: () => Promise<User | null>
  applyRoleSelection: (role: Exclude<UserRole, 'ADMIN' | null>, displayName: string) => void
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

  const applyRoleSelection = useCallback(
    (role: Exclude<UserRole, 'ADMIN' | null>, displayName: string) => {
      setUser((currentUser) => {
        if (!currentUser) {
          return currentUser
        }

        if (role === 'FOUNDER') {
          return {
            ...currentUser,
            role,
            founderProfile: {
              id: currentUser.founderProfile?.id ?? `pending-founder-${currentUser.id}`,
              displayName,
              coinBalance: currentUser.founderProfile?.coinBalance ?? 0,
            },
            testerProfile: null,
          }
        }

        return {
          ...currentUser,
          role,
          founderProfile: null,
          testerProfile: {
            id: currentUser.testerProfile?.id ?? `pending-tester-${currentUser.id}`,
            displayName,
            coinBalance: currentUser.testerProfile?.coinBalance ?? 0,
            reputationScore: currentUser.testerProfile?.reputationScore ?? 50,
            reputationTier: currentUser.testerProfile?.reputationTier ?? 'RELIABLE',
            isVerified: currentUser.testerProfile?.isVerified,
          },
        }
      })
      setIsAuthenticated(true)
    },
    []
  )

  const fetchCurrentUser = useCallback(
    async ({
      signal,
      skipSessionHandling = false,
    }: {
      signal?: AbortSignal
      skipSessionHandling?: boolean
    } = {}) => {
      try {
        const response = await apiFetch<MeResponse>('/api/v1/auth/me', {
          cache: 'no-store',
          signal,
          skipSessionHandling,
        })
        const normalizedUser = normalizeUser(response)
        applyUser(normalizedUser)
        return normalizedUser
      } catch {
        applyUser(null)
        return null
      }
    },
    [applyUser]
  )

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 8000)

    async function bootstrap() {
      try {
        if (!isMounted) {
          return
        }

        await fetchCurrentUser({
          skipSessionHandling: true,
          signal: controller.signal,
        })
      } catch {
        if (!isMounted) {
          return
        }
      } finally {
        window.clearTimeout(timeoutId)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [fetchCurrentUser])

  useEffect(() => {
    return registerSessionExpiredHandler((nextPath) => {
      applyUser(null)
      toast.error('Your session expired. Please sign in.')
      router.replace(`/auth?next=${encodeURIComponent(nextPath)}`)
    })
  }, [applyUser, router])

  useEffect(() => {
    if (!user) {
      posthog.reset()
      return
    }

    identifyUser(user.id, {
      role: user.role ?? 'UNASSIGNED',
      email: user.email,
    })
  }, [user])

  const refetch = useCallback(async () => {
    return fetchCurrentUser()
  }, [fetchCurrentUser])

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
      applyRoleSelection,
    }),
    [applyRoleSelection, isAuthenticated, isLoading, refetch, signOut, user]
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
