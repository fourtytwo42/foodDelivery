import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { Prisma } from '@prisma/client'

export interface CreateCouponInput {
  code: string
  name: string
  description?: string
  type: 'PERCENTAGE' | 'FIXED' | 'BUY_X_GET_Y' | 'FREE_SHIPPING'
  discountValue?: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  buyXGetY?: {
    buyQuantity: number
    getQuantity: number
    getItemId?: string
  }
  usageLimit?: number
  usageLimitPerUser?: number
  validFrom: Date
  validUntil: Date
  createdBy?: string
}

export interface ApplyCouponInput {
  couponCode: string
  orderSubtotal: number
  orderItems: Array<{
    menuItemId: string
    quantity: number
    price: number
  }>
  userId?: string
  deliveryFee?: number
}

export interface ValidateCouponInput {
  couponCode: string
  orderSubtotal: number
  userId?: string
}

export const couponService = {
  /**
   * Create a coupon
   */
  async createCoupon(data: CreateCouponInput) {
    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: data.code },
    })

    if (existing) {
      throw new Error('Coupon code already exists')
    }

    return prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description || null,
        type: data.type,
        discountValue: data.discountValue
          ? new Decimal(data.discountValue)
          : null,
        minOrderAmount: data.minOrderAmount
          ? new Decimal(data.minOrderAmount)
          : null,
        maxDiscountAmount: data.maxDiscountAmount
          ? new Decimal(data.maxDiscountAmount)
          : null,
        buyXGetY: data.buyXGetY || Prisma.JsonNull,
        usageLimit: data.usageLimit || null,
        usageLimitPerUser: data.usageLimitPerUser || null,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        createdBy: data.createdBy || null,
      },
    })
  },

  /**
   * Get coupon by code
   */
  async getCouponByCode(code: string) {
    return prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        creator: true,
        usages: {
          orderBy: {
            usedAt: 'desc',
          },
          take: 10,
        },
      },
    })
  },

  /**
   * Get coupon by ID
   */
  async getCouponById(id: string) {
    return prisma.coupon.findUnique({
      where: { id },
      include: {
        creator: true,
        usages: {
          include: {
            order: true,
            user: true,
          },
        },
      },
    })
  },

  /**
   * Get all coupons
   */
  async getCoupons(filters?: { status?: string; active?: boolean }) {
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.active) {
      const now = new Date()
      where.status = 'ACTIVE'
      where.validFrom = { lte: now }
      where.validUntil = { gte: now }
    }

    return prisma.coupon.findMany({
      where,
      include: {
        creator: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },

  /**
   * Update coupon
   */
  async updateCoupon(id: string, data: Partial<CreateCouponInput>) {
    const updateData: any = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.discountValue !== undefined)
      updateData.discountValue = new Decimal(data.discountValue)
    if (data.minOrderAmount !== undefined)
      updateData.minOrderAmount = new Decimal(data.minOrderAmount)
    if (data.maxDiscountAmount !== undefined)
      updateData.maxDiscountAmount = new Decimal(data.maxDiscountAmount)
    if (data.buyXGetY !== undefined) updateData.buyXGetY = data.buyXGetY
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit
    if (data.usageLimitPerUser !== undefined)
      updateData.usageLimitPerUser = data.usageLimitPerUser
    if (data.validFrom !== undefined) updateData.validFrom = data.validFrom
    if (data.validUntil !== undefined) updateData.validUntil = data.validUntil
    if (data.description === null) updateData.description = null

    return prisma.coupon.update({
      where: { id },
      data: updateData,
    })
  },

  /**
   * Validate coupon
   */
  async validateCoupon(data: ValidateCouponInput): Promise<{
    valid: boolean
    coupon?: any
    error?: string
  }> {
    const coupon = await this.getCouponByCode(data.couponCode)

    if (!coupon) {
      return { valid: false, error: 'Coupon not found' }
    }

    if (coupon.status !== 'ACTIVE') {
      return { valid: false, error: 'Coupon is not active' }
    }

    const now = new Date()
    if (coupon.validFrom > now) {
      return { valid: false, error: 'Coupon is not yet valid' }
    }

    if (coupon.validUntil < now) {
      // Auto-expire
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { status: 'EXPIRED' },
      })
      return { valid: false, error: 'Coupon has expired' }
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, error: 'Coupon usage limit reached' }
    }

    // Check per-user usage limit
    if (data.userId && coupon.usageLimitPerUser) {
      const userUsageCount = await prisma.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId: data.userId,
        },
      })

      if (userUsageCount >= coupon.usageLimitPerUser) {
        return { valid: false, error: 'You have reached the usage limit for this coupon' }
      }
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && data.orderSubtotal < Number(coupon.minOrderAmount)) {
      return {
        valid: false,
        error: `Minimum order amount of $${Number(coupon.minOrderAmount).toFixed(2)} required`,
      }
    }

    return { valid: true, coupon }
  },

  /**
   * Calculate discount amount
   */
  calculateDiscount(coupon: any, subtotal: number, deliveryFee: number = 0): number {
    let discount = 0

    switch (coupon.type) {
      case 'PERCENTAGE': {
        const percentage = coupon.discountValue ? Number(coupon.discountValue) : 0
        discount = (subtotal * percentage) / 100
        if (coupon.maxDiscountAmount) {
          discount = Math.min(discount, Number(coupon.maxDiscountAmount))
        }
        break
      }

      case 'FIXED': {
        discount = coupon.discountValue ? Number(coupon.discountValue) : 0
        // Don't allow discount to exceed subtotal
        discount = Math.min(discount, subtotal)
        break
      }

      case 'FREE_SHIPPING': {
        discount = deliveryFee
        break
      }

      case 'BUY_X_GET_Y': {
        // This would require more complex logic based on order items
        // For now, return 0 (would need to implement item-based discount)
        discount = 0
        break
      }
    }

    return Math.max(0, Math.round(discount * 100) / 100) // Round to 2 decimals
  },

  /**
   * Apply coupon to order
   */
  async applyCoupon(data: ApplyCouponInput): Promise<{
    success: boolean
    discount?: number
    coupon?: any
    error?: string
  }> {
    // Validate coupon
    const validation = await this.validateCoupon({
      couponCode: data.couponCode,
      orderSubtotal: data.orderSubtotal,
      userId: data.userId,
    })

    if (!validation.valid || !validation.coupon) {
      return { success: false, error: validation.error }
    }

    const coupon = validation.coupon

    // Calculate discount
    const discount = this.calculateDiscount(
      coupon,
      data.orderSubtotal,
      data.deliveryFee || 0
    )

    return {
      success: true,
      discount,
      coupon,
    }
  },

  /**
   * Record coupon usage
   */
  async recordUsage(couponId: string, orderId: string, discountAmount: number, userId?: string) {
    // Create usage record
    await prisma.couponUsage.create({
      data: {
        couponId,
        orderId,
        userId: userId || null,
        discountAmount: new Decimal(discountAmount),
      },
    })

    // Update coupon usage count
    await prisma.coupon.update({
      where: { id: couponId },
      data: {
        usageCount: { increment: 1 },
      },
    })

    // Check if usage limit reached and update status
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    })

    if (coupon && coupon.usageLimit && coupon.usageCount + 1 >= coupon.usageLimit) {
      await prisma.coupon.update({
        where: { id: couponId },
        data: { status: 'INACTIVE' },
      })
    }
  },

  /**
   * Delete coupon (soft delete by setting status)
   */
  async deleteCoupon(id: string) {
    return prisma.coupon.update({
      where: { id },
      data: { status: 'INACTIVE' },
    })
  },
}

