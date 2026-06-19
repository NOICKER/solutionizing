import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export type AppRole = 'FOUNDER' | 'TESTER' | 'ADMIN' | null
export type DashboardRole = 'FOUNDER' | 'TESTER'
export type PreferredDevice = 'desktop' | 'mobile' | 'both'

export interface CurrentAppUser {
  id: string
  email: string
  role: AppRole
  roles: DashboardRole[]
  founderProfile: {
    id: string
    displayName: string
    companyName: string | null
    onboardingCompleted: boolean
  } | null
  testerProfile: {
    id: string
    displayName: string
    onboardingCompleted: boolean
    expertiseTags: string[]
    preferredDevice: PreferredDevice | null
  } | null
}

type DashboardRoleSource = {
  founderProfile: unknown
  testerProfile: unknown
}

type OnboardingRoleSource = {
  founderProfile: { onboardingCompleted: boolean } | null
  testerProfile: { onboardingCompleted: boolean } | null
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

export function getDashboardRoles(user: DashboardRoleSource) {
  const founderRoles: DashboardRole[] = user.founderProfile ? ['FOUNDER'] : []
  const testerRoles: DashboardRole[] = user.testerProfile ? ['TESTER'] : []

  return [...founderRoles, ...testerRoles]
}

export function hasRole(
  user: Pick<CurrentAppUser, 'role' | 'roles'>,
  role: Exclude<AppRole, null>
) {
  if (role === 'ADMIN') {
    return user.role === 'ADMIN'
  }

  return user.roles.includes(role)
}

export function getPreferredDashboardPath(user: Pick<CurrentAppUser, 'role' | 'roles'>) {
  if (user.role === 'ADMIN') {
    return getDashboardPathForRole('ADMIN')
  }

  if (user.role && hasRole(user, user.role)) {
    return getDashboardPathForRole(user.role)
  }

  const fallbackRole = user.roles[0]

  return fallbackRole ? getDashboardPathForRole(fallbackRole) : '/select-role'
}

export function hasCompletedOnboardingForRole(
  user: OnboardingRoleSource,
  role: DashboardRole
) {
  if (role === 'FOUNDER') {
    return Boolean(user.founderProfile?.onboardingCompleted)
  }

  return Boolean(user.testerProfile?.onboardingCompleted)
}

export function hasCompletedOnboarding(user: Pick<CurrentAppUser, 'role' | 'roles'> & OnboardingRoleSource) {
  if (user.role === 'ADMIN') {
    return true
  }

  if (user.role && hasRole(user, user.role)) {
    return hasCompletedOnboardingForRole(user, user.role)
  }

  return user.roles.every((role) => hasCompletedOnboardingForRole(user, role))
}

export function getOnboardingRole(user: Pick<CurrentAppUser, 'role' | 'roles'> & OnboardingRoleSource) {
  if (user.role !== 'ADMIN' && user.role && hasRole(user, user.role) && !hasCompletedOnboardingForRole(user, user.role)) {
    return user.role
  }

  return user.roles.find((role) => !hasCompletedOnboardingForRole(user, role)) ?? null
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
          onboardingCompleted: true,
        },
      },
      testerProfile: {
        select: {
          id: true,
          displayName: true,
          onboardingCompleted: true,
          expertiseTags: true,
          preferredDevice: true,
        },
      },
    },
  })

  if (!dbUser || dbUser.isDeleted) {
    // Kill the Supabase session and clear auth cookies so the middleware
    // stops treating this session as valid (prevents redirect loops).
    await supabase.auth.signOut().catch(() => {})
    return null
  }

  const roles = getDashboardRoles(dbUser)
  const normalizedRole: AppRole =
    dbUser.role === 'ADMIN'
      ? 'ADMIN'
      : roles.includes(dbUser.role as DashboardRole)
        ? (dbUser.role as DashboardRole)
        : roles[0] ?? null

  return {
    id: dbUser.id,
    email: dbUser.email,
    role: normalizedRole,
    roles,
    founderProfile: dbUser.founderProfile,
    testerProfile: dbUser.testerProfile as CurrentAppUser['testerProfile'],
  }
}
