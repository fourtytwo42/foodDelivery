import { loyaltyService } from '@/services/loyalty-service'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    loyaltyAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    loyaltyTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    restaurantSettings: {
      findUnique: jest.fn(),
    },
  },
}))

describe('loyaltyService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getOrCreateAccount', () => {
    it('should return existing account', async () => {
      const mockAccount = {
        id: 'acc1',
        userId: 'user1',
        points: 100,
        lifetimePoints: 200,
        tier: 'SILVER',
        transactions: [],
      }

      ;(prisma.loyaltyAccount.findUnique as jest.Mock).mockResolvedValue(mockAccount)

      const result = await loyaltyService.getOrCreateAccount('user1')

      expect(result).toEqual(mockAccount)
      expect(prisma.loyaltyAccount.create).not.toHaveBeenCalled()
    })

    it('should create account if not exists', async () => {
      const mockAccount = {
        id: 'acc1',
        userId: 'user1',
        points: 0,
        lifetimePoints: 0,
        tier: 'BRONZE',
        transactions: [],
      }

      ;(prisma.loyaltyAccount.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.loyaltyAccount.create as jest.Mock).mockResolvedValue(mockAccount)

      const result = await loyaltyService.getOrCreateAccount('user1')

      expect(prisma.loyaltyAccount.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          points: 0,
          lifetimePoints: 0,
          tier: 'BRONZE',
        },
        include: expect.any(Object),
      })
      expect(result).toEqual(mockAccount)
    })
  })

  describe('calculatePointsToEarn', () => {
    it('should calculate points based on order total', async () => {
      const mockSettings = {
        enableLoyaltyPoints: true,
        loyaltyPointsPerDollar: 0.5,
      }

      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings)

      const points = await loyaltyService.calculatePointsToEarn(100.0)
      expect(points).toBe(50) // 100 * 0.5
    })

    it('should return 0 if loyalty points disabled', async () => {
      const mockSettings = {
        enableLoyaltyPoints: false,
      }

      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings)

      const points = await loyaltyService.calculatePointsToEarn(100.0)
      expect(points).toBe(0)
    })

    it('should use default points per dollar if not set', async () => {
      const mockSettings = {
        enableLoyaltyPoints: true,
        loyaltyPointsPerDollar: null,
      }

      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings)

      const points = await loyaltyService.calculatePointsToEarn(100.0)
      expect(points).toBe(50) // Default 0.5
    })
  })

  describe('calculateTier', () => {
    it('should calculate correct tier based on lifetime points', () => {
      expect(loyaltyService.calculateTier(100)).toBe('BRONZE')
      expect(loyaltyService.calculateTier(1000)).toBe('SILVER')
      expect(loyaltyService.calculateTier(5000)).toBe('GOLD')
      expect(loyaltyService.calculateTier(10000)).toBe('PLATINUM')
      expect(loyaltyService.calculateTier(15000)).toBe('PLATINUM')
    })
  })

  describe('earnPoints', () => {
    it('should earn points from order', async () => {
      const mockAccount = {
        id: 'acc1',
        userId: 'user1',
        points: 100,
        lifetimePoints: 200,
        tier: 'BRONZE',
      }

      const mockSettings = {
        enableLoyaltyPoints: true,
        loyaltyPointsPerDollar: 0.5,
      }

      ;(prisma.loyaltyAccount.findUnique as jest.Mock).mockResolvedValue(mockAccount)
      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      ;(prisma.loyaltyAccount.update as jest.Mock).mockResolvedValue({
        ...mockAccount,
        points: 150,
        lifetimePoints: 250,
        tier: 'BRONZE', // 250 < 1000, so still BRONZE
      })
      ;(prisma.loyaltyTransaction.create as jest.Mock).mockResolvedValue({})

      const result = await loyaltyService.earnPoints({
        userId: 'user1',
        orderId: 'order1',
        orderTotal: 100.0,
      })

      expect(result.success).toBe(true)
      expect(result.pointsEarned).toBe(50)
      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc1' },
        data: {
          points: { increment: 50 },
          lifetimePoints: 250,
          tier: 'BRONZE', // 250 < 1000, so still BRONZE
        },
      })
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalled()
    })

    it('should return error if no points to earn', async () => {
      const mockAccount = {
        id: 'acc1',
        userId: 'user1',
        points: 100,
        lifetimePoints: 200,
        tier: 'BRONZE',
      }

      const mockSettings = {
        enableLoyaltyPoints: false,
      }

      ;(prisma.loyaltyAccount.findUnique as jest.Mock).mockResolvedValue(mockAccount)
      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings)

      const result = await loyaltyService.earnPoints({
        userId: 'user1',
        orderId: 'order1',
        orderTotal: 100.0,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('No points to earn')
    })
  })

  describe('redeemPoints', () => {
    it('should redeem points and calculate discount', async () => {
      const mockAccount = {
        id: 'acc1',
        userId: 'user1',
        points: 250,
        lifetimePoints: 500,
        tier: 'SILVER',
      }

      const mockSettings = {
        loyaltyPointsForFree: 100,
      }

      ;(prisma.loyaltyAccount.findUnique as jest.Mock).mockResolvedValue(mockAccount)
      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      ;(prisma.loyaltyAccount.update as jest.Mock).mockResolvedValue({
        ...mockAccount,
        points: 150,
      })
      ;(prisma.loyaltyTransaction.create as jest.Mock).mockResolvedValue({})

      const result = await loyaltyService.redeemPoints({
        userId: 'user1',
        points: 100,
        orderId: 'order1',
      })

      expect(result.success).toBe(true)
      expect(result.discountAmount).toBe(1.0) // 100 points / 100 = $1
      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc1' },
        data: { points: { decrement: 100 } },
      })
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalled()
    })

    it('should reject insufficient points', async () => {
      const mockAccount = {
        id: 'acc1',
        userId: 'user1',
        points: 50,
        lifetimePoints: 100,
        tier: 'BRONZE',
      }

      ;(prisma.loyaltyAccount.findUnique as jest.Mock).mockResolvedValue(mockAccount)

      const result = await loyaltyService.redeemPoints({
        userId: 'user1',
        points: 100,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient points')
    })

    it('should use default pointsForFree when not set', async () => {
      const mockAccount = {
        id: 'acc1',
        userId: 'user1',
        points: 200,
      }

      const mockSettings = {
        loyaltyPointsForFree: null,
      }

      ;(prisma.loyaltyAccount.findUnique as jest.Mock).mockResolvedValue(mockAccount)
      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      ;(prisma.loyaltyAccount.update as jest.Mock).mockResolvedValue({
        ...mockAccount,
        points: 100,
      })
      ;(prisma.loyaltyTransaction.create as jest.Mock).mockResolvedValue({})

      const result = await loyaltyService.redeemPoints({
        userId: 'user1',
        points: 100,
      })

      expect(result.success).toBe(true)
      expect(result.discountAmount).toBe(1.0) // Default 100 points = $1
    })
  })

  describe('getPointsValue', () => {
    it('should calculate points value in dollars', async () => {
      const mockSettings = {
        loyaltyPointsForFree: 100,
      }

      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings)

      const value = await loyaltyService.getPointsValue(250)
      expect(value).toBe(2.5) // 250 / 100 = $2.50
    })

    it('should use default if not set', async () => {
      const mockSettings = {
        loyaltyPointsForFree: null,
      }

      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings)

      const value = await loyaltyService.getPointsValue(100)
      expect(value).toBe(1.0) // Default 100 points = $1
    })

    it('should handle null settings', async () => {
      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(null)

      const value = await loyaltyService.getPointsValue(100)
      expect(value).toBe(1.0) // Default 100 points = $1
    })

    it('should handle null settings', async () => {
      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(null)

      const value = await loyaltyService.getPointsValue(100)
      expect(value).toBe(1.0) // Default 100 points = $1
    })
  })

  describe('adjustPoints', () => {
    it('should adjust points (admin function)', async () => {
      const mockAccount = {
        id: 'acc1',
        userId: 'user1',
        points: 100,
      }

      ;(prisma.loyaltyAccount.findUnique as jest.Mock).mockResolvedValue(mockAccount)
      ;(prisma.loyaltyAccount.update as jest.Mock).mockResolvedValue({
        ...mockAccount,
        points: 150,
      })
      ;(prisma.loyaltyTransaction.create as jest.Mock).mockResolvedValue({})

      const result = await loyaltyService.adjustPoints('user1', 50, 'ADJUSTED', 'Bonus points')

      expect(result.points).toBe(150)
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          points: 50,
          type: 'ADJUSTED',
        }),
      })
    })

    it('should expire points (negative adjustment)', async () => {
      const mockAccount = {
        id: 'acc1',
        userId: 'user1',
        points: 100,
      }

      ;(prisma.loyaltyAccount.findUnique as jest.Mock).mockResolvedValue(mockAccount)
      ;(prisma.loyaltyAccount.update as jest.Mock).mockResolvedValue({
        ...mockAccount,
        points: 50,
      })
      ;(prisma.loyaltyTransaction.create as jest.Mock).mockResolvedValue({})

      const result = await loyaltyService.adjustPoints('user1', 50, 'EXPIRED', 'Points expired')

      expect(result.points).toBe(50)
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          points: -50,
          type: 'EXPIRED',
        }),
      })
    })

    it('should use default description when not provided', async () => {
      const mockAccount = {
        id: 'acc1',
        userId: 'user1',
        points: 100,
      }

      ;(prisma.loyaltyAccount.findUnique as jest.Mock).mockResolvedValue(mockAccount)
      ;(prisma.loyaltyAccount.update as jest.Mock).mockResolvedValue({
        ...mockAccount,
        points: 150,
      })
      ;(prisma.loyaltyTransaction.create as jest.Mock).mockResolvedValue({})

      await loyaltyService.adjustPoints('user1', 50, 'ADJUSTED')

      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'ADJUSTED 50 points',
        }),
      })
    })
  })
})

