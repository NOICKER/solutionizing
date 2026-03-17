import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, badRequest, notFound, forbidden, serverError } from '@/lib/api/response'
import { applyRatingToReputation } from '@/lib/business/reputation'

type RateTesterBody = {
  assignmentId?: unknown
  score?: unknown
  flaggedLowEffort?: unknown
  note?: unknown
}

function isValidScore(score: unknown): score is number {
  return Number.isInteger(score) && (score as number) >= 1 && (score as number) <= 5
}

export async function POST(
  request: Request,
  context: { params: { missionId: string } }
) {
  try {
    const founder = await requireRole('FOUNDER')
    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }
    let body: RateTesterBody
    try {
      body = await request.json()
    } catch {
      return badRequest('Invalid JSON body')
    }
    const { assignmentId, score, flaggedLowEffort, note } = body
    if (typeof assignmentId !== 'string' || assignmentId.trim().length === 0) {
      return badRequest('assignmentId is required')
    }
    if (!isValidScore(score)) {
      return badRequest('score must be an integer between 1 and 5')
    }
    if (typeof flaggedLowEffort !== 'boolean') {
      return badRequest('flaggedLowEffort must be a boolean')
    }
    if (note !== undefined && note !== null && typeof note !== 'string') {
      return badRequest('note must be a string when provided')
    }
    const assignment = await prisma.missionAssignment.findFirst({
      where: {
        id: assignmentId,
        missionId: context.params.missionId,
      },
      select: {
        id: true,
        status: true,
        testerId: true,
        mission: { select: { founderId: true } },
        rating: { select: { id: true } },
      },
    })
    if (!assignment) {
      return notFound('Assignment')
    }
    if (assignment.mission.founderId !== founder.founderProfile.id) {
      return forbidden()
    }
    if (assignment.status !== 'COMPLETED') {
      return badRequest('Only completed assignments can be rated')
    }
    if (assignment.rating) {
      return badRequest('Rating already exists for this assignment')
    }
    const rating = await prisma.testerRating.create({
      data: {
        assignmentId: assignment.id,
        founderId: founder.founderProfile.id,
        testerId: assignment.testerId,
        score,
        flaggedLowEffort,
        note: typeof note === 'string' ? note : null,
      },
    })
    await applyRatingToReputation(assignment.testerId, score, flaggedLowEffort)
    return ok(rating)
  } catch (err) {
    if (err instanceof Response) return err
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return badRequest('Rating already exists for this assignment')
    }
    console.error('[missions:rate-tester]', err)
    return serverError()
  }
}
