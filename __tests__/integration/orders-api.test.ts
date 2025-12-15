/**
 * @jest-environment node
 */
import { POST as createOrder, GET as getOrders } from '@/app/api/orders/route'
import { GET as getOrder } from '@/app/api/orders/[id]/route'
import { orderService } from '@/services/order-service'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

jest.mock('@/services/order-service')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    restaurantSettings: {
      findUnique: jest.fn(),
    },
  },
}))

const createMockRequest = (url: string, body?: unknown, method = 'GET') => {
  const urlObj = new URL(url)
  return {
    url: url,
    method,
    json: async () => body,
    nextUrl: urlObj,
    headers: new Headers(),
  } as unknown as NextRequest
}

describe('Orders API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/orders', () => {
    it('should create a delivery order', async () => {
      const mockSettings = {
        id: 'default',
        taxRate: 0.0825,
        minOrderAmount: 0,
      }

      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        status: 'PENDING',
        type: 'DELIVERY',
        total: 20.0,
      }

      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(
        mockSettings
      )
      ;(orderService.createOrder as jest.Mock).mockResolvedValue(mockOrder)

      const orderData = {
        type: 'DELIVERY',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '1234567890',
        items: [
          {
            menuItemId: 'item1',
            name: 'Pizza',
            price: 14.99,
            quantity: 1,
            modifiers: [],
          },
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
        tip: 2,
        discount: 0,
      }

      const request = createMockRequest('http://localhost:3000/api/orders', orderData, 'POST')
      const response = await createOrder(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.order).toEqual(mockOrder)
      expect(orderService.createOrder).toHaveBeenCalled()
    })

    it('should create a pickup order', async () => {
      const mockSettings = {
        id: 'default',
        taxRate: 0.0825,
        minOrderAmount: 0,
      }

      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        status: 'PENDING',
        type: 'PICKUP',
        total: 16.23,
      }

      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(
        mockSettings
      )
      ;(orderService.createOrder as jest.Mock).mockResolvedValue(mockOrder)

      const orderData = {
        type: 'PICKUP',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '1234567890',
        items: [
          {
            menuItemId: 'item1',
            name: 'Pizza',
            price: 14.99,
            quantity: 1,
            modifiers: [],
          },
        ],
        tip: 0,
        discount: 0,
      }

      const request = createMockRequest('http://localhost:3000/api/orders', orderData, 'POST')
      const response = await createOrder(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    })

    it('should validate minimum order amount', async () => {
      const mockSettings = {
        id: 'default',
        taxRate: 0.0825,
        minOrderAmount: 20,
      }

      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(
        mockSettings
      )

      const orderData = {
        type: 'DELIVERY',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '1234567890',
        items: [
          {
            menuItemId: 'item1',
            name: 'Pizza',
            price: 10.0, // Below minimum
            quantity: 1,
            modifiers: [],
          },
        ],
        tip: 0,
        discount: 0,
      }

      const request = createMockRequest('http://localhost:3000/api/orders', orderData, 'POST')
      const response = await createOrder(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Minimum order amount')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        type: 'DELIVERY',
        // Missing required fields
      }

      const request = createMockRequest('http://localhost:3000/api/orders', invalidData, 'POST')
      const response = await createOrder(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })
  })

  describe('GET /api/orders', () => {
    it('should return orders', async () => {
      const mockOrders = [
        {
          id: 'order1',
          orderNumber: 'ORD-123',
          status: 'PENDING',
        },
      ]

      ;(orderService.getOrders as jest.Mock).mockResolvedValue(mockOrders)

      const request = createMockRequest('http://localhost:3000/api/orders')
      const response = await getOrders(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.orders).toEqual(mockOrders)
    })

    it('should filter orders by userId', async () => {
      const mockOrders = [
        {
          id: 'order1',
          orderNumber: 'ORD-123',
          userId: 'user1',
        },
      ]

      ;(orderService.getOrders as jest.Mock).mockResolvedValue(mockOrders)

      const request = createMockRequest('http://localhost:3000/api/orders?userId=user1')
      const response = await getOrders(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(orderService.getOrders).toHaveBeenCalledWith({ userId: 'user1' })
    })
  })

  describe('GET /api/orders/[id]', () => {
    it('should return an order by id', async () => {
      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        status: 'PENDING',
      }

      ;(orderService.getOrderById as jest.Mock).mockResolvedValue(mockOrder)

      const request = createMockRequest('http://localhost:3000/api/orders/order1')
      const response = await getOrder(request, {
        params: Promise.resolve({ id: 'order1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.order).toEqual(mockOrder)
    })

    it('should return 404 when order not found', async () => {
      ;(orderService.getOrderById as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/orders/notfound')
      const response = await getOrder(request, {
        params: Promise.resolve({ id: 'notfound' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Order not found')
    })
  })
})

