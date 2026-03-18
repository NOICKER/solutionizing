import { redirect } from 'next/navigation'
import { FounderDashboardPage as FounderDashboardAppPage } from '@/components/solutionizing/FounderDashboardPage'
import { getCurrentAppUser, hasCompletedOnboarding } from '@/lib/auth/current-user'

export default async function FounderDashboardPage() {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role === null) {
    redirect('/select-role')
  }

  if (user.role === 'TESTER') {
    redirect('/dashboard/tester')
  }

  if (user.role === 'ADMIN') {
    redirect('/dashboard/admin')
  }

  if (!hasCompletedOnboarding(user)) {
    redirect('/onboarding')
  }

  return <FounderDashboardAppPage />
}

