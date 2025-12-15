/**
 * @jest-environment node
 */
import { PATCH as updateOrderStatus } from '@/app/api/orders/[id]/status/route'
import { orderService } from '@/services/order-service'
import { NextRequest } from 'next/server'

jest.mock('@/services/order-service', () => ({
  orderService: {
    updateOrderStatus: jest.fn(),
  },
}))

const createMockRequest = (url: string, body: unknown, method = 'PATCH') => {
  return {
    url,
    method,
    json: async () => body,
  } as unknown as NextRequest
}

describe('Order Status API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PATCH /api/orders/[id]/status', () => {
    it('should update order status', async () => {
      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        status: 'CONFIRMED',
      }

      ;(orderService.updateOrderStatus as jest.Mock).mockResolvedValue(mockOrder)

      const request = createMockRequest(
        'http://localhost:3000/api/orders/order1/status',
        { status: 'CONFIRMED' },
        'PATCH'
      )

      const response = await updateOrderStatus(request, {
        params: Promise.resolve({ id: 'order1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.order).toEqual(mockOrder)
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith('order1', 'CONFIRMED')
    })

    it('should return error for invalid status', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/orders/order1/status',
        { status: 'INVALID_STATUS' },
        'PATCH'
      )

      const response = await updateOrderStatus(request, {
        params: Promise.resolve({ id: 'order1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should handle errors', async () => {
      ;(orderService.updateOrderStatus as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/orders/order1/status',
        { status: 'CONFIRMED' },
        'PATCH'
      )

      const response = await updateOrderStatus(request, {
        params: Promise.resolve({ id: 'order1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update order status')
    })
  })
})

