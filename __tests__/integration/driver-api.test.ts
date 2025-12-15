/**
 * @jest-environment node
 */
import { GET as getDriverDeliveries } from '@/app/api/driver/deliveries/route'
import { GET as getDelivery } from '@/app/api/driver/deliveries/[id]/route'
import { POST as acceptDelivery } from '@/app/api/driver/deliveries/[id]/accept/route'
import { PUT as updateLocation } from '@/app/api/driver/deliveries/[id]/location/route'
import { POST as markPickedUp } from '@/app/api/driver/deliveries/[id]/picked-up/route'
import { POST as markDelivered } from '@/app/api/driver/deliveries/[id]/delivered/route'
import { deliveryService } from '@/services/delivery-service'
import { NextRequest } from 'next/server'

jest.mock('@/services/delivery-service', () => ({
  deliveryService: {
    getDeliveries: jest.fn(),
    getDeliveryById: jest.fn(),
    acceptDelivery: jest.fn(),
    updateDriverLocation: jest.fn(),
    markPickedUp: jest.fn(),
    markDelivered: jest.fn(),
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

describe('Driver API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/driver/deliveries', () => {
    it('should return driver deliveries', async () => {
      const mockDeliveries = [{ id: 'delivery1', driverId: 'driver1' }]
      ;(deliveryService.getDeliveries as jest.Mock).mockResolvedValue(mockDeliveries)

      const request = createMockRequest('http://localhost:3000/api/driver/deliveries?driverId=driver1')
      const response = await getDriverDeliveries(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.deliveries).toEqual(mockDeliveries)
    })

    it('should filter by status', async () => {
      const mockDeliveries = [{ id: 'delivery1', status: 'PENDING' }]
      ;(deliveryService.getDeliveries as jest.Mock).mockResolvedValue(mockDeliveries)

      const request = createMockRequest('http://localhost:3000/api/driver/deliveries?status=PENDING')
      const response = await getDriverDeliveries(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(deliveryService.getDeliveries).toHaveBeenCalledWith({
        driverId: undefined,
        status: 'PENDING',
      })
      expect(data.deliveries).toEqual(mockDeliveries)
    })

    it('should handle errors when fetching deliveries', async () => {
      ;(deliveryService.getDeliveries as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/driver/deliveries')
      const response = await getDriverDeliveries(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch deliveries')
    })
  })

  describe('GET /api/driver/deliveries/[id]', () => {
    it('should return delivery by ID', async () => {
      const mockDelivery = { id: 'delivery1', orderId: 'order1' }
      ;(deliveryService.getDeliveryById as jest.Mock).mockResolvedValue(mockDelivery)

      const request = createMockRequest('http://localhost:3000/api/driver/deliveries/delivery1')
      const response = await getDelivery(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.delivery).toEqual(mockDelivery)
    })

    it('should return 404 when delivery not found', async () => {
      ;(deliveryService.getDeliveryById as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/driver/deliveries/delivery1')
      const response = await getDelivery(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Delivery not found')
    })

    it('should handle errors when fetching delivery', async () => {
      ;(deliveryService.getDeliveryById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/driver/deliveries/delivery1')
      const response = await getDelivery(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch delivery')
    })
  })

  describe('POST /api/driver/deliveries/[id]/accept', () => {
    it('should accept delivery', async () => {
      const mockDelivery = { id: 'delivery1', status: 'ACCEPTED' }
      ;(deliveryService.acceptDelivery as jest.Mock).mockResolvedValue(mockDelivery)

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/accept',
        { driverId: 'driver1' },
        'POST'
      )

      const response = await acceptDelivery(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.delivery).toEqual(mockDelivery)
      expect(deliveryService.acceptDelivery).toHaveBeenCalledWith('delivery1', 'driver1')
    })

    it('should return 404 when delivery not found', async () => {
      ;(deliveryService.acceptDelivery as jest.Mock).mockRejectedValue(
        new Error('Delivery not found')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/accept',
        { driverId: 'driver1' },
        'POST'
      )

      const response = await acceptDelivery(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Delivery not found')
    })

    it('should return 403 when driver not assigned', async () => {
      ;(deliveryService.acceptDelivery as jest.Mock).mockRejectedValue(
        new Error('Delivery not assigned to this driver')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/accept',
        { driverId: 'driver1' },
        'POST'
      )

      const response = await acceptDelivery(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('not assigned')
    })

    it('should handle validation errors', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/accept',
        { driverId: '' }, // Invalid: empty driverId
        'POST'
      )

      const response = await acceptDelivery(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should handle errors when accepting delivery', async () => {
      ;(deliveryService.acceptDelivery as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/accept',
        { driverId: 'driver1' },
        'POST'
      )

      const response = await acceptDelivery(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to accept delivery')
    })
  })

  describe('PUT /api/driver/deliveries/[id]/location', () => {
    it('should update driver location', async () => {
      const mockDelivery = { id: 'delivery1', driverLatitude: 37.7749, driverLongitude: -122.4194 }
      ;(deliveryService.updateDriverLocation as jest.Mock).mockResolvedValue(mockDelivery)

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/location',
        { latitude: 37.7749, longitude: -122.4194 },
        'PUT'
      )

      const response = await updateLocation(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(deliveryService.updateDriverLocation).toHaveBeenCalledWith(
        'delivery1',
        37.7749,
        -122.4194
      )
    })

    it('should handle validation errors for invalid latitude', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/location',
        { latitude: 100, longitude: -122.4194 }, // Invalid: latitude > 90
        'PUT'
      )

      const response = await updateLocation(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should handle validation errors for invalid longitude', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/location',
        { latitude: 37.7749, longitude: 200 }, // Invalid: longitude > 180
        'PUT'
      )

      const response = await updateLocation(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should handle errors when updating location', async () => {
      ;(deliveryService.updateDriverLocation as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/location',
        { latitude: 37.7749, longitude: -122.4194 },
        'PUT'
      )

      const response = await updateLocation(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update location')
    })
  })

  describe('POST /api/driver/deliveries/[id]/picked-up', () => {
    it('should mark delivery as picked up', async () => {
      const mockDelivery = { id: 'delivery1', status: 'IN_TRANSIT' }
      ;(deliveryService.markPickedUp as jest.Mock).mockResolvedValue(mockDelivery)

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/picked-up',
        { driverId: 'driver1' },
        'POST'
      )

      const response = await markPickedUp(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.delivery).toEqual(mockDelivery)
    })
  })

  describe('POST /api/driver/deliveries/[id]/delivered', () => {
    it('should mark delivery as delivered', async () => {
      const mockDelivery = { id: 'delivery1', status: 'DELIVERED' }
      ;(deliveryService.markDelivered as jest.Mock).mockResolvedValue(mockDelivery)

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/delivered',
        { driverId: 'driver1', driverNotes: 'Delivered successfully' },
        'POST'
      )

      const response = await markDelivered(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.delivery).toEqual(mockDelivery)
      expect(deliveryService.markDelivered).toHaveBeenCalledWith(
        'delivery1',
        'driver1',
        'Delivered successfully'
      )
    })

    it('should handle delivery without notes', async () => {
      const mockDelivery = { id: 'delivery1', status: 'DELIVERED' }
      ;(deliveryService.markDelivered as jest.Mock).mockResolvedValue(mockDelivery)

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/delivered',
        { driverId: 'driver1' },
        'POST'
      )

      const response = await markDelivered(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(deliveryService.markDelivered).toHaveBeenCalledWith('delivery1', 'driver1', undefined)
    })

    it('should handle validation errors', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/delivered',
        { driverId: '' }, // Invalid: empty driverId
        'POST'
      )

      const response = await markDelivered(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should return 404 when delivery not found', async () => {
      ;(deliveryService.markDelivered as jest.Mock).mockRejectedValue(
        new Error('Delivery not found')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/delivered',
        { driverId: 'driver1' },
        'POST'
      )

      const response = await markDelivered(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Delivery not found')
    })

    it('should return 403 when driver not assigned', async () => {
      ;(deliveryService.markDelivered as jest.Mock).mockRejectedValue(
        new Error('Delivery not assigned to this driver')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/delivered',
        { driverId: 'driver1' },
        'POST'
      )

      const response = await markDelivered(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('not assigned')
    })

    it('should handle errors when marking delivered', async () => {
      ;(deliveryService.markDelivered as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/delivered',
        { driverId: 'driver1' },
        'POST'
      )

      const response = await markDelivered(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to mark delivery as delivered')
    })
  })

  describe('POST /api/driver/deliveries/[id]/picked-up', () => {
    it('should handle validation errors', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/picked-up',
        { driverId: '' }, // Invalid: empty driverId
        'POST'
      )

      const response = await markPickedUp(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should return 404 when delivery not found', async () => {
      ;(deliveryService.markPickedUp as jest.Mock).mockRejectedValue(
        new Error('Delivery not found')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/picked-up',
        { driverId: 'driver1' },
        'POST'
      )

      const response = await markPickedUp(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Delivery not found')
    })

    it('should return 403 when driver not assigned', async () => {
      ;(deliveryService.markPickedUp as jest.Mock).mockRejectedValue(
        new Error('Delivery not assigned to this driver')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/picked-up',
        { driverId: 'driver1' },
        'POST'
      )

      const response = await markPickedUp(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('not assigned')
    })

    it('should handle errors when marking picked up', async () => {
      ;(deliveryService.markPickedUp as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/driver/deliveries/delivery1/picked-up',
        { driverId: 'driver1' },
        'POST'
      )

      const response = await markPickedUp(request, {
        params: Promise.resolve({ id: 'delivery1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to mark delivery as picked up')
    })
  })
})

