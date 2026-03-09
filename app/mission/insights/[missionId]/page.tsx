import { RequireAuth } from '@/components/RequireAuth'
import { MissionInsightsPage } from '@/components/solutionizing/MissionInsightsPage'

export default function MissionInsightsRoutePage({
  params,
}: {
  params: { missionId: string }
}) {
  return (
    <RequireAuth role="FOUNDER">
      <MissionInsightsPage missionId={params.missionId} />
    </RequireAuth>
  )
}
