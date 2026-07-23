import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase()

  if (!code) {
    return ok({ valid: false, message: "This code isn't valid" })
  }

  const referral = await prisma.referralCode.findUnique({
    where: { code },
  })

  if (!referral || !referral.active) {
    return ok({ valid: false, message: "This code isn't valid" })
  }

  // Check usage cap: if maxUses is set and timesUsed has reached it, treat as invalid
  if (referral.maxUses !== null && referral.timesUsed >= referral.maxUses) {
    return ok({ valid: false, message: "This code isn't valid" })
  }

  // Check if this founder has already used any referral code on a previous mission
  try {
    const user = await requireRole('FOUNDER')
    const founderProfile = user.founderProfile

    if (founderProfile) {
      const previousReferralUse = await prisma.mission.findFirst({
        where: {
          founderId: founderProfile.id,
          referralCode: { not: null },
          paidAt: { not: null },
        },
        select: { id: true },
      })

      if (previousReferralUse) {
        return ok({ valid: false, message: 'Referral discount already used' })
      }
    }
  } catch {
    // If auth fails (shouldn't happen in normal flow), skip founder check
    // The create-order endpoint will enforce it server-side anyway
  }

  return ok({
    valid: true,
    discountAmount: referral.discountAmount,
  })
}
