import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface CreateGiftCardInput {
  code?: string // Optional - will generate if not provided
  pin?: string
  originalBalance: number
  currency?: string
  purchasedBy?: string
  expiresAt?: Date
}

export interface ValidateGiftCardInput {
  code: string
  pin?: string
}

export interface UseGiftCardInput {
  giftCardId: string
  orderId?: string
  amount: number
  description?: string
}

export const giftCardService = {
  /**
   * Generate a unique gift card code
   */
  generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars
    let code = ''
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) {
        code += '-'
      }
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  },

  /**
   * Generate a 4-digit PIN
   */
  generatePIN(): string {
    return Math.floor(1000 + Math.random() * 9000).toString()
  },

  /**
   * Create a gift card
   */
  async createGiftCard(data: CreateGiftCardInput) {
    let code = data.code
    if (!code) {
      // Ensure unique code
      let attempts = 0
      do {
        code = this.generateCode()
        const existing = await prisma.giftCard.findUnique({
          where: { code },
        })
        if (!existing) break
        attempts++
      } while (attempts < 10)

      if (attempts >= 10) {
        throw new Error('Failed to generate unique gift card code')
      }
    }

    const pin = data.pin || this.generatePIN()

    const giftCard = await prisma.giftCard.create({
      data: {
        code,
        pin: pin ? await this.hashPIN(pin) : null,
        originalBalance: new Decimal(data.originalBalance),
        currentBalance: new Decimal(data.originalBalance),
        currency: data.currency || 'USD',
        purchasedBy: data.purchasedBy || null,
        purchasedAt: data.purchasedBy ? new Date() : null,
        expiresAt: data.expiresAt || null,
      },
      include: {
        purchaser: true,
      },
    })

    return { ...giftCard, pin: data.pin || pin } // Return PIN only on creation
  },

  /**
   * Hash PIN (simple hash for demo - use bcrypt in production)
   */
  async hashPIN(pin: string): Promise<string> {
    // For demo purposes, we'll store PIN as-is
    // In production, use bcrypt: return await hashPassword(pin)
    return pin
  },

  /**
   * Verify PIN
   */
  async verifyPIN(storedPIN: string | null, providedPIN: string): Promise<boolean> {
    if (!storedPIN) return true // No PIN required
    return storedPIN === providedPIN
  },

  /**
   * Get gift card by code
   */
  async getGiftCardByCode(code: string) {
    return prisma.giftCard.findUnique({
      where: { code },
      include: {
        purchaser: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    })
  },

  /**
   * Get gift card by ID
   */
  async getGiftCardById(id: string) {
    return prisma.giftCard.findUnique({
      where: { id },
      include: {
        purchaser: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })
  },

  /**
   * Validate gift card (check code, PIN, balance, expiry)
   */
  async validateGiftCard(data: ValidateGiftCardInput): Promise<{
    valid: boolean
    giftCard?: any
    error?: string
  }> {
    const giftCard = await this.getGiftCardByCode(data.code)

    if (!giftCard) {
      return { valid: false, error: 'Gift card not found' }
    }

    if (giftCard.status !== 'ACTIVE') {
      return { valid: false, error: 'Gift card is not active' }
    }

    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      // Update status to expired
      await prisma.giftCard.update({
        where: { id: giftCard.id },
        data: { status: 'EXPIRED' },
      })
      return { valid: false, error: 'Gift card has expired' }
    }

    if (Number(giftCard.currentBalance) <= 0) {
      return { valid: false, error: 'Gift card has no balance' }
    }

    // Verify PIN if required
    if (giftCard.pin) {
      if (!data.pin) {
        return { valid: false, error: 'PIN required' }
      }
      const pinValid = await this.verifyPIN(giftCard.pin, data.pin)
      if (!pinValid) {
        return { valid: false, error: 'Invalid PIN' }
      }
    }

    return { valid: true, giftCard }
  },

  /**
   * Use gift card (deduct balance)
   */
  async useGiftCard(data: UseGiftCardInput): Promise<{
    success: boolean
    giftCard?: any
    error?: string
  }> {
    const giftCard = await prisma.giftCard.findUnique({
      where: { id: data.giftCardId },
    })

    if (!giftCard) {
      return { success: false, error: 'Gift card not found' }
    }

    if (giftCard.status !== 'ACTIVE') {
      return { success: false, error: 'Gift card is not active' }
    }

    const currentBalance = Number(giftCard.currentBalance)
    if (currentBalance < data.amount) {
      return { success: false, error: 'Insufficient balance' }
    }

    const newBalance = currentBalance - data.amount
    const status = newBalance === 0 ? 'USED' : giftCard.status

    // Update gift card
    const updatedGiftCard = await prisma.giftCard.update({
      where: { id: data.giftCardId },
      data: {
        currentBalance: new Decimal(newBalance),
        status,
        lastUsedAt: new Date(),
      },
    })

    // Create transaction record
    await prisma.giftCardTransaction.create({
      data: {
        giftCardId: data.giftCardId,
        orderId: data.orderId || null,
        amount: new Decimal(-data.amount), // Negative for usage
        type: 'USAGE',
        description: data.description || null,
      },
    })

    return { success: true, giftCard: updatedGiftCard }
  },

  /**
   * Refund gift card (add balance back)
   */
  async refundGiftCard(giftCardId: string, amount: number, orderId?: string, description?: string) {
    const giftCard = await prisma.giftCard.findUnique({
      where: { id: giftCardId },
    })

    if (!giftCard) {
      throw new Error('Gift card not found')
    }

    const currentBalance = Number(giftCard.currentBalance)
    const newBalance = currentBalance + amount
    const originalBalance = Number(giftCard.originalBalance)
    const status = newBalance >= originalBalance ? 'ACTIVE' : giftCard.status

    // Update gift card
    const updatedGiftCard = await prisma.giftCard.update({
      where: { id: giftCardId },
      data: {
        currentBalance: new Decimal(newBalance),
        status,
      },
    })

    // Create transaction record
    await prisma.giftCardTransaction.create({
      data: {
        giftCardId,
        orderId: orderId || null,
        amount: new Decimal(amount), // Positive for refund
        type: 'REFUND',
        description: description || null,
      },
    })

    return updatedGiftCard
  },

  /**
   * Check gift card balance (public, no PIN required)
   */
  async checkBalance(code: string) {
    const giftCard = await prisma.giftCard.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        currentBalance: true,
        currency: true,
        status: true,
        expiresAt: true,
      },
    })

    if (!giftCard) {
      return null
    }

    return {
      code: giftCard.code,
      balance: Number(giftCard.currentBalance),
      currency: giftCard.currency,
      status: giftCard.status,
      expiresAt: giftCard.expiresAt,
    }
  },
}

