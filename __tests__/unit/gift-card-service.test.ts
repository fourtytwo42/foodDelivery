import { giftCardService } from '@/services/gift-card-service'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    giftCard: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    giftCardTransaction: {
      create: jest.fn(),
    },
  },
}))

describe('giftCardService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateCode', () => {
    it('should generate a formatted gift card code', () => {
      const code = giftCardService.generateCode()
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    })

    it('should generate unique codes', () => {
      const code1 = giftCardService.generateCode()
      const code2 = giftCardService.generateCode()
      // Very unlikely to be the same
      expect(code1).not.toBe(code2)
    })
  })

  describe('generatePIN', () => {
    it('should generate a 4-digit PIN', () => {
      const pin = giftCardService.generatePIN()
      expect(pin).toMatch(/^\d{4}$/)
      expect(parseInt(pin, 10)).toBeGreaterThanOrEqual(1000)
      expect(parseInt(pin, 10)).toBeLessThanOrEqual(9999)
    })
  })

  describe('createGiftCard', () => {
    it('should create a gift card with generated code', async () => {
      const mockGiftCard = {
        id: 'gc1',
        code: 'TEST-CODE-1234',
        originalBalance: 50.0,
        currentBalance: 50.0,
        status: 'ACTIVE',
        pin: '1234',
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.giftCard.create as jest.Mock).mockResolvedValue(mockGiftCard)

      const result = await giftCardService.createGiftCard({
        originalBalance: 50.0,
      })

      expect(prisma.giftCard.create).toHaveBeenCalled()
      expect(result.code).toBeDefined()
    })

    it('should create a gift card with provided code', async () => {
      const mockGiftCard = {
        id: 'gc1',
        code: 'CUSTOM-CODE',
        originalBalance: 100.0,
        currentBalance: 100.0,
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.giftCard.create as jest.Mock).mockResolvedValue(mockGiftCard)

      const result = await giftCardService.createGiftCard({
        code: 'CUSTOM-CODE',
        originalBalance: 100.0,
      })

      expect(prisma.giftCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'CUSTOM-CODE',
          }),
        })
      )
      expect(result.code).toBe('CUSTOM-CODE')
    })
  })

  describe('getGiftCardByCode', () => {
    it('should fetch gift card by code', async () => {
      const mockGiftCard = { id: 'gc1', code: 'TEST-CODE' }
      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)

      const result = await giftCardService.getGiftCardByCode('TEST-CODE')

      expect(prisma.giftCard.findUnique).toHaveBeenCalledWith({
        where: { code: 'TEST-CODE' },
        include: expect.any(Object),
      })
      expect(result).toEqual(mockGiftCard)
    })
  })

  describe('validateGiftCard', () => {
    it('should validate active gift card', async () => {
      const mockGiftCard = {
        id: 'gc1',
        code: 'TEST-CODE',
        status: 'ACTIVE',
        currentBalance: 50.0,
        expiresAt: null,
        pin: null,
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)

      const result = await giftCardService.validateGiftCard({ code: 'TEST-CODE' })

      expect(result.valid).toBe(true)
      expect(result.giftCard).toEqual(mockGiftCard)
    })

    it('should reject inactive gift card', async () => {
      const mockGiftCard = {
        id: 'gc1',
        code: 'TEST-CODE',
        status: 'USED',
        currentBalance: 0,
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)

      const result = await giftCardService.validateGiftCard({ code: 'TEST-CODE' })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('not active')
    })

    it('should reject expired gift card', async () => {
      const expiredDate = new Date(Date.now() - 1000)
      const mockGiftCard = {
        id: 'gc1',
        code: 'TEST-CODE',
        status: 'ACTIVE',
        currentBalance: 50.0,
        expiresAt: expiredDate,
        pin: null,
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)
      ;(prisma.giftCard.update as jest.Mock).mockResolvedValue({ ...mockGiftCard, status: 'EXPIRED' })

      const result = await giftCardService.validateGiftCard({ code: 'TEST-CODE' })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('should reject gift card with no balance', async () => {
      const mockGiftCard = {
        id: 'gc1',
        code: 'TEST-CODE',
        status: 'ACTIVE',
        currentBalance: 0,
        expiresAt: null,
        pin: null,
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)

      const result = await giftCardService.validateGiftCard({ code: 'TEST-CODE' })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('no balance')
    })

    it('should validate gift card without expiry date', async () => {
      const mockGiftCard = {
        id: 'gc1',
        code: 'TEST-CODE',
        status: 'ACTIVE',
        currentBalance: 50.0,
        expiresAt: null,
        pin: null,
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)

      const result = await giftCardService.validateGiftCard({ code: 'TEST-CODE' })

      expect(result.valid).toBe(true)
      expect(result.giftCard).toEqual(mockGiftCard)
    })

    it('should reject gift card with status other than ACTIVE', async () => {
      const mockGiftCard = {
        id: 'gc1',
        code: 'TEST-CODE',
        status: 'USED',
        currentBalance: 50.0,
        expiresAt: null,
        pin: null,
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)

      const result = await giftCardService.validateGiftCard({ code: 'TEST-CODE' })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('not active')
    })

    it('should validate PIN when required', async () => {
      const mockGiftCard = {
        id: 'gc1',
        code: 'TEST-CODE',
        status: 'ACTIVE',
        currentBalance: 50.0,
        expiresAt: null,
        pin: '1234',
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)

      const result1 = await giftCardService.validateGiftCard({ code: 'TEST-CODE' })
      expect(result1.valid).toBe(false)
      expect(result1.error).toContain('PIN required')

      const result2 = await giftCardService.validateGiftCard({ code: 'TEST-CODE', pin: '1234' })
      expect(result2.valid).toBe(true)

      const result3 = await giftCardService.validateGiftCard({ code: 'TEST-CODE', pin: '9999' })
      expect(result3.valid).toBe(false)
      expect(result3.error).toContain('Invalid PIN')
    })
  })

  describe('useGiftCard', () => {
    it('should use gift card and deduct balance', async () => {
      const mockGiftCard = {
        id: 'gc1',
        status: 'ACTIVE',
        currentBalance: 50.0,
      }

      const updatedGiftCard = {
        ...mockGiftCard,
        currentBalance: 30.0,
        status: 'ACTIVE',
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)
      ;(prisma.giftCard.update as jest.Mock).mockResolvedValue(updatedGiftCard)
      ;(prisma.giftCardTransaction.create as jest.Mock).mockResolvedValue({})

      const result = await giftCardService.useGiftCard({
        giftCardId: 'gc1',
        amount: 20.0,
        orderId: 'order1',
      })

      expect(result.success).toBe(true)
      expect(prisma.giftCardTransaction.create).toHaveBeenCalled()
    })

    it('should mark gift card as USED when balance reaches zero', async () => {
      const mockGiftCard = {
        id: 'gc1',
        status: 'ACTIVE',
        currentBalance: 20.0,
      }

      const updatedGiftCard = {
        ...mockGiftCard,
        currentBalance: 0,
        status: 'USED',
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)
      ;(prisma.giftCard.update as jest.Mock).mockResolvedValue(updatedGiftCard)
      ;(prisma.giftCardTransaction.create as jest.Mock).mockResolvedValue({})

      const result = await giftCardService.useGiftCard({
        giftCardId: 'gc1',
        amount: 20.0,
      })

      expect(result.success).toBe(true)
      expect(prisma.giftCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'USED',
          }),
        })
      )
    })

    it('should reject insufficient balance', async () => {
      const mockGiftCard = {
        id: 'gc1',
        status: 'ACTIVE',
        currentBalance: 10.0,
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)

      const result = await giftCardService.useGiftCard({
        giftCardId: 'gc1',
        amount: 50.0,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient balance')
    })

    it('should reject when gift card is not active', async () => {
      const mockGiftCard = {
        id: 'gc1',
        status: 'USED',
        currentBalance: 50.0,
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)

      const result = await giftCardService.useGiftCard({
        giftCardId: 'gc1',
        amount: 20.0,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not active')
    })

    it('should handle gift card not found', async () => {
      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await giftCardService.useGiftCard({
        giftCardId: 'invalid',
        amount: 20.0,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('refundGiftCard', () => {
    it('should refund gift card and add balance', async () => {
      const mockGiftCard = {
        id: 'gc1',
        originalBalance: 50.0,
        currentBalance: 30.0,
        status: 'ACTIVE',
      }

      const updatedGiftCard = {
        ...mockGiftCard,
        currentBalance: 50.0,
        status: 'ACTIVE',
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)
      ;(prisma.giftCard.update as jest.Mock).mockResolvedValue(updatedGiftCard)
      ;(prisma.giftCardTransaction.create as jest.Mock).mockResolvedValue({})

      const result = await giftCardService.refundGiftCard('gc1', 20.0, 'order1')

      expect(result.currentBalance).toBe(50.0)
      expect(prisma.giftCardTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'REFUND',
            amount: expect.any(Object),
          }),
        })
      )
    })

    it('should reactivate gift card when balance restored to original', async () => {
      const mockGiftCard = {
        id: 'gc1',
        originalBalance: 50.0,
        currentBalance: 20.0,
        status: 'USED',
      }

      const updatedGiftCard = {
        ...mockGiftCard,
        currentBalance: 50.0,
        status: 'ACTIVE',
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)
      ;(prisma.giftCard.update as jest.Mock).mockResolvedValue(updatedGiftCard)
      ;(prisma.giftCardTransaction.create as jest.Mock).mockResolvedValue({})

      const result = await giftCardService.refundGiftCard('gc1', 30.0)

      expect(prisma.giftCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      )
    })

    it('should keep original status when balance not fully restored', async () => {
      const mockGiftCard = {
        id: 'gc1',
        originalBalance: 50.0,
        currentBalance: 20.0,
        status: 'USED',
      }

      const updatedGiftCard = {
        ...mockGiftCard,
        currentBalance: 35.0,
        status: 'USED',
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)
      ;(prisma.giftCard.update as jest.Mock).mockResolvedValue(updatedGiftCard)
      ;(prisma.giftCardTransaction.create as jest.Mock).mockResolvedValue({})

      const result = await giftCardService.refundGiftCard('gc1', 15.0)

      expect(prisma.giftCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'USED',
          }),
        })
      )
    })

    it('should throw error when gift card not found', async () => {
      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(giftCardService.refundGiftCard('invalid', 10.0)).rejects.toThrow(
        'Gift card not found'
      )
    })
  })

  describe('checkBalance', () => {
    it('should return balance information', async () => {
      const mockGiftCard = {
        id: 'gc1',
        code: 'TEST-CODE',
        currentBalance: 50.0,
        currency: 'USD',
        status: 'ACTIVE',
        expiresAt: null,
      }

      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(mockGiftCard)

      const result = await giftCardService.checkBalance('TEST-CODE')

      expect(result).toEqual({
        code: 'TEST-CODE',
        balance: 50.0,
        currency: 'USD',
        status: 'ACTIVE',
        expiresAt: null,
      })
    })

    it('should return null for non-existent gift card', async () => {
      ;(prisma.giftCard.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await giftCardService.checkBalance('INVALID')

      expect(result).toBeNull()
    })
  })
})

