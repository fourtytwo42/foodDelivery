import { deliveryService } from '@/services/delivery-service'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    delivery: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    order: {
      update: jest.fn(),
    },
  },
}))

describe('deliveryService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createDelivery', () => {
    it('should create a delivery record', async () => {
      const mockDelivery = {
        id: 'delivery1',
        orderId: 'order1',
        status: 'PENDING',
      }

      ;(prisma.delivery.create as jest.Mock).mockResolvedValue(mockDelivery)

      const result = await deliveryService.createDelivery({
        orderId: 'order1',
        deliveryAddress: { street: '123 Main St', city: 'SF' },
      })

      expect(prisma.delivery.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order1',
          status: 'PENDING',
        }),
        include: expect.any(Object),
      })
      expect(result).toEqual(mockDelivery)
    })
  })

  describe('getDeliveryById', () => {
    it('should fetch delivery by ID', async () => {
      const mockDelivery = { id: 'delivery1', orderId: 'order1' }
      ;(prisma.delivery.findUnique as jest.Mock).mockResolvedValue(mockDelivery)

      const result = await deliveryService.getDeliveryById('delivery1')

      expect(prisma.delivery.findUnique).toHaveBeenCalledWith({
        where: { id: 'delivery1' },
        include: expect.any(Object),
      })
      expect(result).toEqual(mockDelivery)
    })
  })

  describe('getDeliveryByOrderId', () => {
    it('should fetch delivery by order ID', async () => {
      const mockDelivery = { id: 'delivery1', orderId: 'order1' }
      ;(prisma.delivery.findUnique as jest.Mock).mockResolvedValue(mockDelivery)

      const result = await deliveryService.getDeliveryByOrderId('order1')

      expect(prisma.delivery.findUnique).toHaveBeenCalledWith({
        where: { orderId: 'order1' },
        include: expect.any(Object),
      })
      expect(result).toEqual(mockDelivery)
    })
  })

  describe('getDeliveries', () => {
    it('should fetch deliveries with filters', async () => {
      const mockDeliveries = [{ id: 'delivery1' }]
      ;(prisma.delivery.findMany as jest.Mock).mockResolvedValue(mockDeliveries)

      const result = await deliveryService.getDeliveries({
        driverId: 'driver1',
        status: 'PENDING',
      })

      expect(prisma.delivery.findMany).toHaveBeenCalledWith({
        where: { driverId: 'driver1', status: 'PENDING' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockDeliveries)
    })

    it('should fetch all deliveries without filters', async () => {
      const mockDeliveries = [{ id: 'delivery1' }]
      ;(prisma.delivery.findMany as jest.Mock).mockResolvedValue(mockDeliveries)

      const result = await deliveryService.getDeliveries()

      expect(prisma.delivery.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockDeliveries)
    })
  })

  describe('assignDelivery', () => {
    it('should assign delivery to driver', async () => {
      const mockDelivery = { id: 'delivery1', driverId: 'driver1', status: 'ASSIGNED' }
      ;(prisma.delivery.update as jest.Mock).mockResolvedValue(mockDelivery)

      const result = await deliveryService.assignDelivery('delivery1', 'driver1')

      expect(prisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery1' },
        data: { driverId: 'driver1', status: 'ASSIGNED' },
        include: expect.any(Object),
      })
      expect(result).toEqual(mockDelivery)
    })
  })

  describe('acceptDelivery', () => {
    it('should accept delivery', async () => {
      const mockDelivery = { id: 'delivery1', driverId: 'driver1', status: 'ASSIGNED' }
      const mockAcceptedDelivery = { ...mockDelivery, status: 'ACCEPTED' }

      ;(prisma.delivery.findUnique as jest.Mock).mockResolvedValue(mockDelivery)
      ;(prisma.delivery.update as jest.Mock).mockResolvedValue(mockAcceptedDelivery)

      const result = await deliveryService.acceptDelivery('delivery1', 'driver1')

      expect(prisma.delivery.findUnique).toHaveBeenCalledWith({
        where: { id: 'delivery1' },
      })
      expect(prisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery1' },
        data: { status: 'ACCEPTED' },
        include: expect.any(Object),
      })
      expect(result.status).toBe('ACCEPTED')
    })

    it('should throw error if delivery not found', async () => {
      ;(prisma.delivery.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        deliveryService.acceptDelivery('delivery1', 'driver1')
      ).rejects.toThrow('Delivery not found')
    })

    it('should throw error if driver not assigned', async () => {
      const mockDelivery = { id: 'delivery1', driverId: 'driver2' }
      ;(prisma.delivery.findUnique as jest.Mock).mockResolvedValue(mockDelivery)

      await expect(
        deliveryService.acceptDelivery('delivery1', 'driver1')
      ).rejects.toThrow('Delivery not assigned to this driver')
    })
  })

  describe('updateDriverLocation', () => {
    it('should update driver location', async () => {
      const mockDelivery = { id: 'delivery1', driverLatitude: 37.7749, driverLongitude: -122.4194 }
      ;(prisma.delivery.update as jest.Mock).mockResolvedValue(mockDelivery)

      const result = await deliveryService.updateDriverLocation('delivery1', 37.7749, -122.4194)

      expect(prisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery1' },
        data: {
          driverLatitude: 37.7749,
          driverLongitude: -122.4194,
          driverLocationUpdatedAt: expect.any(Date),
        },
      })
      expect(result).toEqual(mockDelivery)
    })
  })

  describe('markPickedUp', () => {
    it('should mark delivery as picked up', async () => {
      const mockDelivery = { id: 'delivery1', driverId: 'driver1', orderId: 'order1' }
      const mockUpdatedDelivery = { ...mockDelivery, status: 'IN_TRANSIT', actualPickupTime: new Date() }

      ;(prisma.delivery.findUnique as jest.Mock).mockResolvedValue(mockDelivery)
      ;(prisma.delivery.update as jest.Mock).mockResolvedValue(mockUpdatedDelivery)
      ;(prisma.order.update as jest.Mock).mockResolvedValue({})

      const result = await deliveryService.markPickedUp('delivery1', 'driver1')

      expect(prisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery1' },
        data: {
          status: 'IN_TRANSIT',
          actualPickupTime: expect.any(Date),
        },
        include: expect.any(Object),
      })
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order1' },
        data: {
          status: 'OUT_FOR_DELIVERY',
          outForDeliveryAt: expect.any(Date),
        },
      })
      expect(result).toEqual(mockUpdatedDelivery)
    })

    it('should throw error if delivery not found', async () => {
      ;(prisma.delivery.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        deliveryService.markPickedUp('delivery1', 'driver1')
      ).rejects.toThrow('Delivery not found')
    })

    it('should throw error if driver not assigned', async () => {
      const mockDelivery = { id: 'delivery1', driverId: 'driver2' }
      ;(prisma.delivery.findUnique as jest.Mock).mockResolvedValue(mockDelivery)

      await expect(
        deliveryService.markPickedUp('delivery1', 'driver1')
      ).rejects.toThrow('Delivery not assigned to this driver')
    })
  })

  describe('markDelivered', () => {
    it('should mark delivery as delivered', async () => {
      const mockDelivery = { id: 'delivery1', driverId: 'driver1', orderId: 'order1' }
      const mockUpdatedDelivery = { ...mockDelivery, status: 'DELIVERED', actualDeliveryTime: new Date() }

      ;(prisma.delivery.findUnique as jest.Mock).mockResolvedValue(mockDelivery)
      ;(prisma.delivery.update as jest.Mock).mockResolvedValue(mockUpdatedDelivery)
      ;(prisma.order.update as jest.Mock).mockResolvedValue({})

      const result = await deliveryService.markDelivered('delivery1', 'driver1', 'Notes')

      expect(prisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery1' },
        data: {
          status: 'DELIVERED',
          actualDeliveryTime: expect.any(Date),
          driverNotes: 'Notes',
        },
        include: expect.any(Object),
      })
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order1' },
        data: {
          status: 'DELIVERED',
          deliveredAt: expect.any(Date),
          actualDeliveryTime: expect.any(Date),
        },
      })
      expect(result).toEqual(mockUpdatedDelivery)
    })

    it('should handle delivery without notes', async () => {
      const mockDelivery = { id: 'delivery1', driverId: 'driver1', orderId: 'order1' }
      ;(prisma.delivery.findUnique as jest.Mock).mockResolvedValue(mockDelivery)
      ;(prisma.delivery.update as jest.Mock).mockResolvedValue(mockDelivery)
      ;(prisma.order.update as jest.Mock).mockResolvedValue({})

      await deliveryService.markDelivered('delivery1', 'driver1')

      expect(prisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery1' },
        data: expect.objectContaining({
          driverNotes: null,
        }),
        include: expect.any(Object),
      })
    })

    it('should throw error if delivery not found', async () => {
      ;(prisma.delivery.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        deliveryService.markDelivered('delivery1', 'driver1')
      ).rejects.toThrow('Delivery not found')
    })
  })

  describe('updateDeliveryStatus', () => {
    it('should update delivery status', async () => {
      const mockDelivery = { id: 'delivery1', status: 'ASSIGNED' }
      ;(prisma.delivery.update as jest.Mock).mockResolvedValue(mockDelivery)

      const result = await deliveryService.updateDeliveryStatus('delivery1', 'ASSIGNED')

      expect(prisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery1' },
        data: { status: 'ASSIGNED' },
        include: expect.any(Object),
      })
      expect(result).toEqual(mockDelivery)
    })
  })
})

