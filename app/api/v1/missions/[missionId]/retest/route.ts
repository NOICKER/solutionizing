import { Difficulty, MissionStatus, RepTier } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { badRequest, created, notFound, serverError } from '@/lib/api/response'
import { computeMissionCoinCost } from '@/lib/business/coins'
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

function getMinRepTier(difficulty: Difficulty): RepTier {
  if (difficulty === Difficulty.HARD) {
    return RepTier.TRUSTED
  }

  return RepTier.NEWCOMER
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

export async function POST(
  request: Request,
  context: { params: { missionId: string } }
) {
  try {
    const founder = await requireRole('FOUNDER')

    if (!founder.founderProfile) {
      return notFound('Founder profile')
    }

    const originalMission = await findOwnedMission(
      context.params.missionId,
      founder.founderProfile.id
    )

    if (!originalMission) {
      return notFound('Mission')
    }

    if (originalMission.status !== MissionStatus.COMPLETED) {
      return badRequest('Only completed missions can be retested')
    }

    const { coinPerTester, coinPlatformFee, coinCostTotal } = computeMissionCoinCost(
      originalMission.difficulty,
      originalMission.testersRequired
    )

    const retestMission = await prisma.mission.create({
      data: {
        founderId: founder.founderProfile.id,
        parentMissionId: originalMission.id,
        title: originalMission.title,
        goal: originalMission.goal,
        difficulty: originalMission.difficulty,
        estimatedMinutes: originalMission.estimatedMinutes,
        testersRequired: originalMission.testersRequired,
        minRepTier: getMinRepTier(originalMission.difficulty),
        coinPerTester,
        coinPlatformFee,
        coinCostTotal,
        status: MissionStatus.DRAFT,
        assets: {
          create: originalMission.assets.map((asset) => ({
            type: asset.type,
            url: asset.url,
            label: asset.label,
            order: asset.order,
          })),
        },
        questions: {
          create: originalMission.questions.map((question) => ({
            order: question.order,
            type: question.type,
            text: question.text,
            options: question.options,
            isRequired: question.isRequired,
          })),
        },
      },
      include: missionInclude,
    })

    return created(retestMission)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
