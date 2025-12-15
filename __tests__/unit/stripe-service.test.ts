import { stripeService } from '@/services/payment/stripe-service'
import Stripe from 'stripe'

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
      retrieve: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      list: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
    paymentMethods: {
      list: jest.fn(),
    },
  }))
})

// Import the mocked stripe instance
import { stripe } from '@/services/payment/stripe-service'

describe('stripeService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createPaymentIntent', () => {
    it('should create a payment intent with correct parameters', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'cs_123',
        status: 'requires_payment_method',
        next_action: null,
      }

      ;(stripe.paymentIntents.create as jest.Mock).mockResolvedValue(
        mockPaymentIntent as any
      )

      const result = await stripeService.createPaymentIntent({
        amount: 1000,
        currency: 'usd',
      })

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {},
      })
      expect(result.paymentIntentId).toBe('pi_123')
      expect(result.clientSecret).toBe('cs_123')
      expect(result.status).toBe('requires_payment_method')
    })

    it('should include customer if provided', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'cs_123',
        status: 'requires_payment_method',
      }

      ;(stripe.paymentIntents.create as jest.Mock).mockResolvedValue(
        mockPaymentIntent as any
      )

      await stripeService.createPaymentIntent({
        amount: 1000,
        customerId: 'cus_123',
      })

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_123',
        })
      )
    })

    it('should include payment method and confirm if provided', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'cs_123',
        status: 'succeeded',
      }

      ;(stripe.paymentIntents.create as jest.Mock).mockResolvedValue(
        mockPaymentIntent as any
      )

      await stripeService.createPaymentIntent({
        amount: 1000,
        paymentMethodId: 'pm_123',
      })

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method: 'pm_123',
          confirm: true,
        })
      )
    })

    it('should set requiresAction when status requires action', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'cs_123',
        status: 'requires_action',
        next_action: { type: 'use_stripe_sdk' },
      }

      ;(stripe.paymentIntents.create as jest.Mock).mockResolvedValue(
        mockPaymentIntent as any
      )

      const result = await stripeService.createPaymentIntent({
        amount: 1000,
      })

      expect(result.requiresAction).toBe(true)
    })
  })

  describe('confirmPaymentIntent', () => {
    it('should confirm payment intent without payment method', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
      }

      ;(stripe.paymentIntents.confirm as jest.Mock).mockResolvedValue(
        mockPaymentIntent as any
      )

      const result = await stripeService.confirmPaymentIntent('pi_123')

      expect(stripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_123', {})
      expect(result.id).toBe('pi_123')
    })

    it('should confirm payment intent with payment method', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
      }

      ;(stripe.paymentIntents.confirm as jest.Mock).mockResolvedValue(
        mockPaymentIntent as any
      )

      const result = await stripeService.confirmPaymentIntent('pi_123', 'pm_123')

      expect(stripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_123', {
        payment_method: 'pm_123',
      })
      expect(result.id).toBe('pi_123')
    })
  })

  describe('getPaymentIntent', () => {
    it('should retrieve payment intent', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
      }

      ;(stripe.paymentIntents.retrieve as jest.Mock).mockResolvedValue(
        mockPaymentIntent as any
      )

      const result = await stripeService.getPaymentIntent('pi_123')

      expect(stripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_123')
      expect(result.id).toBe('pi_123')
    })
  })

  describe('getOrCreateCustomer', () => {
    it('should return existing customer if found', async () => {
      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
      }

      ;(stripe.customers.list as jest.Mock).mockResolvedValue({
        data: [mockCustomer],
      } as any)

      const result = await stripeService.getOrCreateCustomer('test@example.com')

      expect(stripe.customers.list).toHaveBeenCalledWith({
        email: 'test@example.com',
        limit: 1,
      })
      expect(stripe.customers.create).not.toHaveBeenCalled()
      expect(result.id).toBe('cus_123')
    })

    it('should create new customer if not found', async () => {
      const mockCustomer = {
        id: 'cus_new',
        email: 'new@example.com',
      }

      ;(stripe.customers.list as jest.Mock).mockResolvedValue({
        data: [],
      } as any)
      ;(stripe.customers.create as jest.Mock).mockResolvedValue(
        mockCustomer as any
      )

      const result = await stripeService.getOrCreateCustomer('new@example.com')

      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        metadata: {},
      })
      expect(result.id).toBe('cus_new')
    })

    it('should include userId in metadata when provided', async () => {
      const mockCustomer = {
        id: 'cus_new',
        email: 'new@example.com',
      }

      ;(stripe.customers.list as jest.Mock).mockResolvedValue({
        data: [],
      } as any)
      ;(stripe.customers.create as jest.Mock).mockResolvedValue(
        mockCustomer as any
      )

      await stripeService.getOrCreateCustomer('new@example.com', 'user_123')

      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        metadata: { userId: 'user_123' },
      })
    })
  })

  describe('createRefund', () => {
    it('should create full refund when amount not provided', async () => {
      const mockRefund = {
        id: 'ref_123',
        amount: 1000,
      }

      ;(stripe.refunds.create as jest.Mock).mockResolvedValue(
        mockRefund as any
      )

      const result = await stripeService.createRefund('pi_123')

      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
      })
      expect(result.id).toBe('ref_123')
    })

    it('should create partial refund when amount provided', async () => {
      const mockRefund = {
        id: 'ref_123',
        amount: 500,
      }

      ;(stripe.refunds.create as jest.Mock).mockResolvedValue(
        mockRefund as any
      )

      const result = await stripeService.createRefund('pi_123', 500)

      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 500,
      })
      expect(result.id).toBe('ref_123')
    })
  })

  describe('listPaymentMethods', () => {
    it('should list payment methods for customer', async () => {
      const mockPaymentMethods = [
        { id: 'pm_1', type: 'card' },
        { id: 'pm_2', type: 'card' },
      ]

      ;(stripe.paymentMethods.list as jest.Mock).mockResolvedValue({
        data: mockPaymentMethods,
      } as any)

      const result = await stripeService.listPaymentMethods('cus_123')

      expect(stripe.paymentMethods.list).toHaveBeenCalledWith({
        customer: 'cus_123',
        type: 'card',
      })
      expect(result).toEqual(mockPaymentMethods)
    })
  })
})
