export interface AssignmentJobPayload {
  missionId: string
  isReassignment?: boolean // true if triggered by abandon/timeout
}
export interface TimeoutCheckPayload {
  assignmentId: string
}
export interface NotificationPayload {
  type: 'ASSIGNMENT_RECEIVED' | 'MISSION_APPROVED' | 'MISSION_REJECTED' | 'MISSION_COMPLETED'
  userId: string
  missionId?: string
  assignmentId?: string
  rejectionReason?: string
}
