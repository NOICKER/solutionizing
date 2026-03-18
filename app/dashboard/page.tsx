import { redirect } from 'next/navigation'
import {
  getCurrentAppUser,
  getDashboardPathForRole,
  hasCompletedOnboarding,
} from '@/lib/auth/current-user'

export default async function DashboardRedirectPage() {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role === null) {
    redirect('/select-role')
  }

  if (!hasCompletedOnboarding(user)) {
    redirect('/onboarding')
  }

  redirect(getDashboardPathForRole(user.role))
}
