import { assignTestersToMission } from '@/lib/business/assignment'
import type { AssignmentJobPayload } from '@/types/jobs'

/**
 * Processes a tester-assignment job.
 * Returns the list of assignments so the caller (queue/index.ts) can enqueue
 * notification jobs — this avoids a circular import back into queue/index.
 */
export async function processAssignmentJob({ missionId }: AssignmentJobPayload) {
  console.log(`[AssignmentWorker] Processing mission ${missionId}`)

  const assignments = await assignTestersToMission(missionId)

  console.log(
    `[AssignmentWorker] Assigned ${assignments.length} tester(s) for mission ${missionId}`
  )

  return assignments
}
