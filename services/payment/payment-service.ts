import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { stripeService } from './stripe-service'
import { orderService } from '@/services/order-service'

export interface ProcessPaymentInput {
  orderId: string
  amount: number
  paymentMethod: 'STRIPE' | 'PAYPAL' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'CASH' | 'GIFT_CARD'
  paymentMethodId?: string
  customerEmail?: string
  userId?: string
  metadata?: Record<string, string>
}

export interface PaymentResult {
  success: boolean
  paymentId?: string
  paymentIntentId?: string
  clientSecret?: string
  requiresAction?: boolean
  error?: string
}

export const paymentService = {
  /**
   * Process a payment
   */
  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    try {
      // Get the order
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
      })

      if (!order) {
        return { success: false, error: 'Order not found' }
      }

      // Validate amount matches order total
      const orderTotal = Number(order.total)
      if (Math.abs(input.amount - orderTotal) > 0.01) {
        return {
          success: false,
          error: `Amount mismatch. Expected ${orderTotal}, got ${input.amount}`,
        }
      }

      // Handle different payment methods
      if (input.paymentMethod === 'CASH') {
        // Cash payments are marked as completed immediately (for POS)
        const payment = await prisma.payment.create({
          data: {
            orderId: input.orderId,
            amount: new Decimal(input.amount),
            status: 'COMPLETED',
            paymentMethod: 'CASH',
            processedAt: new Date(),
          },
        })

        // Update order payment status
        await prisma.order.update({
          where: { id: input.orderId },
          data: { paymentStatus: 'PAID' },
        })

        return { success: true, paymentId: payment.id }
      }

      if (input.paymentMethod === 'STRIPE') {
        return await this.processStripePayment(input)
      }

      // TODO: Implement PayPal, Apple Pay, Google Pay in future
      return {
        success: false,
        error: `Payment method ${input.paymentMethod} not yet implemented`,
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      }
    }
  },

  /**
   * Process Stripe payment
   */
  async processStripePayment(
    input: ProcessPaymentInput
  ): Promise<PaymentResult> {
    try {
      // Get or create Stripe customer
      let customerId: string | undefined
      if (input.customerEmail || input.userId) {
        const user = input.userId
          ? await prisma.user.findUnique({ where: { id: input.userId } })
          : null
        const email = user?.email || input.customerEmail!

        const customer = await stripeService.getOrCreateCustomer(
          email,
          input.userId
        )
        customerId = customer.id
      }

      // Create payment intent (amount in cents)
      const amountInCents = Math.round(input.amount * 100)
      const paymentIntent = await stripeService.createPaymentIntent({
        amount: amountInCents,
        currency: 'usd',
        customerId,
        paymentMethodId: input.paymentMethodId,
        metadata: {
          orderId: input.orderId,
          ...input.metadata,
        },
      })

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          orderId: input.orderId,
          amount: new Decimal(input.amount),
          status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'PROCESSING',
          paymentMethod: 'STRIPE',
          paymentIntentId: paymentIntent.paymentIntentId,
          metadata: input.metadata || {},
        },
      })

      // Update order payment status if succeeded
      if (paymentIntent.status === 'succeeded') {
        await prisma.order.update({
          where: { id: input.orderId },
          data: { paymentStatus: 'PAID' },
        })
      }

      return {
        success: true,
        paymentId: payment.id,
        paymentIntentId: paymentIntent.paymentIntentId,
        clientSecret: paymentIntent.clientSecret,
        requiresAction: paymentIntent.requiresAction,
      }
    } catch (error) {
      console.error('Stripe payment error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stripe payment failed',
      }
    }
  },

  /**
   * Confirm a payment intent (for 3D Secure and similar)
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<PaymentResult> {
    try {
      const paymentIntent = await stripeService.confirmPaymentIntent(
        paymentIntentId,
        paymentMethodId
      )

      // Find payment record
      const payment = await prisma.payment.findFirst({
        where: { paymentIntentId },
      })

      if (!payment) {
        return { success: false, error: 'Payment record not found' }
      }

      // Update payment status
      const status =
        paymentIntent.status === 'succeeded'
          ? 'COMPLETED'
          : paymentIntent.status === 'requires_action'
          ? 'PROCESSING'
          : 'FAILED'

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status,
          processedAt: paymentIntent.status === 'succeeded' ? new Date() : null,
          failureReason:
            paymentIntent.status === 'canceled' || paymentIntent.status === 'requires_payment_method'
              ? paymentIntent.last_payment_error?.message || 'Payment failed'
              : null,
        },
      })

      // Update order status
      if (paymentIntent.status === 'succeeded') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: 'PAID' },
        })
      }

      return {
        success: paymentIntent.status === 'succeeded',
        paymentId: payment.id,
        paymentIntentId: paymentIntent.id,
        requiresAction: paymentIntent.status === 'requires_action',
        error:
          paymentIntent.status === 'canceled' || paymentIntent.status === 'requires_payment_method'
            ? paymentIntent.last_payment_error?.message
            : undefined,
      }
    } catch (error) {
      console.error('Payment confirmation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment confirmation failed',
      }
    }
  },

  /**
   * Create a refund
   */
  async createRefund(
    paymentId: string,
    amount?: number
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      })

      if (!payment) {
        return { success: false, error: 'Payment not found' }
      }

      if (payment.paymentMethod !== 'STRIPE' || !payment.paymentIntentId) {
        return { success: false, error: 'Refund only supported for Stripe payments' }
      }

      // Create refund via Stripe
      const refundAmount = amount ? Math.round(amount * 100) : undefined
      const refund = await stripeService.createRefund(
        payment.paymentIntentId,
        refundAmount
      )

      // Update payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          refundId: refund.id,
        },
      })

      // Update order payment status
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'REFUNDED' },
      })

      return { success: true, refundId: refund.id }
    } catch (error) {
      console.error('Refund error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund failed',
      }
    }
  },

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string) {
    return prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    })
  },
}

