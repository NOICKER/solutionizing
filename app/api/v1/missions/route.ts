export const dynamic = 'force-dynamic'
import { AssetType, Difficulty, MissionStatus, QuestionType, RepTier } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { validateBody } from '@/lib/api/validate'
import { ok, created, apiError, badRequest, notFound, serverError } from '@/lib/api/response'
import { computeMissionCoinCost } from '@/lib/business/coins'
import { checkUrl } from '@/lib/safety/urlCheck'
import { checkMissionContent } from '@/lib/safety/contentCheck'
import { z } from 'zod'
import { logApiRouteError } from '@/lib/api/log'

const missionInclude = {
  assets: { orderBy: { order: 'asc' as const } },
  questions: { orderBy: { order: 'asc' as const } },
  retests: {
    select: {
      id: true,
      title: true,
      completedAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
}

const MissionListQuerySchema = z.object({
  status: z.nativeEnum(MissionStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

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

const CreateMissionSchema = z.object({
  title: z.string().min(5).max(100),
  goal: z.string().min(10).max(300),
  difficulty: z.nativeEnum(Difficulty),
  estimatedMinutes: z.number().int().min(2).max(4),
  testersRequired: z.number().int().min(5).max(50),
  assets: z.array(MissionAssetSchema).min(1).max(3),
  questions: z.array(MissionQuestionSchema).min(1).max(6),
}).superRefine((value, ctx) => {
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
    throw apiError(
      'Mission content failed safety review',
      contentResult.code ?? 'CONTENT_POLICY_VIOLATION',
      400,
      { reason: contentResult.reason ?? null }
    )
  }

  for (const asset of assets) {
    if (asset.type !== AssetType.LINK || !asset.url) continue

    const urlResult = await checkUrl(asset.url)
    if (!urlResult.safe) {
      throw apiError(
        'Mission asset URL failed safety review',
        urlResult.code ?? 'URL_UNREACHABLE',
        400,
        { reason: urlResult.reason ?? null }
      )
    }
  }
}

export async function GET(request: Request) {
  try {
    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    const requestUrl = new URL(request.url)
    const queryResult = MissionListQuerySchema.safeParse({
      status: requestUrl.searchParams.get('status') || undefined,
      page: requestUrl.searchParams.get('page') ?? undefined,
      limit: requestUrl.searchParams.get('limit') ?? undefined,
    })

    if (!queryResult.success) {
      return badRequest('Validation failed', queryResult.error.flatten())
    }

    const query = queryResult.data
    const skip = (query.page - 1) * query.limit
    const where = {
      founderId: founder.founderProfile.id,
      ...(query.status ? { status: query.status } : {}),
    }

    const [total, missions] = await Promise.all([
      prisma.mission.count({ where }),
      prisma.mission.findMany({
        where,
        include: missionInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
    ])

    return ok(
      missions,
      {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      }
    )
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    const body = await validateBody(request, CreateMissionSchema)

    await assertMissionIsSafe(body.title, body.goal, body.questions, body.assets)

    const { coinPerTester, coinPlatformFee, coinCostTotal } = computeMissionCoinCost(
      body.difficulty,
      body.testersRequired
    )

    const mission = await prisma.mission.create({
      data: {
        founderId: founder.founderProfile.id,
        title: body.title,
        goal: body.goal,
        difficulty: body.difficulty,
        estimatedMinutes: body.estimatedMinutes,
        testersRequired: body.testersRequired,
        minRepTier: getMinRepTier(body.difficulty),
        coinPerTester,
        coinPlatformFee,
        coinCostTotal,
        status: MissionStatus.DRAFT,
        assets: {
          create: [...body.assets]
            .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
            .map((asset) => ({
              type: asset.type,
              url: asset.type === AssetType.TEXT_DESCRIPTION ? asset.text!.trim() : asset.url!.trim(),
              label: asset.label,
              order: asset.order,
            })),
        },
        questions: {
          create: [...body.questions]
            .sort((left, right) => left.order - right.order)
            .map((question) => ({
              order: question.order,
              type: question.type,
              text: question.text,
              options: question.options ?? [],
              isRequired: question.isRequired,
            })),
        },
      },
      include: missionInclude,
    })

    return created(mission)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}

