/**
 * @jest-environment node
 */
import { GET as getReceipt } from '@/app/api/orders/[id]/receipt/route'
import { orderService } from '@/services/order-service'
import { NextRequest } from 'next/server'

jest.mock('@/services/order-service', () => ({
  orderService: {
    getOrderById: jest.fn(),
  },
}))

const createMockRequest = (url: string) => {
  return {
    url,
  } as unknown as NextRequest
}

describe('Order Receipt API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/orders/[id]/receipt', () => {
    it('should generate receipt HTML', async () => {
      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        placedAt: new Date('2024-01-15T12:00:00Z'),
        customerName: 'John Doe',
        type: 'DELIVERY',
        items: [
          {
            id: 'item1',
            name: 'Pizza',
            quantity: 2,
            price: { toNumber: () => 14.99 },
          },
        ],
        subtotal: { toNumber: () => 29.98 },
        tax: { toNumber: () => 2.47 },
        deliveryFee: { toNumber: () => 3.99 },
        tip: { toNumber: () => 5.0 },
        discount: { toNumber: () => 0 },
        total: { toNumber: () => 41.44 },
        paymentMethod: 'STRIPE',
        paymentStatus: 'PAID',
      }

      ;(orderService.getOrderById as jest.Mock).mockResolvedValue(mockOrder)

      const request = createMockRequest('http://localhost:3000/api/orders/order1/receipt')

      const response = await getReceipt(request, {
        params: Promise.resolve({ id: 'order1' }),
      })
      const html = await response.text()

      expect(response.status).toBe(200)
      expect(html).toContain('ORD-123')
      expect(html).toContain('John Doe')
      expect(html).toContain('Pizza')
      expect(html).toContain('$41.44')
      expect(html).toContain('STRIPE')
    })

    it('should return 404 when order not found', async () => {
      ;(orderService.getOrderById as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/orders/order1/receipt')

      const response = await getReceipt(request, {
        params: Promise.resolve({ id: 'order1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Order not found')
    })

    it('should handle errors', async () => {
      ;(orderService.getOrderById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/orders/order1/receipt')

      const response = await getReceipt(request, {
        params: Promise.resolve({ id: 'order1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to generate receipt')
    })
  })
})

