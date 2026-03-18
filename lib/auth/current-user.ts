import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export type AppRole = 'FOUNDER' | 'TESTER' | 'ADMIN' | null
export type PreferredDevice = 'desktop' | 'mobile' | 'both'

export interface CurrentAppUser {
  id: string
  email: string
  role: AppRole
  founderProfile: {
    id: string
    displayName: string
    companyName: string | null
    darkMode: boolean
    onboardingCompleted: boolean
  } | null
  testerProfile: {
    id: string
    displayName: string
    darkMode: boolean
    onboardingCompleted: boolean
    expertiseTags: string[]
    preferredDevice: PreferredDevice | null
  } | null
}

export function getDashboardPathForRole(role: Exclude<AppRole, null>) {
  if (role === 'FOUNDER') {
    return '/dashboard/founder'
  }

  if (role === 'TESTER') {
    return '/dashboard/tester'
  }

  return '/dashboard/admin'
}

export function hasCompletedOnboarding(user: Pick<CurrentAppUser, 'role' | 'founderProfile' | 'testerProfile'>) {
  if (user.role === 'FOUNDER') {
    return Boolean(user.founderProfile?.onboardingCompleted)
  }

  if (user.role === 'TESTER') {
    return Boolean(user.testerProfile?.onboardingCompleted)
  }

  return true
}

export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
  const supabase = createSupabaseServerClient()
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser()

  if (error || !authUser) {
    return null
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      role: true,
      isDeleted: true,
      founderProfile: {
        select: {
          id: true,
          displayName: true,
          companyName: true,
          darkMode: true,
          onboardingCompleted: true,
        },
      },
      testerProfile: {
        select: {
          id: true,
          displayName: true,
          darkMode: true,
          onboardingCompleted: true,
          expertiseTags: true,
          preferredDevice: true,
        },
      },
    },
  })

  if (!dbUser || dbUser.isDeleted) {
    return null
  }

  const normalizedRole: AppRole =
    dbUser.role === 'ADMIN'
      ? 'ADMIN'
      : dbUser.founderProfile
        ? 'FOUNDER'
        : dbUser.testerProfile
          ? 'TESTER'
          : null

  return {
    id: dbUser.id,
    email: dbUser.email,
    role: normalizedRole,
    founderProfile: dbUser.founderProfile,
    testerProfile: dbUser.testerProfile as CurrentAppUser['testerProfile'],
  }
}
