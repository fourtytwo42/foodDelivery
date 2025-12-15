import { orderService } from '@/services/order-service'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('orderService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateOrderNumber', () => {
    it('should generate a unique order number', () => {
      const orderNumber1 = orderService.generateOrderNumber()
      const orderNumber2 = orderService.generateOrderNumber()

      expect(orderNumber1).toMatch(/^ORD-/)
      expect(orderNumber1).not.toBe(orderNumber2)
    })
  })

  describe('createOrder', () => {
    it('should create an order with items and modifiers', async () => {
      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
        status: 'PENDING',
      }

      ;(prisma.order.create as jest.Mock).mockResolvedValue(mockOrder)

      const orderData = {
        type: 'DELIVERY' as const,
        items: [
          {
            menuItemId: 'item1',
            name: 'Pizza',
            price: 14.99,
            quantity: 2,
            modifiers: [
              {
                modifierId: 'mod1',
                modifierName: 'Size',
                optionId: 'opt1',
                optionName: 'Large',
                price: 2,
              },
            ],
          },
        ],
        subtotal: 30,
        tax: 2.48,
        deliveryFee: 3.99,
        tip: 5,
        discount: 0,
        total: 41.47,
      }

      const result = await orderService.createOrder(orderData)

      expect(prisma.order.create).toHaveBeenCalled()
      const callArgs = (prisma.order.create as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.items.create).toHaveLength(1)
      expect(callArgs.data.items.create[0].modifiers.create).toHaveLength(1)
      expect(result).toEqual(mockOrder)
    })
  })

  describe('getOrderById', () => {
    it('should fetch an order by id', async () => {
      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)

      const result = await orderService.getOrderById('order1')

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order1' },
        include: expect.any(Object),
      })
      expect(result).toEqual(mockOrder)
    })
  })

  describe('getOrderByOrderNumber', () => {
    it('should fetch an order by order number', async () => {
      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-123',
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)

      const result = await orderService.getOrderByOrderNumber('ORD-123')

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { orderNumber: 'ORD-123' },
        include: expect.any(Object),
      })
      expect(result).toEqual(mockOrder)
    })
  })

  describe('getOrders', () => {
    it('should fetch orders with filters', async () => {
      const mockOrders = [
        {
          id: 'order1',
          orderNumber: 'ORD-123',
          userId: 'user1',
        },
      ]

      ;(prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders)

      const result = await orderService.getOrders({ userId: 'user1' })

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: expect.any(Object),
        orderBy: { placedAt: 'desc' },
        take: 100,
      })
      expect(result).toEqual(mockOrders)
    })
  })

  describe('updateOrderStatus', () => {
    it('should update order status and set timestamps', async () => {
      const mockUpdated = {
        id: 'order1',
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      }

      ;(prisma.order.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await orderService.updateOrderStatus('order1', 'CONFIRMED')

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order1' },
        data: expect.objectContaining({
          status: 'CONFIRMED',
          confirmedAt: expect.any(Date),
        }),
      })
      expect(result).toEqual(mockUpdated)
    })

    it('should set deliveredAt when status is DELIVERED', async () => {
      const mockUpdated = {
        id: 'order1',
        status: 'DELIVERED',
        deliveredAt: new Date(),
        actualDeliveryTime: new Date(),
      }

      ;(prisma.order.update as jest.Mock).mockResolvedValue(mockUpdated)

      await orderService.updateOrderStatus('order1', 'DELIVERED')

      const callArgs = (prisma.order.update as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.actualDeliveryTime).toBeDefined()
      expect(callArgs.data.deliveredAt).toBeDefined()
    })

    it('should set preparingAt when status is PREPARING', async () => {
      const mockUpdated = {
        id: 'order1',
        status: 'PREPARING',
        preparingAt: new Date(),
      }

      ;(prisma.order.update as jest.Mock).mockResolvedValue(mockUpdated)

      await orderService.updateOrderStatus('order1', 'PREPARING')

      const callArgs = (prisma.order.update as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.preparingAt).toBeDefined()
    })

    it('should set readyAt when status is READY', async () => {
      const mockUpdated = {
        id: 'order1',
        status: 'READY',
        readyAt: new Date(),
      }

      ;(prisma.order.update as jest.Mock).mockResolvedValue(mockUpdated)

      await orderService.updateOrderStatus('order1', 'READY')

      const callArgs = (prisma.order.update as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.readyAt).toBeDefined()
    })

    it('should set outForDeliveryAt when status is OUT_FOR_DELIVERY', async () => {
      const mockUpdated = {
        id: 'order1',
        status: 'OUT_FOR_DELIVERY',
        outForDeliveryAt: new Date(),
      }

      ;(prisma.order.update as jest.Mock).mockResolvedValue(mockUpdated)

      await orderService.updateOrderStatus('order1', 'OUT_FOR_DELIVERY')

      const callArgs = (prisma.order.update as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.outForDeliveryAt).toBeDefined()
    })

    it('should set cancelledAt when status is CANCELLED', async () => {
      const mockUpdated = {
        id: 'order1',
        status: 'CANCELLED',
        cancelledAt: new Date(),
      }

      ;(prisma.order.update as jest.Mock).mockResolvedValue(mockUpdated)

      await orderService.updateOrderStatus('order1', 'CANCELLED')

      const callArgs = (prisma.order.update as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.cancelledAt).toBeDefined()
    })

    it('should handle unknown status without timestamps', async () => {
      const mockUpdated = {
        id: 'order1',
        status: 'UNKNOWN_STATUS',
      }

      ;(prisma.order.update as jest.Mock).mockResolvedValue(mockUpdated)

      await orderService.updateOrderStatus('order1', 'UNKNOWN_STATUS')

      const callArgs = (prisma.order.update as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.status).toBe('UNKNOWN_STATUS')
      // Should not have timestamp fields for unknown status
      expect(callArgs.data.confirmedAt).toBeUndefined()
    })
  })
})

