import { redirect } from 'next/navigation'
import { ThemeProvider } from '@/context/ThemeContext'
import { FounderOnboarding } from '@/components/solutionizing/onboarding/FounderOnboarding'
import { TesterOnboarding } from '@/components/solutionizing/onboarding/TesterOnboarding'
import { getCurrentAppUser, hasCompletedOnboarding } from '@/lib/auth/current-user'

export default async function OnboardingPage() {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role === null) {
    redirect('/select-role')
  }

  if (user.role === 'ADMIN') {
    redirect('/dashboard/admin')
  }

  if (!user.founderProfile && !user.testerProfile) {
    redirect('/select-role')
  }

  if (hasCompletedOnboarding(user)) {
    redirect('/dashboard')
  }

  return (
    <ThemeProvider>
      {user.role === 'FOUNDER' && user.founderProfile ? (
        <FounderOnboarding
          initialDisplayName={user.founderProfile.displayName}
          initialCompanyName={user.founderProfile.companyName}
        />
      ) : user.role === 'TESTER' && user.testerProfile ? (
        <TesterOnboarding
          initialDisplayName={user.testerProfile.displayName}
          initialExpertiseTags={user.testerProfile.expertiseTags}
          initialPreferredDevice={user.testerProfile.preferredDevice}
        />
      ) : null}
    </ThemeProvider>
  )
}
