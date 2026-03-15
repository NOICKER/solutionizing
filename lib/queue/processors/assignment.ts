import { assignTestersToMission } from '@/lib/business/assignment'
import type { AssignmentJobPayload } from '@/types/jobs'

export async function processAssignmentJob({ missionId }: AssignmentJobPayload) {
  console.log(`[AssignmentWorker] Processing mission ${missionId}`)

  const assignments = await assignTestersToMission(missionId)
  const { notificationQueue } = require('../index') as {
    notificationQueue: {
      add: (name: string, payload: {
        type: 'ASSIGNMENT_RECEIVED'
        userId: string
        missionId: string
        assignmentId: string
      }) => Promise<unknown>
    }
  }

  await Promise.all(
    assignments.map((assignment) =>
      notificationQueue.add('notify', {
        type: 'ASSIGNMENT_RECEIVED',
        userId: assignment.userId,
        missionId: assignment.missionId,
        assignmentId: assignment.assignmentId,
      })
    )
  )
}
