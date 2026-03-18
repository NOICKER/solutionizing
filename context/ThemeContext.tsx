"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from '@/components/ui/sonner'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, isApiClientError } from '@/lib/api/client'

type ThemeProfileResponse = {
  darkMode: boolean
}

type DashboardRole = 'FOUNDER' | 'TESTER'
type StoredTheme = 'light' | 'dark'

interface ThemeContextValue {
  darkMode: boolean
  toggleDarkMode: () => void
}

const profileRouteByRole: Record<DashboardRole, '/api/v1/founder/profile' | '/api/v1/tester/profile'> = {
  FOUNDER: '/api/v1/founder/profile',
  TESTER: '/api/v1/tester/profile',
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
const THEME_STORAGE_KEY = 'solutionizing-theme'

function getThemeErrorMessage(error: unknown) {
  if (isApiClientError(error) && error.code === 'NETWORK_ERROR') {
    return 'Check your internet connection'
  }

  if (isApiClientError(error)) {
    return error.message
  }

  return 'Unable to update theme preference.'
}

function getThemeSyncErrorMessage(error: unknown) {
  if (isApiClientError(error) && error.code === 'NETWORK_ERROR') {
    return 'Theme changed locally. Check your internet connection to sync it.'
  }

  return 'Theme changed locally, but we could not save your preference.'
}

function readStoredTheme(): boolean | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as StoredTheme | null

    if (storedTheme === 'dark') {
      return true
    }

    if (storedTheme === 'light') {
      return false
    }
  } catch {
    // Ignore storage access issues and fall back to runtime state.
  }

  return null
}

function writeStoredTheme(darkMode: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light')
  } catch {
    // Ignore storage access issues and keep the in-memory preference.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const [darkMode, setDarkMode] = useState(false)
  const mutationIdRef = useRef(0)
  const hasStoredThemeRef = useRef(false)
  const hasInitializedThemeRef = useRef(false)

  const role =
    user?.role === 'FOUNDER' || user?.role === 'TESTER'
      ? user.role
      : null

  const profileRoute = role ? profileRouteByRole[role] : null

  useEffect(() => {
    const rootElement = document.documentElement

    rootElement.classList.toggle('dark', darkMode)

    if (hasInitializedThemeRef.current) {
      writeStoredTheme(darkMode)
    }
  }, [darkMode])

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    const storedTheme = readStoredTheme()

    hasStoredThemeRef.current = storedTheme !== null
    hasInitializedThemeRef.current = true

    if (storedTheme !== null) {
      setDarkMode(storedTheme)
    }
  }, [])

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (!profileRoute) {
      return
    }

    const requestRoute = profileRoute
    const controller = new AbortController()
    const loadRequestId = mutationIdRef.current

    async function loadThemePreference() {
      try {
        const response = await apiFetch<ThemeProfileResponse>(requestRoute, {
          cache: 'no-store',
          signal: controller.signal,
        })

        if (
          !controller.signal.aborted
          && mutationIdRef.current === loadRequestId
          && !hasStoredThemeRef.current
        ) {
          setDarkMode(response.darkMode)
        }
      } catch (error) {
        if (controller.signal.aborted || mutationIdRef.current !== loadRequestId) {
          return
        }

        toast.error(getThemeErrorMessage(error))
      }
    }

    void loadThemePreference()

    return () => {
      controller.abort()
    }
  }, [isLoading, profileRoute])

  const persistDarkMode = useCallback(
    async (nextValue: boolean, previousValue: boolean, requestRoute: string, requestId: number) => {
      try {
        await apiFetch(requestRoute, {
          method: 'PATCH',
          body: { darkMode: nextValue },
        })
      } catch (error) {
        if (mutationIdRef.current !== requestId) {
          return
        }

        toast.error(getThemeSyncErrorMessage(error))
      }
    },
    []
  )

  const toggleDarkMode = useCallback(() => {
    setDarkMode((currentValue) => {
      const nextValue = !currentValue
      const requestId = mutationIdRef.current + 1

      mutationIdRef.current = requestId
      hasStoredThemeRef.current = true

      if (profileRoute) {
        void persistDarkMode(nextValue, currentValue, profileRoute, requestId)
      }

      return nextValue
    })
  }, [persistDarkMode, profileRoute])

  const value = useMemo<ThemeContextValue>(
    () => ({
      darkMode,
      toggleDarkMode,
    }),
    [darkMode, toggleDarkMode]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }

  return context
}
