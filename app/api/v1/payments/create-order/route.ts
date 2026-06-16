import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/api/middleware'
import { ok, apiError, badRequest, serverError } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('FOUNDER')

    const body = await request.json()
    const { testersRequired } = body

    if (
      typeof testersRequired !== 'number' ||
      !Number.isInteger(testersRequired) ||
      testersRequired < 1 ||
      testersRequired > 3
    ) {
      return badRequest('testersRequired must be an integer between 1 and 3')
    }

    // ₹100 per tester, converted to paise (₹1 = 100 paise)
    const amount = testersRequired * 100 * 100

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
        receipt: `mission_${user.id}_${Date.now()}`,
      }),
    })

    if (!razorpayResponse.ok) {
      const errorBody = await razorpayResponse.text()
      console.error('Razorpay order creation failed:', razorpayResponse.status, errorBody)
      return apiError(
        'Failed to create payment order. Please try again.',
        'PAYMENT_ORDER_FAILED',
        500
      )
    }

    const order = await razorpayResponse.json()

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
