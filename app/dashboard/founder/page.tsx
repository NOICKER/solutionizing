import { redirect } from 'next/navigation'
import { FounderDashboardPage as FounderDashboardAppPage } from '@/components/solutionizing/FounderDashboardPage'
import {
  getCurrentAppUser,
  getPreferredDashboardPath,
  hasCompletedOnboardingForRole,
  hasRole,
} from '@/lib/auth/current-user'
import { getFounderDashboardInitialData } from '@/lib/dashboard-initial-data'

export default async function FounderDashboardPage() {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect('/auth/logout?next=/login')
  }

  if (user.role === null) {
    redirect('/select-role')
  }

  if (user.role === 'ADMIN') {
    redirect('/dashboard/admin')
  }

  if (!hasRole(user, 'FOUNDER')) {
    redirect(getPreferredDashboardPath(user))
  }

  if (!user.founderProfile) {
    redirect('/select-role')
  }

  if (!hasCompletedOnboardingForRole(user, 'FOUNDER')) {
    redirect('/onboarding')
  }

  const initialData = await getFounderDashboardInitialData(user.founderProfile.id)

  return <FounderDashboardAppPage initialData={initialData} />
}
