import {
  AssetType,
  AssignmentStatus,
  Difficulty,
  QuestionType,
  RepTier,
} from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { validateBody } from '@/lib/api/validate'
import { ok, apiError, badRequest, notFound, serverError } from '@/lib/api/response'
import { computeMissionCoinCost } from '@/lib/business/coins'
import { checkUrl } from '@/lib/safety/urlCheck'
import { checkMissionContent } from '@/lib/safety/contentCheck'
import { z } from 'zod'
import { logApiRouteError } from '@/lib/api/log'

const MissionAssetSchema = z.object({
  type: z.nativeEnum(AssetType),
  url: z.string().optional(),
  text: z.string().max(500).optional(),
  label: z.string().max(100).optional(),
  order: z.number().int().default(0),
}).superRefine((value, ctx) => {
  if (value.type === AssetType.TEXT_DESCRIPTION) {
    if (!value.text?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Text assets must include a description',
        path: ['text'],
      })
    }

    return
  }

  const urlResult = z.string().url().safeParse(value.url)

  if (!urlResult.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'This asset needs a valid URL',
      path: ['url'],
    })
  }
})

const MissionQuestionSchema = z.object({
  order: z.number().int().min(1).max(6),
  type: z.nativeEnum(QuestionType),
  text: z.string().min(5).max(300),
  options: z.array(z.string().min(1)).min(2).max(5).optional(),
  isRequired: z.boolean().default(true),
}).superRefine((value, ctx) => {
  if (value.type === QuestionType.MULTIPLE_CHOICE && !value.options?.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Multiple choice questions must include 2 to 5 options',
      path: ['options'],
    })
  }
})

const UpdateMissionSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  goal: z.string().min(10).max(300).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  estimatedMinutes: z.number().int().min(2).max(4).optional(),
  testersRequired: z.number().int().min(5).max(50).optional(),
  assets: z.array(MissionAssetSchema).min(1).max(3).optional(),
  questions: z.array(MissionQuestionSchema).min(1).max(6).optional(),
}).superRefine((value, ctx) => {
  if (!value.questions) return

  const questionOrders = value.questions.map((question) => question.order)
  if (new Set(questionOrders).size !== questionOrders.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Duplicate question order values are not allowed',
      path: ['questions'],
    })
  }
})

function getMinRepTier(difficulty: Difficulty): RepTier {
  if (difficulty === Difficulty.HARD) {
    return RepTier.TRUSTED
  }

  return RepTier.NEWCOMER
}

async function assertMissionIsSafe(
  title: string,
  goal: string,
  questions: Array<{ text: string }>,
  assets: Array<{ type: AssetType; url?: string }>
) {
  const contentResult = checkMissionContent(title, goal, questions)
  if (!contentResult.safe) {
    throw badRequest(contentResult.reason ?? 'Mission content failed safety review')
  }

  for (const asset of assets) {
    if (asset.type !== AssetType.LINK || !asset.url) continue

    const urlResult = await checkUrl(asset.url)
    if (!urlResult.safe) {
      throw badRequest(urlResult.reason ?? 'Mission asset URL failed safety review')
    }
  }
}

async function findOwnedMission(missionId: string, founderId: string) {
  return prisma.mission.findFirst({
    where: { id: missionId, founderId },
    include: {
      assets: { orderBy: { order: 'asc' } },
      questions: { orderBy: { order: 'asc' } },
    },
  })
}

