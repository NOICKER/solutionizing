import { redirect } from 'next/navigation'
import { TesterDashboardPage as TesterDashboardAppPage } from '@/components/solutionizing/TesterDashboardPage'
import { getCurrentAppUser, hasCompletedOnboarding } from '@/lib/auth/current-user'

export default async function TesterDashboardPage() {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role === null) {
    redirect('/select-role')
  }

  if (user.role === 'FOUNDER') {
    redirect('/dashboard/founder')
  }

  if (user.role === 'ADMIN') {
    redirect('/dashboard/admin')
  }

  if (!hasCompletedOnboarding(user)) {
    redirect('/onboarding')
  }

  return <TesterDashboardAppPage />
}

