import { RequireAuth } from '@/components/RequireAuth'
import { MissionStatusPage } from '@/components/solutionizing/MissionStatusPage'

export default function MissionStatusRoutePage({
  params,
}: {
  params: { missionId: string }
}) {
  return (
    <RequireAuth role="FOUNDER">
      <MissionStatusPage missionId={params.missionId} />
    </RequireAuth>
  )
}
