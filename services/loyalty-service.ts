import { prisma } from '@/lib/prisma'

export interface EarnPointsInput {
  userId: string
  orderId: string
  orderTotal: number
  description?: string
}

export interface RedeemPointsInput {
  userId: string
  points: number
  orderId?: string
  description?: string
}

export interface GetLoyaltyAccountInput {
  userId: string
}

export const loyaltyService = {
  /**
   * Get or create loyalty account for user
   */
  async getOrCreateAccount(userId: string) {
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    })

    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: {
          userId,
          points: 0,
          lifetimePoints: 0,
          tier: 'BRONZE',
        },
        include: {
          transactions: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
      })
    }

    return account
  },

  /**
   * Get loyalty account by user ID
   */
  async getAccount(userId: string) {
    return prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        user: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })
  },

  /**
   * Calculate points to earn based on order total
   */
  async calculatePointsToEarn(orderTotal: number): Promise<number> {
    // Get settings
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: 'default' },
    })

    if (!settings?.enableLoyaltyPoints) {
      return 0
    }

    const pointsPerDollar = settings.loyaltyPointsPerDollar
      ? Number(settings.loyaltyPointsPerDollar)
      : 0.5

    return Math.floor(orderTotal * pointsPerDollar)
  },

  /**
   * Calculate tier based on lifetime points
   */
  calculateTier(lifetimePoints: number): string {
    if (lifetimePoints >= 10000) return 'PLATINUM'
    if (lifetimePoints >= 5000) return 'GOLD'
    if (lifetimePoints >= 1000) return 'SILVER'
    return 'BRONZE'
  },

  /**
   * Earn points from order
   */
  async earnPoints(data: EarnPointsInput): Promise<{
    success: boolean
    account?: any
    pointsEarned?: number
    error?: string
  }> {
    // Get or create account
    const account = await this.getOrCreateAccount(data.userId)

    // Calculate points to earn
    const pointsToEarn = await this.calculatePointsToEarn(data.orderTotal)

    if (pointsToEarn <= 0) {
      return { success: false, error: 'No points to earn' }
    }

    // Update account
    const newLifetimePoints = account.lifetimePoints + pointsToEarn
    const newTier = this.calculateTier(newLifetimePoints)

    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        points: { increment: pointsToEarn },
        lifetimePoints: newLifetimePoints,
        tier: newTier,
      },
    })

    // Create transaction record
    await prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        orderId: data.orderId,
        points: pointsToEarn,
        type: 'EARNED',
        description: data.description || `Earned ${pointsToEarn} points from order`,
      },
    })

    return {
      success: true,
      account: updatedAccount,
      pointsEarned: pointsToEarn,
    }
  },

  /**
   * Redeem points
   */
  async redeemPoints(data: RedeemPointsInput): Promise<{
    success: boolean
    account?: any
    discountAmount?: number
    error?: string
  }> {
    const account = await this.getOrCreateAccount(data.userId)

    if (account.points < data.points) {
      return { success: false, error: 'Insufficient points' }
    }

    // Get settings for point value
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: 'default' },
    })

    const pointsForFree = settings?.loyaltyPointsForFree ? Number(settings.loyaltyPointsForFree) : 100
    const discountAmount = (data.points / pointsForFree) * 1.0 // $1 per pointsForFree points

    // Update account
    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        points: { decrement: data.points },
      },
    })

    // Create transaction record
    await prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        orderId: data.orderId || null,
        points: -data.points, // Negative for redemption
        type: 'REDEEMED',
        description: data.description || `Redeemed ${data.points} points`,
      },
    })

    return {
      success: true,
      account: updatedAccount,
      discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimals
    }
  },

  /**
   * Get points value in dollars
   */
  async getPointsValue(points: number): Promise<number> {
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: 'default' },
    })

    const pointsForFree = settings?.loyaltyPointsForFree ? Number(settings.loyaltyPointsForFree) : 100
    return (points / pointsForFree) * 1.0 // $1 per pointsForFree points
  },

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 50) {
    const account = await this.getOrCreateAccount(userId)

    return prisma.loyaltyTransaction.findMany({
      where: { loyaltyAccountId: account.id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
  },

  /**
   * Adjust points (admin function)
   */
  async adjustPoints(
    userId: string,
    points: number,
    type: 'ADJUSTED' | 'EXPIRED',
    description?: string
  ) {
    const account = await this.getOrCreateAccount(userId)

    // For EXPIRED, points should be negative
    const adjustmentAmount = type === 'EXPIRED' ? -Math.abs(points) : points

    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        points: { increment: adjustmentAmount },
      },
    })

    // Create transaction record
    await prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        points: adjustmentAmount,
        type,
        description: description || `${type} ${Math.abs(points)} points`,
      },
    })

    return updatedAccount
  },
}

