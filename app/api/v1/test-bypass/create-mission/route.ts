import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/api/middleware'
import { ok, apiError, serverError } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import { INTERNAL_TEST_ALLOWLIST } from '@/lib/internal-test-allowlist'

// Temporary internal testing bypass gated by an environment variable.
// MUST BE REMOVED before any public or paying founders use the platform.
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('FOUNDER')
    const founderProfile = user.founderProfile

    if (!founderProfile) {
      return apiError('Founder profile not found', 'PROFILE_NOT_FOUND', 403)
    }

    if (process.env.ENABLE_FOUNDER_TEST_BYPASS !== 'true') {
      return apiError('Forbidden', 'FORBIDDEN', 403)
    }

    if (!INTERNAL_TEST_ALLOWLIST.includes(user.id)) {
      return apiError('Forbidden', 'FORBIDDEN', 403)
    }

    const body = await request.json()
    const { testersRequired, missionData } = body

    if (!missionData || !testersRequired) {
      return apiError('Bad Request', 'BAD_REQUEST', 400)
    }

    const mission = await prisma.mission.create({
      data: {
        founderId: founderProfile.id,
        title: missionData.title.trim(),
        goal: missionData.goal.trim(),
        difficulty: missionData.difficulty,
        estimatedMinutes: missionData.estimatedMinutes,
        testersRequired,
        timeoutDuration: missionData.timeoutDuration,
        coinPerTester: 0,
        coinPlatformFee: 0,
        coinCostTotal: 0,
        status: 'PENDING_REVIEW',
        paidAt: new Date(),
        assets: {
          create: missionData.assets.map((asset: any) => ({
            type: asset.type === 'TEXT' ? 'TEXT_DESCRIPTION' : asset.type === 'VIDEO' ? 'SHORT_VIDEO' : asset.type,
            url: asset.type === 'TEXT' ? (asset.text ?? '') : (asset.url ?? ''),
            label: asset.label || null,
            order: asset.order,
          })),
        },
        questions: {
          create: missionData.questions.map((q: any) => ({
            order: q.order,
            type: q.type,
            text: q.text.trim(),
            options: q.options ?? [],
            isRequired: q.isRequired,
          })),
        },
      },
    })

    return ok({
      success: true,
      missionId: mission.id,
    })
  } catch (error) {
    if (error instanceof Response) throw error
    console.error('Bypass create mission error:', error)
    return serverError()
  }
}
