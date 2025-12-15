import { paymentService } from '@/services/payment/payment-service'
import { prisma } from '@/lib/prisma'
import { stripeService } from '@/services/payment/stripe-service'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/services/payment/stripe-service', () => ({
  stripeService: {
    getOrCreateCustomer: jest.fn(),
    createPaymentIntent: jest.fn(),
    confirmPaymentIntent: jest.fn(),
    createRefund: jest.fn(),
  },
}))

describe('paymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('processPayment', () => {
    it('should process cash payment successfully', async () => {
      const mockOrder = {
        id: 'order1',
        total: 20.0,
      }

      const mockPayment = {
        id: 'payment1',
        orderId: 'order1',
        status: 'COMPLETED',
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.payment.create as jest.Mock).mockResolvedValue(mockPayment)
      ;(prisma.order.update as jest.Mock).mockResolvedValue({})

      const result = await paymentService.processPayment({
        orderId: 'order1',
        amount: 20.0,
        paymentMethod: 'CASH',
      })

      expect(result.success).toBe(true)
      expect(result.paymentId).toBe('payment1')
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order1',
          status: 'COMPLETED',
          paymentMethod: 'CASH',
        }),
      })
    })

    it('should return error if order not found', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await paymentService.processPayment({
        orderId: 'order1',
        amount: 20.0,
        paymentMethod: 'CASH',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Order not found')
    })

    it('should return error if amount mismatch', async () => {
      const mockOrder = {
        id: 'order1',
        total: 20.0,
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)

      const result = await paymentService.processPayment({
        orderId: 'order1',
        amount: 15.0,
        paymentMethod: 'CASH',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Amount mismatch')
    })

    it('should process Stripe payment', async () => {
      const mockOrder = {
        id: 'order1',
        total: 20.0,
      }

      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
      }

      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
      }

      const mockPaymentIntent = {
        paymentIntentId: 'pi_123',
        clientSecret: 'pi_123_secret',
        status: 'succeeded',
      }

      const mockPayment = {
        id: 'payment1',
        orderId: 'order1',
        status: 'COMPLETED',
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(stripeService.getOrCreateCustomer as jest.Mock).mockResolvedValue(
        mockCustomer
      )
      ;(stripeService.createPaymentIntent as jest.Mock).mockResolvedValue(
        mockPaymentIntent
      )
      ;(prisma.payment.create as jest.Mock).mockResolvedValue(mockPayment)
      ;(prisma.order.update as jest.Mock).mockResolvedValue({})

      const result = await paymentService.processPayment({
        orderId: 'order1',
        amount: 20.0,
        paymentMethod: 'STRIPE',
        userId: 'user1',
      })

      expect(result.success).toBe(true)
      expect(result.paymentId).toBe('payment1')
      expect(result.paymentIntentId).toBe('pi_123')
    })
  })

  describe('confirmPaymentIntent', () => {
    it('should confirm payment intent successfully', async () => {
      const mockPayment = {
        id: 'payment1',
        orderId: 'order1',
        paymentIntentId: 'pi_123',
      }

      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
      }

      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)
      ;(stripeService.confirmPaymentIntent as jest.Mock).mockResolvedValue(
        mockPaymentIntent
      )
      ;(prisma.payment.update as jest.Mock).mockResolvedValue({})
      ;(prisma.order.update as jest.Mock).mockResolvedValue({})

      const result = await paymentService.confirmPaymentIntent('pi_123')

      expect(result.success).toBe(true)
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
        }),
      })
    })

    it('should handle failed payment intent', async () => {
      const mockPayment = {
        id: 'payment1',
        orderId: 'order1',
        paymentIntentId: 'pi_123',
      }

      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'canceled',
        last_payment_error: { message: 'Card declined' },
      }

      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)
      ;(stripeService.confirmPaymentIntent as jest.Mock).mockResolvedValue(
        mockPaymentIntent
      )
      ;(prisma.payment.update as jest.Mock).mockResolvedValue({})

      const result = await paymentService.confirmPaymentIntent('pi_123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Card declined')
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment1' },
        data: expect.objectContaining({
          status: 'FAILED',
        }),
      })
    })
  })

  describe('createRefund', () => {
    it('should create refund successfully', async () => {
      const mockPayment = {
        id: 'payment1',
        orderId: 'order1',
        paymentIntentId: 'pi_123',
        paymentMethod: 'STRIPE',
      }

      const mockRefund = {
        id: 'refund_123',
      }

      ;(prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment)
      ;(stripeService.createRefund as jest.Mock).mockResolvedValue(mockRefund)
      ;(prisma.payment.update as jest.Mock).mockResolvedValue({})
      ;(prisma.order.update as jest.Mock).mockResolvedValue({})

      const result = await paymentService.createRefund('payment1', 10.0)

      expect(result.success).toBe(true)
      expect(result.refundId).toBe('refund_123')
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment1' },
        data: expect.objectContaining({
          status: 'REFUNDED',
        }),
      })
    })

    it('should return error for non-Stripe payments', async () => {
      const mockPayment = {
        id: 'payment1',
        orderId: 'order1',
        paymentMethod: 'CASH',
      }

      ;(prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment)

      const result = await paymentService.createRefund('payment1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('only supported for Stripe payments')
    })
  })

  describe('processStripePayment', () => {
    it('should handle errors when creating customer', async () => {
      const mockOrder = {
        id: 'order1',
        total: 20.0,
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(stripeService.getOrCreateCustomer as jest.Mock).mockRejectedValue(
        new Error('Stripe error')
      )

      const result = await paymentService.processPayment({
        orderId: 'order1',
        amount: 20.0,
        paymentMethod: 'STRIPE',
        customerEmail: 'test@example.com',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Stripe')
    })

    it('should process Stripe payment without customer', async () => {
      const mockOrder = {
        id: 'order1',
        total: 20.0,
      }

      const mockPaymentIntent = {
        paymentIntentId: 'pi_123',
        clientSecret: 'pi_123_secret',
        status: 'requires_payment_method',
      }

      const mockPayment = {
        id: 'payment1',
        orderId: 'order1',
        status: 'PROCESSING',
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(stripeService.createPaymentIntent as jest.Mock).mockResolvedValue(
        mockPaymentIntent
      )
      ;(prisma.payment.create as jest.Mock).mockResolvedValue(mockPayment)

      const result = await paymentService.processPayment({
        orderId: 'order1',
        amount: 20.0,
        paymentMethod: 'STRIPE',
      })

      expect(result.success).toBe(true)
      expect(result.paymentIntentId).toBe('pi_123')
      expect(stripeService.getOrCreateCustomer).not.toHaveBeenCalled()
    })

    it('should handle errors in processStripePayment', async () => {
      const mockOrder = {
        id: 'order1',
        total: 20.0,
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(stripeService.createPaymentIntent as jest.Mock).mockRejectedValue(
        new Error('Stripe API error')
      )

      const result = await paymentService.processPayment({
        orderId: 'order1',
        amount: 20.0,
        paymentMethod: 'STRIPE',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Stripe')
    })

    it('should update order when payment succeeds immediately', async () => {
      const mockOrder = {
        id: 'order1',
        total: 20.0,
      }

      const mockPaymentIntent = {
        paymentIntentId: 'pi_123',
        clientSecret: 'pi_123_secret',
        status: 'succeeded',
      }

      const mockPayment = {
        id: 'payment1',
        orderId: 'order1',
        status: 'COMPLETED',
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(stripeService.createPaymentIntent as jest.Mock).mockResolvedValue(
        mockPaymentIntent
      )
      ;(prisma.payment.create as jest.Mock).mockResolvedValue(mockPayment)
      ;(prisma.order.update as jest.Mock).mockResolvedValue({})

      const result = await paymentService.processPayment({
        orderId: 'order1',
        amount: 20.0,
        paymentMethod: 'STRIPE',
      })

      expect(result.success).toBe(true)
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order1' },
        data: { paymentStatus: 'PAID' },
      })
    })
  })

  describe('confirmPaymentIntent', () => {
    it('should handle payment not found', async () => {
      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await paymentService.confirmPaymentIntent('pi_123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Payment record not found')
    })

    it('should handle requires_action status', async () => {
      const mockPayment = {
        id: 'payment1',
        orderId: 'order1',
        paymentIntentId: 'pi_123',
      }

      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'requires_action',
      }

      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)
      ;(stripeService.confirmPaymentIntent as jest.Mock).mockResolvedValue(
        mockPaymentIntent
      )
      ;(prisma.payment.update as jest.Mock).mockResolvedValue({})

      const result = await paymentService.confirmPaymentIntent('pi_123')

      expect(result.success).toBe(false)
      expect(result.requiresAction).toBe(true)
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment1' },
        data: expect.objectContaining({
          status: 'PROCESSING',
        }),
      })
    })
  })

  describe('createRefund', () => {
    it('should return error if payment not found', async () => {
      ;(prisma.payment.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await paymentService.createRefund('payment1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Payment not found')
    })

    it('should create partial refund', async () => {
      const mockPayment = {
        id: 'payment1',
        orderId: 'order1',
        paymentIntentId: 'pi_123',
        paymentMethod: 'STRIPE',
      }

      const mockRefund = {
        id: 'refund_123',
      }

      ;(prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment)
      ;(stripeService.createRefund as jest.Mock).mockResolvedValue(mockRefund)
      ;(prisma.payment.update as jest.Mock).mockResolvedValue({})
      ;(prisma.order.update as jest.Mock).mockResolvedValue({})

      const result = await paymentService.createRefund('payment1', 10.0)

      expect(result.success).toBe(true)
      expect(stripeService.createRefund).toHaveBeenCalledWith('pi_123', 1000) // 10.0 * 100 cents
    })
  })

  describe('getPaymentById', () => {
    it('should fetch payment by id', async () => {
      const mockPayment = {
        id: 'payment1',
        orderId: 'order1',
        status: 'COMPLETED',
      }

      ;(prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment)

      const result = await paymentService.getPaymentById('payment1')

      expect(prisma.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'payment1' },
        include: { order: true },
      })
      expect(result).toEqual(mockPayment)
    })
  })
})

