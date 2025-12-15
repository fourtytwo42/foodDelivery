import { couponService } from '@/services/coupon-service'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    coupon: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    couponUsage: {
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}))

describe('couponService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createCoupon', () => {
    it('should create a coupon', async () => {
      const mockCoupon = {
        id: 'coupon1',
        code: 'SAVE10',
        type: 'PERCENTAGE',
        discountValue: 10,
      }

      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.coupon.create as jest.Mock).mockResolvedValue(mockCoupon)

      const result = await couponService.createCoupon({
        code: 'SAVE10',
        name: '10% Off',
        type: 'PERCENTAGE',
        discountValue: 10,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 86400000),
      })

      expect(prisma.coupon.create).toHaveBeenCalled()
      expect(result).toEqual(mockCoupon)
    })

    it('should throw error if code already exists', async () => {
      const existingCoupon = { id: 'coupon1', code: 'SAVE10' }
      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(existingCoupon)

      await expect(
        couponService.createCoupon({
          code: 'SAVE10',
          name: '10% Off',
          type: 'PERCENTAGE',
          discountValue: 10,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 86400000),
        })
      ).rejects.toThrow('Coupon code already exists')
    })
  })

  describe('getCouponByCode', () => {
    it('should fetch coupon by code (uppercase)', async () => {
      const mockCoupon = { id: 'coupon1', code: 'SAVE10' }
      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon)

      const result = await couponService.getCouponByCode('save10')

      expect(prisma.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'SAVE10' },
        include: expect.any(Object),
      })
      expect(result).toEqual(mockCoupon)
    })
  })

  describe('getCouponById', () => {
    it('should fetch coupon by ID', async () => {
      const mockCoupon = { id: 'coupon1', code: 'SAVE10' }
      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon)

      const result = await couponService.getCouponById('coupon1')

      expect(prisma.coupon.findUnique).toHaveBeenCalledWith({
        where: { id: 'coupon1' },
        include: expect.any(Object),
      })
      expect(result).toEqual(mockCoupon)
    })
  })

  describe('getCoupons', () => {
    it('should fetch all coupons without filters', async () => {
      const mockCoupons = [{ id: 'coupon1' }, { id: 'coupon2' }]
      ;(prisma.coupon.findMany as jest.Mock).mockResolvedValue(mockCoupons)

      const result = await couponService.getCoupons()

      expect(prisma.coupon.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: expect.any(Object),
      })
      expect(result).toEqual(mockCoupons)
    })

    it('should fetch coupons with status filter', async () => {
      const mockCoupons = [{ id: 'coupon1', status: 'ACTIVE' }]
      ;(prisma.coupon.findMany as jest.Mock).mockResolvedValue(mockCoupons)

      const result = await couponService.getCoupons({ status: 'ACTIVE' })

      expect(prisma.coupon.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      })
      expect(result).toEqual(mockCoupons)
    })

    it('should fetch active coupons with date filter', async () => {
      const mockCoupons = [{ id: 'coupon1', status: 'ACTIVE' }]
      ;(prisma.coupon.findMany as jest.Mock).mockResolvedValue(mockCoupons)

      const result = await couponService.getCoupons({ active: true })

      expect(prisma.coupon.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          validFrom: expect.any(Object),
          validUntil: expect.any(Object),
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      })
      expect(result).toEqual(mockCoupons)
    })
  })

  describe('updateCoupon', () => {
    it('should update coupon with provided fields', async () => {
      const mockCoupon = { id: 'coupon1', name: 'Updated Name' }
      ;(prisma.coupon.update as jest.Mock).mockResolvedValue(mockCoupon)

      const result = await couponService.updateCoupon('coupon1', {
        name: 'Updated Name',
        discountValue: 15,
      })

      expect(prisma.coupon.update).toHaveBeenCalledWith({
        where: { id: 'coupon1' },
        data: expect.objectContaining({
          name: 'Updated Name',
          discountValue: expect.any(Object),
        }),
      })
      expect(result).toEqual(mockCoupon)
    })

    it('should handle null description', async () => {
      const mockCoupon = { id: 'coupon1', description: null }
      ;(prisma.coupon.update as jest.Mock).mockResolvedValue(mockCoupon)

      const result = await couponService.updateCoupon('coupon1', {
        description: null,
      })

      expect(prisma.coupon.update).toHaveBeenCalledWith({
        where: { id: 'coupon1' },
        data: expect.objectContaining({
          description: null,
        }),
      })
      expect(result).toEqual(mockCoupon)
    })

    it('should update only defined fields', async () => {
      const mockCoupon = { id: 'coupon1', name: 'New Name' }
      ;(prisma.coupon.update as jest.Mock).mockResolvedValue(mockCoupon)

      await couponService.updateCoupon('coupon1', {
        name: 'New Name',
      })

      const updateCall = (prisma.coupon.update as jest.Mock).mock.calls[0][0]
      expect(updateCall.data).not.toHaveProperty('discountValue')
      expect(updateCall.data).not.toHaveProperty('type')
    })
  })

  describe('validateCoupon', () => {
    it('should validate active coupon', async () => {
      const now = new Date()
      const mockCoupon = {
        id: 'coupon1',
        code: 'SAVE10',
        status: 'ACTIVE',
        validFrom: new Date(now.getTime() - 86400000),
        validUntil: new Date(now.getTime() + 86400000),
        usageLimit: null,
        usageCount: 0,
        usageLimitPerUser: null,
        minOrderAmount: null,
      }

      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon)

      const result = await couponService.validateCoupon({
        couponCode: 'SAVE10',
        orderSubtotal: 50.0,
      })

      expect(result.valid).toBe(true)
      expect(result.coupon).toEqual(mockCoupon)
    })

    it('should reject inactive coupon', async () => {
      const mockCoupon = {
        id: 'coupon1',
        code: 'SAVE10',
        status: 'INACTIVE',
      }

      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon)

      const result = await couponService.validateCoupon({
        couponCode: 'SAVE10',
        orderSubtotal: 50.0,
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('not active')
    })

    it('should reject expired coupon', async () => {
      const now = new Date()
      const mockCoupon = {
        id: 'coupon1',
        code: 'SAVE10',
        status: 'ACTIVE',
        validFrom: new Date(now.getTime() - 86400000 * 2),
        validUntil: new Date(now.getTime() - 86400000), // Expired yesterday
        usageLimit: null,
        usageCount: 0,
      }

      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon)
      ;(prisma.coupon.update as jest.Mock).mockResolvedValue({ ...mockCoupon, status: 'EXPIRED' })

      const result = await couponService.validateCoupon({
        couponCode: 'SAVE10',
        orderSubtotal: 50.0,
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('should reject coupon that has not started', async () => {
      const now = new Date()
      const mockCoupon = {
        id: 'coupon1',
        code: 'SAVE10',
        status: 'ACTIVE',
        validFrom: new Date(now.getTime() + 86400000), // Starts tomorrow
        validUntil: new Date(now.getTime() + 86400000 * 2),
        usageLimit: null,
        usageCount: 0,
      }

      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon)

      const result = await couponService.validateCoupon({
        couponCode: 'SAVE10',
        orderSubtotal: 50.0,
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('not yet valid')
    })

    it('should reject coupon when usage limit reached', async () => {
      const now = new Date()
      const mockCoupon = {
        id: 'coupon1',
        code: 'SAVE10',
        status: 'ACTIVE',
        validFrom: new Date(now.getTime() - 86400000),
        validUntil: new Date(now.getTime() + 86400000),
        usageLimit: 10,
        usageCount: 10,
        minOrderAmount: null,
      }

      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon)

      const result = await couponService.validateCoupon({
        couponCode: 'SAVE10',
        orderSubtotal: 50.0,
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('usage limit reached')
    })

    it('should reject coupon when per-user usage limit reached', async () => {
      const now = new Date()
      const mockCoupon = {
        id: 'coupon1',
        code: 'SAVE10',
        status: 'ACTIVE',
        validFrom: new Date(now.getTime() - 86400000),
        validUntil: new Date(now.getTime() + 86400000),
        usageLimit: null,
        usageCount: 5,
        usageLimitPerUser: 2,
        minOrderAmount: null,
      }

      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon)
      ;(prisma.couponUsage.count as jest.Mock).mockResolvedValue(2)

      const result = await couponService.validateCoupon({
        couponCode: 'SAVE10',
        orderSubtotal: 50.0,
        userId: 'user1',
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('usage limit')
    })

    it('should reject coupon when order subtotal below minimum', async () => {
      const now = new Date()
      const mockCoupon = {
        id: 'coupon1',
        code: 'SAVE10',
        status: 'ACTIVE',
        validFrom: new Date(now.getTime() - 86400000),
        validUntil: new Date(now.getTime() + 86400000),
        usageLimit: null,
        usageCount: 0,
        minOrderAmount: 50.0,
      }

      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon)

      const result = await couponService.validateCoupon({
        couponCode: 'SAVE10',
        orderSubtotal: 30.0,
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Minimum order amount')
    })
  })

  describe('calculateDiscount', () => {
    it('should calculate percentage discount', () => {
      const coupon = {
        type: 'PERCENTAGE',
        discountValue: 10, // 10%
      }

      const discount = couponService.calculateDiscount(coupon, 100.0)
      expect(discount).toBe(10.0) // 10% of 100
    })

    it('should respect max discount amount for percentage', () => {
      const coupon = {
        type: 'PERCENTAGE',
        discountValue: 20, // 20%
        maxDiscountAmount: 15.0,
      }

      const discount = couponService.calculateDiscount(coupon, 100.0)
      expect(discount).toBe(15.0) // Capped at maxDiscountAmount
    })

    it('should calculate fixed discount', () => {
      const coupon = {
        type: 'FIXED',
        discountValue: 10.0,
      }

      const discount = couponService.calculateDiscount(coupon, 50.0)
      expect(discount).toBe(10.0)
    })

    it('should not exceed subtotal for fixed discount', () => {
      const coupon = {
        type: 'FIXED',
        discountValue: 100.0,
      }

      const discount = couponService.calculateDiscount(coupon, 50.0)
      expect(discount).toBe(50.0) // Capped at subtotal
    })

    it('should calculate free shipping discount', () => {
      const coupon = {
        type: 'FREE_SHIPPING',
      }

      const discount = couponService.calculateDiscount(coupon, 50.0, 5.99)
      expect(discount).toBe(5.99) // Delivery fee amount
    })

    it('should return 0 for BUY_X_GET_Y (not yet implemented)', () => {
      const coupon = {
        type: 'BUY_X_GET_Y',
      }

      const discount = couponService.calculateDiscount(coupon, 50.0)
      expect(discount).toBe(0)
    })
  })

  describe('applyCoupon', () => {
    it('should apply coupon and calculate discount', async () => {
      const now = new Date()
      const mockCoupon = {
        id: 'coupon1',
        code: 'SAVE10',
        type: 'PERCENTAGE',
        discountValue: 10,
        status: 'ACTIVE',
        validFrom: new Date(now.getTime() - 86400000),
        validUntil: new Date(now.getTime() + 86400000),
        usageLimit: null,
        usageCount: 0,
        minOrderAmount: null,
      }

      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon)

      const result = await couponService.applyCoupon({
        couponCode: 'SAVE10',
        orderSubtotal: 100.0,
        orderItems: [],
      })

      expect(result.success).toBe(true)
      expect(result.discount).toBe(10.0) // 10% of 100
      expect(result.coupon).toEqual(mockCoupon)
    })

    it('should return error when validation fails', async () => {
      const validateSpy = jest
        .spyOn(couponService, 'validateCoupon')
        .mockResolvedValue({
          valid: false,
          error: 'Coupon not found',
        })

      const result = await couponService.applyCoupon({
        couponCode: 'SAVE10',
        orderSubtotal: 100.0,
        orderItems: [],
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Coupon not found')
      validateSpy.mockRestore()
    })
  })

  describe('recordUsage', () => {
    it('should record coupon usage and update count', async () => {
      const mockCoupon = {
        id: 'coupon1',
        usageLimit: null,
        usageCount: 5,
      }

      ;(prisma.couponUsage.create as jest.Mock).mockResolvedValue({})
      ;(prisma.coupon.update as jest.Mock).mockResolvedValue(mockCoupon)
      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon)

      await couponService.recordUsage('coupon1', 'order1', 10.0, 'user1')

      expect(prisma.couponUsage.create).toHaveBeenCalled()
      expect(prisma.coupon.update).toHaveBeenCalledWith({
        where: { id: 'coupon1' },
        data: { usageCount: { increment: 1 } },
      })
    })

    it('should deactivate coupon when usage limit reached', async () => {
      const mockCoupon = {
        id: 'coupon1',
        usageLimit: 10,
        usageCount: 9,
      }

      ;(prisma.couponUsage.create as jest.Mock).mockResolvedValue({})
      ;(prisma.coupon.update as jest.Mock)
        .mockResolvedValueOnce({ ...mockCoupon, usageCount: 10 })
        .mockResolvedValueOnce({ ...mockCoupon, status: 'INACTIVE' })
      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue({
        ...mockCoupon,
        usageCount: 10,
      })

      await couponService.recordUsage('coupon1', 'order1', 10.0)

      // Should update status to INACTIVE
      expect(prisma.coupon.update).toHaveBeenCalledTimes(2)
      expect(prisma.coupon.update).toHaveBeenLastCalledWith({
        where: { id: 'coupon1' },
        data: { status: 'INACTIVE' },
      })
    })

    it('should not deactivate coupon when usage limit not reached', async () => {
      const mockCoupon = {
        id: 'coupon1',
        usageLimit: 10,
        usageCount: 5,
      }

      ;(prisma.couponUsage.create as jest.Mock).mockResolvedValue({})
      ;(prisma.coupon.update as jest.Mock).mockResolvedValueOnce({
        ...mockCoupon,
        usageCount: 6,
      })
      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue({
        ...mockCoupon,
        usageCount: 6,
      })

      await couponService.recordUsage('coupon1', 'order1', 10.0)

      // Should only update usage count, not status
      expect(prisma.coupon.update).toHaveBeenCalledTimes(1)
      expect(prisma.coupon.update).toHaveBeenCalledWith({
        where: { id: 'coupon1' },
        data: { usageCount: { increment: 1 } },
      })
    })

    it('should handle recordUsage without userId', async () => {
      const mockCoupon = {
        id: 'coupon1',
        usageLimit: null,
        usageCount: 5,
      }

      ;(prisma.couponUsage.create as jest.Mock).mockResolvedValue({})
      ;(prisma.coupon.update as jest.Mock).mockResolvedValue(mockCoupon)
      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon)

      await couponService.recordUsage('coupon1', 'order1', 10.0)

      expect(prisma.couponUsage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: null,
          }),
        })
      )
    })

    it('should not deactivate when coupon not found after update', async () => {
      const mockCoupon = {
        id: 'coupon1',
        usageLimit: 10,
        usageCount: 5,
      }

      ;(prisma.couponUsage.create as jest.Mock).mockResolvedValue({})
      ;(prisma.coupon.update as jest.Mock).mockResolvedValueOnce({
        ...mockCoupon,
        usageCount: 6,
      })
      ;(prisma.coupon.findUnique as jest.Mock).mockResolvedValue(null)

      await couponService.recordUsage('coupon1', 'order1', 10.0)

      // Should only update usage count, not status (since coupon not found)
      expect(prisma.coupon.update).toHaveBeenCalledTimes(1)
    })

    it('should handle percentage discount without maxDiscountAmount', () => {
      const coupon = {
        type: 'PERCENTAGE',
        discountValue: 15,
      }

      const discount = couponService.calculateDiscount(coupon, 100.0)
      expect(discount).toBe(15.0) // 15% of 100, no cap
    })

    it('should handle percentage discount with null discountValue', () => {
      const coupon = {
        type: 'PERCENTAGE',
        discountValue: null,
      }

      const discount = couponService.calculateDiscount(coupon, 100.0)
      expect(discount).toBe(0)
    })

    it('should handle fixed discount with null discountValue', () => {
      const coupon = {
        type: 'FIXED',
        discountValue: null,
      }

      const discount = couponService.calculateDiscount(coupon, 50.0)
      expect(discount).toBe(0)
    })
  })
})

