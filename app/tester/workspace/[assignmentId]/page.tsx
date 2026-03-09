import { TesterWorkspaceRoutePage } from '@/components/solutionizing/TesterWorkspacePage'

export default function TesterWorkspaceAssignmentPage({
  params,
}: {
  params: { assignmentId: string }
}) {
  return <TesterWorkspaceRoutePage assignmentId={params.assignmentId} />
}
