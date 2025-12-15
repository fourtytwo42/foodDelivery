import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/services/payment/payment-service'
import { z } from 'zod'

const processPaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.enum(['STRIPE', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY', 'CASH', 'GIFT_CARD']),
  paymentMethodId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  userId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = processPaymentSchema.parse(body)

    const result = await paymentService.processPayment({
      orderId: data.orderId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentMethodId: data.paymentMethodId,
      customerEmail: data.customerEmail,
      userId: data.userId,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Payment processing failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      paymentIntentId: result.paymentIntentId,
      clientSecret: result.clientSecret,
      requiresAction: result.requiresAction,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error processing payment:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}

