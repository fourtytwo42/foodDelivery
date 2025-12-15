/**
 * @jest-environment node
 */
import { POST as processPayment } from '@/app/api/payments/route'
import { POST as confirmPayment } from '@/app/api/payments/confirm/route'
import { paymentService } from '@/services/payment/payment-service'
import { NextRequest } from 'next/server'

jest.mock('@/services/payment/payment-service')

const createMockRequest = (url: string, body?: unknown, method = 'POST') => {
  const urlObj = new URL(url)
  return {
    url: url,
    method,
    json: async () => body,
    nextUrl: urlObj,
    headers: new Headers(),
  } as unknown as NextRequest
}

describe('Payments API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/payments', () => {
    it('should process a cash payment', async () => {
      const mockResult = {
        success: true,
        paymentId: 'payment1',
      }

      ;(paymentService.processPayment as jest.Mock).mockResolvedValue(
        mockResult
      )

      const paymentData = {
        orderId: 'order1',
        amount: 20.0,
        paymentMethod: 'CASH',
      }

      const request = createMockRequest(
        'http://localhost:3000/api/payments',
        paymentData,
        'POST'
      )
      const response = await processPayment(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.paymentId).toBe('payment1')
    })

    it('should process a Stripe payment', async () => {
      const mockResult = {
        success: true,
        paymentId: 'payment1',
        paymentIntentId: 'pi_123',
        clientSecret: 'pi_123_secret',
      }

      ;(paymentService.processPayment as jest.Mock).mockResolvedValue(
        mockResult
      )

      const paymentData = {
        orderId: 'order1',
        amount: 20.0,
        paymentMethod: 'STRIPE',
        customerEmail: 'test@example.com',
      }

      const request = createMockRequest(
        'http://localhost:3000/api/payments',
        paymentData,
        'POST'
      )
      const response = await processPayment(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.paymentIntentId).toBe('pi_123')
    })

    it('should return error for failed payment', async () => {
      const mockResult = {
        success: false,
        error: 'Payment failed',
      }

      ;(paymentService.processPayment as jest.Mock).mockResolvedValue(
        mockResult
      )

      const paymentData = {
        orderId: 'order1',
        amount: 20.0,
        paymentMethod: 'STRIPE',
      }

      const request = createMockRequest(
        'http://localhost:3000/api/payments',
        paymentData,
        'POST'
      )
      const response = await processPayment(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Payment failed')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required fields
        paymentMethod: 'STRIPE',
      }

      const request = createMockRequest(
        'http://localhost:3000/api/payments',
        invalidData,
        'POST'
      )
      const response = await processPayment(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should handle processing errors', async () => {
      ;(paymentService.processPayment as jest.Mock).mockRejectedValue(
        new Error('Service error')
      )

      const paymentData = {
        orderId: 'order1',
        amount: 20.0,
        paymentMethod: 'STRIPE',
      }

      const request = createMockRequest(
        'http://localhost:3000/api/payments',
        paymentData,
        'POST'
      )
      const response = await processPayment(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process payment')
    })

    it('should handle unsupported payment methods', async () => {
      const mockResult = {
        success: false,
        error: 'Payment method PAYPAL not yet implemented',
      }

      ;(paymentService.processPayment as jest.Mock).mockResolvedValue(
        mockResult
      )

      const paymentData = {
        orderId: 'order1',
        amount: 20.0,
        paymentMethod: 'PAYPAL',
      }

      const request = createMockRequest(
        'http://localhost:3000/api/payments',
        paymentData,
        'POST'
      )
      const response = await processPayment(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('not yet implemented')
    })
  })

  describe('POST /api/payments/confirm', () => {
    it('should confirm a payment intent', async () => {
      const mockResult = {
        success: true,
        paymentId: 'payment1',
        paymentIntentId: 'pi_123',
      }

      ;(paymentService.confirmPaymentIntent as jest.Mock).mockResolvedValue(
        mockResult
      )

      const confirmData = {
        paymentIntentId: 'pi_123',
      }

      const request = createMockRequest(
        'http://localhost:3000/api/payments/confirm',
        confirmData,
        'POST'
      )
      const response = await confirmPayment(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.paymentIntentId).toBe('pi_123')
    })

    it('should confirm a payment intent with payment method', async () => {
      const mockResult = {
        success: true,
        paymentId: 'payment1',
        paymentIntentId: 'pi_123',
        requiresAction: false,
      }

      ;(paymentService.confirmPaymentIntent as jest.Mock).mockResolvedValue(
        mockResult
      )

      const confirmData = {
        paymentIntentId: 'pi_123',
        paymentMethodId: 'pm_123',
      }

      const request = createMockRequest(
        'http://localhost:3000/api/payments/confirm',
        confirmData,
        'POST'
      )
      const response = await confirmPayment(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(paymentService.confirmPaymentIntent).toHaveBeenCalledWith(
        'pi_123',
        'pm_123'
      )
    })

    it('should return error for failed confirmation', async () => {
      const mockResult = {
        success: false,
        error: 'Payment confirmation failed',
      }

      ;(paymentService.confirmPaymentIntent as jest.Mock).mockResolvedValue(
        mockResult
      )

      const confirmData = {
        paymentIntentId: 'pi_123',
      }

      const request = createMockRequest(
        'http://localhost:3000/api/payments/confirm',
        confirmData,
        'POST'
      )
      const response = await confirmPayment(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Payment confirmation failed')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing paymentIntentId
      }

      const request = createMockRequest(
        'http://localhost:3000/api/payments/confirm',
        invalidData,
        'POST'
      )
      const response = await confirmPayment(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should handle errors', async () => {
      ;(paymentService.confirmPaymentIntent as jest.Mock).mockRejectedValue(
        new Error('Service error')
      )

      const confirmData = {
        paymentIntentId: 'pi_123',
      }

      const request = createMockRequest(
        'http://localhost:3000/api/payments/confirm',
        confirmData,
        'POST'
      )
      const response = await confirmPayment(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to confirm payment')
    })
  })
})

