import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface CreateDeliveryInput {
  orderId: string
  deliveryAddress: any
  latitude?: number
  longitude?: number
  estimatedPickupTime?: Date
  estimatedDeliveryTime?: Date
  deliveryNotes?: string
}

export interface UpdateDeliveryLocationInput {
  deliveryId: string
  latitude: number
  longitude: number
}

export interface AssignDeliveryInput {
  deliveryId: string
  driverId: string
}

export interface DeliveryFilters {
  driverId?: string
  status?: string
  orderId?: string
}

export const deliveryService = {
  /**
   * Create a delivery record for an order
   */
  async createDelivery(data: CreateDeliveryInput) {
    return prisma.delivery.create({
      data: {
        orderId: data.orderId,
        deliveryAddress: data.deliveryAddress,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        estimatedPickupTime: data.estimatedPickupTime || null,
        estimatedDeliveryTime: data.estimatedDeliveryTime || null,
        deliveryNotes: data.deliveryNotes || null,
        status: 'PENDING',
      },
      include: {
        order: {
          include: {
            items: true,
            user: true,
          },
        },
        driver: true,
      },
    })
  },

  /**
   * Get delivery by ID
   */
  async getDeliveryById(id: string) {
    return prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                modifiers: true,
              },
            },
            user: true,
          },
        },
        driver: true,
      },
    })
  },

  /**
   * Get delivery by order ID
   */
  async getDeliveryByOrderId(orderId: string) {
    return prisma.delivery.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            items: {
              include: {
                modifiers: true,
              },
            },
            user: true,
          },
        },
        driver: true,
      },
    })
  },

  /**
   * Get deliveries with filters
   */
  async getDeliveries(filters?: DeliveryFilters) {
    const where: any = {}

    if (filters?.driverId) {
      where.driverId = filters.driverId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.orderId) {
      where.orderId = filters.orderId
    }

    return prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            items: true,
            user: true,
          },
        },
        driver: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },

  /**
   * Assign delivery to driver
   */
  async assignDelivery(deliveryId: string, driverId: string) {
    return prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        driverId,
        status: 'ASSIGNED',
      },
      include: {
        order: {
          include: {
            items: true,
            user: true,
          },
        },
        driver: true,
      },
    })
  },

  /**
   * Accept delivery by driver
   */
  async acceptDelivery(deliveryId: string, driverId: string) {
    // Verify driver is assigned
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    })

    if (!delivery) {
      throw new Error('Delivery not found')
    }

    if (delivery.driverId !== driverId) {
      throw new Error('Delivery not assigned to this driver')
    }

    return prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: 'ACCEPTED',
      },
      include: {
        order: {
          include: {
            items: true,
            user: true,
          },
        },
        driver: true,
      },
    })
  },

  /**
   * Update driver location
   */
  async updateDriverLocation(
    deliveryId: string,
    latitude: number,
    longitude: number
  ) {
    return prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        driverLatitude: latitude,
        driverLongitude: longitude,
        driverLocationUpdatedAt: new Date(),
      },
    })
  },

  /**
   * Mark delivery as picked up
   */
  async markPickedUp(deliveryId: string, driverId: string) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    })

    if (!delivery) {
      throw new Error('Delivery not found')
    }

    if (delivery.driverId !== driverId) {
      throw new Error('Delivery not assigned to this driver')
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: 'IN_TRANSIT',
        actualPickupTime: new Date(),
      },
      include: {
        order: true,
        driver: true,
      },
    })

    // Update order status to OUT_FOR_DELIVERY
    await prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        status: 'OUT_FOR_DELIVERY',
        outForDeliveryAt: new Date(),
      },
    })

    return updatedDelivery
  },

  /**
   * Mark delivery as delivered
   */
  async markDelivered(deliveryId: string, driverId: string, driverNotes?: string) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    })

    if (!delivery) {
      throw new Error('Delivery not found')
    }

    if (delivery.driverId !== driverId) {
      throw new Error('Delivery not assigned to this driver')
    }

    // Update delivery
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: 'DELIVERED',
        actualDeliveryTime: new Date(),
        driverNotes: driverNotes || null,
      },
      include: {
        order: true,
        driver: true,
      },
    })

    // Update order status
    await prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        actualDeliveryTime: new Date(),
      },
    })

    return updatedDelivery
  },

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(deliveryId: string, status: string) {
    return prisma.delivery.update({
      where: { id: deliveryId },
      data: { status },
      include: {
        order: {
          include: {
            items: true,
            user: true,
          },
        },
        driver: true,
      },
    })
  },
}

