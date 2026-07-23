import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'

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

  return ok({
    valid: true,
    discountAmount: referral.discountAmount,
  })
}
