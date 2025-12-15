/**
 * @jest-environment node
 */
import { POST as createDelivery, GET as getDeliveries } from '@/app/api/deliveries/route'
import { POST as assignDelivery } from '@/app/api/deliveries/[id]/assign/route'
import { deliveryService } from '@/services/delivery-service'
import { NextRequest } from 'next/server'

jest.mock('@/services/delivery-service', () => ({
  deliveryService: {
    createDelivery: jest.fn(),
    getDeliveries: jest.fn(),
    assignDelivery: jest.fn(),
  },
}))

const createMockRequest = (url: string, body?: unknown, method = 'GET') => {
  const urlObj = new URL(url)
  return {
    url,
    method,
    json: async () => body,
    nextUrl: urlObj,
    headers: new Headers(),
  } as unknown as NextRequest
}

describe('Deliveries API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/deliveries', () => {
    it('should create a delivery', async () => {
      const mockDelivery = {
        id: 'delivery1',
        orderId: 'order1',
        status: 'PENDING',
      }

      ;(deliveryService.createDelivery as jest.Mock).mockResolvedValue(mockDelivery)

      const request = createMockRequest(
        'http://localhost:3000/api/deliveries',
        {
          orderId: 'order1',
          deliveryAddress: { street: '123 Main St', city: 'SF' },
        },
        'POST'
      )

      const response = await createDelivery(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.delivery).toEqual(mockDelivery)
    })

    it('should handle validation errors', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/deliveries',
        { orderId: '' }, // Invalid: empty orderId
        'POST'
      )

      const response = await createDelivery(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should handle errors when creating delivery', async () => {
      ;(deliveryService.createDelivery as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/deliveries',
        {
          orderId: 'order1',
          deliveryAddress: { street: '123 Main St', city: 'SF' },
        },
        'POST'
      )

      const response = await createDelivery(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create delivery')
    })
  })

  describe('GET /api/deliveries', () => {
    it('should return deliveries', async () => {
      const mockDeliveries = [{ id: 'delivery1', orderId: 'order1' }]
      ;(deliveryService.getDeliveries as jest.Mock).mockResolvedValue(mockDeliveries)

      const request = createMockRequest('http://localhost:3000/api/deliveries')
      const response = await getDeliveries(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.deliveries).toEqual(mockDeliveries)
    })

    it('should filter deliveries by driverId', async () => {
      const mockDeliveries = [{ id: 'delivery1', driverId: 'driver1' }]
      ;(deliveryService.getDeliveries as jest.Mock).mockResolvedValue(mockDeliveries)

      const request = createMockRequest('http://localhost:3000/api/deliveries?driverId=driver1')
      const response = await getDeliveries(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(deliveryService.getDeliveries).toHaveBeenCalledWith({
        driverId: 'driver1',
        status: undefined,
        orderId: undefined,
      })
      expect(data.deliveries).toEqual(mockDeliveries)
    })

    it('should filter deliveries by status', async () => {
      const mockDeliveries = [{ id: 'delivery1', status: 'PENDING' }]
      ;(deliveryService.getDeliveries as jest.Mock).mockResolvedValue(mockDeliveries)

      const request = createMockRequest('http://localhost:3000/api/deliveries?status=PENDING')
      const response = await getDeliveries(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(deliveryService.getDeliveries).toHaveBeenCalledWith({
        driverId: undefined,
        status: 'PENDING',
        orderId: undefined,
      })
      expect(data.deliveries).toEqual(mockDeliveries)
    })

    it('should filter deliveries by orderId', async () => {
      const mockDeliveries = [{ id: 'delivery1', orderId: 'order1' }]
      ;(deliveryService.getDeliveries as jest.Mock).mockResolvedValue(mockDeliveries)

      const request = createMockRequest('http://localhost:3000/api/deliveries?orderId=order1')
      const response = await getDeliveries(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(deliveryService.getDeliveries).toHaveBeenCalledWith({
        driverId: undefined,
        status: undefined,
        orderId: 'order1',
      })
      expect(data.deliveries).toEqual(mockDeliveries)
    })

    it('should handle errors when fetching deliveries', async () => {
      ;(deliveryService.getDeliveries as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/deliveries')
      const response = await getDeliveries(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch deliveries')
    })
  })

  describe('POST /api/deliveries/[id]/assign', () => {
    it('should handle errors when assigning delivery', async () => {
      ;(deliveryService.assignDelivery as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/deliveries/delivery1/assign',
        { driverId: 'driver1' },
        'POST'
      )

      const response = await assignDelivery(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to assign delivery')
    })
  })

  describe('POST /api/deliveries/[id]/assign', () => {
    it('should assign delivery to driver', async () => {
      const mockDelivery = { id: 'delivery1', driverId: 'driver1', status: 'ASSIGNED' }
      ;(deliveryService.assignDelivery as jest.Mock).mockResolvedValue(mockDelivery)

      const request = createMockRequest(
        'http://localhost:3000/api/deliveries/delivery1/assign',
        { driverId: 'driver1' },
        'POST'
      )

      const response = await assignDelivery(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.delivery).toEqual(mockDelivery)
      expect(deliveryService.assignDelivery).toHaveBeenCalledWith('delivery1', 'driver1')
    })

    it('should handle validation errors', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/deliveries/delivery1/assign',
        { driverId: '' }, // Invalid: empty driverId
        'POST'
      )

      const response = await assignDelivery(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })
  })
})