export async function GET(
  request: Request,
  context: { params: { missionId: string } }
) {
  try {
    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    const mission = await findOwnedMission(
      context.params.missionId,
      founder.founderProfile.id
    )

    if (!mission) {
      return notFound('Mission')
    }

    const assignments = await prisma.missionAssignment.findMany({
      where: { missionId: mission.id },
      select: { status: true },
    })

    const assignmentCounts: Record<AssignmentStatus, number> = {
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      ABANDONED: 0,
      TIMED_OUT: 0,
      MISSION_FULL: 0,
    }

    for (const assignment of assignments) {
      assignmentCounts[assignment.status] += 1
    }

    const completedAssignments = await prisma.missionAssignment.findMany({
      where: { missionId: mission.id, status: 'COMPLETED' },
      select: { id: true, rating: { select: { id: true } } },
    })

    return ok({
      ...mission,
      assignmentCounts,
      completedAssignments,
    })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

export async function PATCH(
  request: Request,
  context: { params: { missionId: string } }
) {
  try {
    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    const mission = await findOwnedMission(
      context.params.missionId,
      founder.founderProfile.id
    )

    if (!mission) {
      return notFound('Mission')
    }

    if (mission.status !== 'DRAFT') {
      return apiError('Mission is not editable', 'MISSION_NOT_EDITABLE', 400)
    }

    const body = await validateBody(request, UpdateMissionSchema)
    const effectiveTitle = body.title ?? mission.title
    const effectiveGoal = body.goal ?? mission.goal
    const effectiveDifficulty = body.difficulty ?? mission.difficulty
    const effectiveEstimatedMinutes = body.estimatedMinutes ?? mission.estimatedMinutes
    const effectiveTestersRequired = body.testersRequired ?? mission.testersRequired
    const effectiveQuestions = body.questions ?? mission.questions
    const effectiveAssets = body.assets ?? mission.assets

    await assertMissionIsSafe(
      effectiveTitle,
      effectiveGoal,
      effectiveQuestions,
      effectiveAssets
    )

    const { coinPerTester, coinPlatformFee, coinCostTotal } = computeMissionCoinCost(
      effectiveDifficulty,
      effectiveTestersRequired
    )

    const updatedMission = await prisma.$transaction(async (tx) => {
      if (body.assets !== undefined) {
        await tx.missionAsset.deleteMany({
          where: { missionId: mission.id },
        })
      }

      if (body.questions !== undefined) {
        await tx.missionQuestion.deleteMany({
          where: { missionId: mission.id },
        })
      }

      await tx.mission.update({
        where: { id: mission.id },
        data: {
          title: effectiveTitle,
          goal: effectiveGoal,
          difficulty: effectiveDifficulty,
          estimatedMinutes: effectiveEstimatedMinutes,
          testersRequired: effectiveTestersRequired,
          minRepTier: getMinRepTier(effectiveDifficulty),
          coinPerTester,
          coinPlatformFee,
          coinCostTotal,
        },
      })

      if (body.assets !== undefined) {
        await tx.missionAsset.createMany({
          data: [...body.assets]
            .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
            .map((asset) => ({
              missionId: mission.id,
              type: asset.type,
              url: asset.type === AssetType.TEXT_DESCRIPTION ? asset.text!.trim() : asset.url!.trim(),
              label: asset.label,
              order: asset.order,
            })),
        })
      }

      if (body.questions !== undefined) {
        await tx.missionQuestion.createMany({
          data: [...body.questions]
            .sort((left, right) => left.order - right.order)
            .map((question) => ({
              missionId: mission.id,
              order: question.order,
              type: question.type,
              text: question.text,
              options: question.options ?? [],
              isRequired: question.isRequired,
            })),
        })
      }

      return tx.mission.findUnique({
        where: { id: mission.id },
        include: {
          assets: { orderBy: { order: 'asc' } },
          questions: { orderBy: { order: 'asc' } },
        },
      })
    })

    if (!updatedMission) {
      return notFound('Mission')
    }

    return ok(updatedMission)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

export async function DELETE(
  request: Request,
  context: { params: { missionId: string } }
) {
  try {
    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    const mission = await prisma.mission.findFirst({
      where: {
        id: context.params.missionId,
        founderId: founder.founderProfile.id,
      },
      select: { id: true, status: true },
    })

    if (!mission) {
      return notFound('Mission')
    }

    if (mission.status !== 'DRAFT') {
      return apiError('Mission is not editable', 'MISSION_NOT_EDITABLE', 400)
    }

    await prisma.mission.delete({
      where: { id: mission.id },
    })

    return ok({ deleted: true })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
