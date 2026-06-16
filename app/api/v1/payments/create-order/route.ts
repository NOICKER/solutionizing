import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/api/middleware'
import { ok, apiError, badRequest, serverError } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('FOUNDER')
    const founderProfile = user.founderProfile

    if (!founderProfile) {
      return apiError('Founder profile not found', 'PROFILE_NOT_FOUND', 403)
    }

    const body = await request.json()
    const { testersRequired, missionData } = body

    if (
      typeof testersRequired !== 'number' ||
      !Number.isInteger(testersRequired) ||
      testersRequired < 1 ||
      testersRequired > 3
    ) {
      return badRequest('testersRequired must be an integer between 1 and 3')
    }

    if (!missionData || !missionData.title || !missionData.goal) {
      return badRequest('Missing mission data')
    }

    // ₹80 per tester, converted to paise (₹1 = 100 paise)
    const amount = testersRequired * 80 * 100

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      console.error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET')
      return serverError()
    }

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: `m_${user.id.substring(0, 8)}_${Date.now()}`,
      }),
    })

    if (!razorpayResponse.ok) {
      const errorBody = await razorpayResponse.text()
      console.error('Razorpay order creation failed:', razorpayResponse.status, errorBody)
      return apiError(
        `Failed to create payment order. Please try again. ${errorBody}`,
        'PAYMENT_ORDER_FAILED',
        500
      )
    }

    const order = await razorpayResponse.json()

    // Store Payment record in DB before returning
    await prisma.payment.create({
      data: {
        razorpayOrderId: order.id,
        amount: order.amount,
        currency: order.currency,
        status: 'created',
        founderId: founderProfile.id,
        missionPayload: body, // Snapshot of exactly what was requested
      },
    })

    return ok({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      testersRequired,
    })
  } catch (error) {
    // requireRole throws NextResponse on auth failure — rethrow it
    if (error instanceof Response) throw error
    console.error('Create order error:', error)
    return serverError()
  }
}
