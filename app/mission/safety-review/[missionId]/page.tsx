import { RequireAuth } from '@/components/RequireAuth'
import { SafetyReviewPage } from '@/components/solutionizing/SafetyReviewPage'

export default function SafetyReviewRoutePage({
  params,
}: {
  params: { missionId: string }
}) {
  return (
    <RequireAuth role="FOUNDER">
      <SafetyReviewPage missionId={params.missionId} />
    </RequireAuth>
  )
}
