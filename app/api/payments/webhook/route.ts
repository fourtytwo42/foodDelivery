import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/services/payment/stripe-service'
import { prisma } from '@/lib/prisma'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any
        await handlePaymentIntentSucceeded(paymentIntent)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any
        await handlePaymentIntentFailed(paymentIntent)
        break
      }

      case 'payment_intent.requires_action': {
        // Payment requires additional action (e.g., 3D Secure)
        // This is handled client-side, but we can log it
        console.log('Payment requires action:', event.data.object)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const paymentIntentId = paymentIntent.id

  // Find payment record
  const payment = await prisma.payment.findFirst({
    where: { paymentIntentId },
  })

  if (!payment) {
    console.error(`Payment not found for payment intent: ${paymentIntentId}`)
    return
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      transactionId: paymentIntent.id,
      processedAt: new Date(),
    },
  })

  // Update order payment status
  await prisma.order.update({
    where: { id: payment.orderId },
    data: { paymentStatus: 'PAID' },
  })
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  const paymentIntentId = paymentIntent.id

  // Find payment record
  const payment = await prisma.payment.findFirst({
    where: { paymentIntentId },
  })

  if (!payment) {
    console.error(`Payment not found for payment intent: ${paymentIntentId}`)
    return
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'FAILED',
      failureReason:
        paymentIntent.last_payment_error?.message || 'Payment failed',
    },
  })
}

