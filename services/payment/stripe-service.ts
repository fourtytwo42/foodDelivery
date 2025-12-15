import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-11-17.clover',
  typescript: true,
})

export interface CreatePaymentIntentInput {
  amount: number // in cents
  currency?: string
  customerId?: string
  paymentMethodId?: string
  metadata?: Record<string, string>
}

export interface StripePaymentResult {
  paymentIntentId: string
  clientSecret: string
  status: string
  requiresAction?: boolean
  nextAction?: any
}

export const stripeService = {
  /**
   * Create a payment intent
   */
  async createPaymentIntent(
    input: CreatePaymentIntentInput
  ): Promise<StripePaymentResult> {
    const params: Stripe.PaymentIntentCreateParams = {
      amount: input.amount,
      currency: input.currency || 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: input.metadata || {},
    }

    if (input.customerId) {
      params.customer = input.customerId
    }

    if (input.paymentMethodId) {
      params.payment_method = input.paymentMethodId
      params.confirm = true
    }

    const paymentIntent = await stripe.paymentIntents.create(params)

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      status: paymentIntent.status,
      requiresAction: paymentIntent.status === 'requires_action',
      nextAction: paymentIntent.next_action,
    }
  },

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<Stripe.PaymentIntent> {
    const params: Stripe.PaymentIntentConfirmParams = {}

    if (paymentMethodId) {
      params.payment_method = paymentMethodId
    }

    return stripe.paymentIntents.confirm(paymentIntentId, params)
  },

  /**
   * Retrieve a payment intent
   */
  async getPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.retrieve(paymentIntentId)
  },

  /**
   * Create or retrieve a customer
   */
  async getOrCreateCustomer(
    email: string,
    userId?: string
  ): Promise<Stripe.Customer> {
    // First, try to find existing customer by email
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0]
    }

    // Create new customer
    return stripe.customers.create({
      email,
      metadata: userId ? { userId } : {},
    })
  },

  /**
   * Create a refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number
  ): Promise<Stripe.Refund> {
    const params: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    }

    if (amount) {
      params.amount = amount // in cents
    }

    return stripe.refunds.create(params)
  },

  /**
   * List saved payment methods for a customer
   */
  async listPaymentMethods(
    customerId: string
  ): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    })

    return paymentMethods.data
  },
}

