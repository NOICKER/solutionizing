import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { requireRole } from '@/lib/api/middleware'
import { ok, apiError, badRequest, serverError } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'

interface VerifyBody {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('FOUNDER')
    const founderProfile = user.founderProfile

    if (!founderProfile) {
      return apiError('Founder profile not found', 'PROFILE_NOT_FOUND', 403)
    }

    const body: VerifyBody = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return badRequest('Missing Razorpay payment fields')
    }

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    })

    if (!payment) {
      return apiError('Payment order not found in our records', 'ORDER_NOT_FOUND', 404)
    }

    if (payment.status === 'captured') {
      return ok({
        success: true,
        missionId: payment.missionId,
      })
    }

    const payload = payment.missionPayload as any
    const testersRequired = payload?.testersRequired
    const missionData = payload?.missionData

    if (!missionData || !testersRequired) {
      return serverError()
    }

    // Verify HMAC signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      console.error('Missing RAZORPAY_KEY_SECRET')
      return serverError()
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      return apiError(
        'Payment verification failed. Signature mismatch.',
        'SIGNATURE_MISMATCH',
        400
      )
    }

    // Payment verified — create mission with paidAt timestamp
    // Payment verified — process in a transaction
    const [mission, updatedPayment] = await prisma.$transaction([
      prisma.mission.create({
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
      }),
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'captured',
          razorpayPaymentId: razorpay_payment_id,
        },
      }),
    ])

    // Link the mission to the payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: { missionId: mission.id },
    })

    return ok({
      success: true,
      missionId: mission.id,
    })
  } catch (error) {
    // requireRole throws NextResponse on auth failure — rethrow it
    if (error instanceof Response) throw error
    console.error('Verify payment error:', error)
    return serverError()
  }
}
