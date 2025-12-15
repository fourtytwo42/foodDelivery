import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/services/payment/payment-service'
import { z } from 'zod'

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1),
  paymentMethodId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = confirmPaymentSchema.parse(body)

    const result = await paymentService.confirmPaymentIntent(
      data.paymentIntentId,
      data.paymentMethodId
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Payment confirmation failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      paymentIntentId: result.paymentIntentId,
      requiresAction: result.requiresAction,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}

