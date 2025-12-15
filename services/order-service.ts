import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { CartItem } from '@/stores/cart-store'

export interface CreateOrderInput {
  userId?: string
  customerEmail?: string
  customerPhone?: string
  customerName?: string
  type: 'DELIVERY' | 'PICKUP'
  items: CartItem[]
  subtotal: number
  tax: number
  deliveryFee: number
  tip: number
  discount: number
  total: number
  deliveryAddressId?: string
  deliveryAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country?: string
  }
  specialInstructions?: string
  deliveryInstructions?: string
  createdBy?: string
}

export interface OrderFilters {
  userId?: string
  status?: string
  type?: string
  orderNumber?: string
}

export const orderService = {
  /**
   * Generate a unique order number
   */
  generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `ORD-${timestamp}-${random}`
  },

  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderInput) {
    const orderNumber = this.generateOrderNumber()

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: data.userId || null,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerName: data.customerName,
        type: data.type,
        status: 'PENDING',
        subtotal: new Decimal(data.subtotal),
        tax: new Decimal(data.tax),
        deliveryFee: new Decimal(data.deliveryFee),
        tip: new Decimal(data.tip),
        discount: new Decimal(data.discount),
        total: new Decimal(data.total),
        deliveryAddressId: data.deliveryAddressId || null,
        deliveryAddress: data.deliveryAddress || null,
        specialInstructions: data.specialInstructions,
        deliveryInstructions: data.deliveryInstructions,
        createdBy: data.createdBy || null,
        items: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            description: item.description,
            price: new Decimal(item.price),
            quantity: item.quantity,
            specialInstructions: item.specialInstructions,
            modifiers: {
              create: item.modifiers.map((mod) => ({
                modifierOptionId: mod.optionId,
                modifierName: mod.modifierName,
                optionName: mod.optionName,
                price: new Decimal(mod.price),
                quantity: item.quantity,
              })),
            },
          })),
        },
      },
      include: {
        items: {
          include: {
            modifiers: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return order
  },

  /**
   * Get order by ID
   */
  async getOrderById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            modifiers: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  },

  /**
   * Get order by order number
   */
  async getOrderByOrderNumber(orderNumber: string) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            modifiers: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  },

  /**
   * Get orders with filters
   */
  async getOrders(filters?: OrderFilters) {
    return prisma.order.findMany({
      where: {
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.orderNumber && { orderNumber: filters.orderNumber }),
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { placedAt: 'desc' },
      take: 100,
    })
  },

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, status: string) {
    const updateData: any = { status }

    // Set timestamps based on status
    const now = new Date()
    switch (status) {
      case 'CONFIRMED':
        updateData.confirmedAt = now
        break
      case 'PREPARING':
        updateData.preparingAt = now
        break
      case 'READY':
        updateData.readyAt = now
        break
      case 'OUT_FOR_DELIVERY':
        updateData.outForDeliveryAt = now
        break
      case 'DELIVERED':
        updateData.deliveredAt = now
        updateData.actualDeliveryTime = now
        break
      case 'CANCELLED':
        updateData.cancelledAt = now
        break
    }

    return prisma.order.update({
      where: { id },
      data: updateData,
    })
  },
}

