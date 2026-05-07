import { redirect } from 'next/navigation'
import { TesterDashboardPage as TesterDashboardAppPage } from '@/components/solutionizing/TesterDashboardPage'
import { getCurrentAppUser, hasCompletedOnboarding } from '@/lib/auth/current-user'
import { getTesterDashboardInitialData } from '@/lib/dashboard-initial-data'

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

  if (!user.testerProfile) {
    redirect('/select-role')
  }

  const initialData = await getTesterDashboardInitialData(user.testerProfile.id)

  return <TesterDashboardAppPage initialData={initialData} />
}
