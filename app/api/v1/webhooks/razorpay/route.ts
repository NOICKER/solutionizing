import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { ok, badRequest, serverError } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    
    if (!signature) {
      return badRequest('Missing Razorpay signature')
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('Missing RAZORPAY_WEBHOOK_SECRET')
      return serverError()
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    if (generatedSignature !== signature) {
      console.error('Razorpay webhook signature mismatch')
      return badRequest('Invalid signature')
    }

    const event = JSON.parse(rawBody)
    const { event: eventType, payload } = event

    if (eventType === 'payment.captured') {
      const paymentEntity = payload.payment.entity
      const razorpayOrderId = paymentEntity.order_id
      const razorpayPaymentId = paymentEntity.id

      // Look up payment
      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId },
        include: { mission: true, founder: true },
      })

      if (!payment) {
        console.error(`Webhook: Payment not found for order ${razorpayOrderId}`)
        return ok({ message: 'Order not found, ignored' })
      }

      if (payment.status === 'captured') {
        console.log(`Webhook: Payment ${razorpayOrderId} already captured.`)
        return ok({ message: 'Already captured' })
      }

      // If we reach here, the frontend didn't verify it in time. We must create the mission safely!
      const missionPayload = payment.missionPayload as any
      const testersRequired = missionPayload?.testersRequired
      const missionData = missionPayload?.missionData

      if (!missionData || !testersRequired) {
        console.error(`Webhook: Invalid mission payload for payment ${payment.id}`)
        return serverError()
      }

      // Process in an interactive transaction to prevent race conditions
      const result = await prisma.$transaction(async (tx) => {
        // Try to mark the payment as captured only if it's still "created"
        const updateResult = await tx.payment.updateMany({
          where: { id: payment.id, status: 'created' },
          data: {
            status: 'captured',
            razorpayPaymentId,
          },
        })

        if (updateResult.count === 0) {
          // Another request (e.g., synchronous verify) beat us to it
          const currentPayment = await tx.payment.findUnique({ where: { id: payment.id } })
          return { success: true, missionId: currentPayment?.missionId, alreadyCaptured: true }
        }

        // We won the race! Create the mission safely.
        const mission = await tx.mission.create({
          data: {
            founderId: payment.founderId,
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

        // Link the mission to the payment
        await tx.payment.update({
          where: { id: payment.id },
          data: { missionId: mission.id },
        })

        return { success: true, missionId: mission.id, alreadyCaptured: false, mission }
      })

      if (result.alreadyCaptured) {
        console.log(`Webhook: Payment ${razorpayOrderId} already captured by concurrent request.`)
        return ok({ message: 'Already captured' })
      }

      if (result.mission) {
        console.log(`Webhook: Successfully created mission ${result.mission.id} from payment ${payment.id}`)
      }

    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payment.entity
      const razorpayOrderId = paymentEntity.order_id

      await prisma.payment.updateMany({
        where: { razorpayOrderId, status: 'created' },
        data: { status: 'failed' },
      })
      console.log(`Webhook: Payment ${razorpayOrderId} marked as failed.`)
    }

    return ok({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return serverError()
  }
}
