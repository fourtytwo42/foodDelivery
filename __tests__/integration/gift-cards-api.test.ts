/**
 * @jest-environment node
 */
import { POST as createGiftCard, GET as getGiftCard } from '@/app/api/gift-cards/route'
import { GET as getGiftCardById } from '@/app/api/gift-cards/[id]/route'
import { POST as useGiftCard } from '@/app/api/gift-cards/use/route'
import { giftCardService } from '@/services/gift-card-service'
import { NextRequest } from 'next/server'

jest.mock('@/services/gift-card-service', () => ({
  giftCardService: {
    createGiftCard: jest.fn(),
    getGiftCardByCode: jest.fn(),
    getGiftCardById: jest.fn(),
    validateGiftCard: jest.fn(),
    checkBalance: jest.fn(),
    useGiftCard: jest.fn(),
  },
}))

const createMockRequest = (url: string, body?: unknown, method = 'GET') => {
  const urlObj = new URL(url)
  return {
    url,
    method,
    json: async () => body,
    nextUrl: urlObj,
    headers: new Headers(),
  } as unknown as NextRequest
}

describe('Gift Cards API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/gift-cards', () => {
    it('should create a gift card', async () => {
      const mockGiftCard = {
        id: 'gc1',
        code: 'TEST-CODE-1234',
        originalBalance: 50.0,
        currentBalance: 50.0,
        pin: '1234',
      }

      ;(giftCardService.createGiftCard as jest.Mock).mockResolvedValue(mockGiftCard)

      const request = createMockRequest(
        'http://localhost:3000/api/gift-cards',
        {
          originalBalance: 50.0,
        },
        'POST'
      )

      const response = await createGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.giftCard).toEqual(mockGiftCard)
    })

    it('should handle validation errors', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/gift-cards',
        { originalBalance: -10 }, // Invalid: negative balance
        'POST'
      )

      const response = await createGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should handle errors when creating gift card', async () => {
      ;(giftCardService.createGiftCard as jest.Mock).mockRejectedValue(
        new Error('Failed to generate unique code')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/gift-cards',
        { originalBalance: 50.0 },
        'POST'
      )

      const response = await createGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to generate unique code')
    })
  })

  describe('GET /api/gift-cards', () => {
    it('should validate gift card with code', async () => {
      const mockGiftCard = {
        id: 'gc1',
        code: 'TEST-CODE',
        status: 'ACTIVE',
        currentBalance: 50.0,
      }

      ;(giftCardService.validateGiftCard as jest.Mock).mockResolvedValue({
        valid: true,
        giftCard: mockGiftCard,
      })

      const request = createMockRequest('http://localhost:3000/api/gift-cards?code=TEST-CODE')
      const response = await getGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(true)
      expect(data.giftCard).toEqual(mockGiftCard)
    })

    it('should return error for invalid gift card', async () => {
      ;(giftCardService.validateGiftCard as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Gift card not found',
      })

      const request = createMockRequest('http://localhost:3000/api/gift-cards?code=INVALID')
      const response = await getGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.valid).toBe(false)
      expect(data.error).toBe('Gift card not found')
    })

    it('should check balance with balance parameter', async () => {
      const mockBalance = {
        code: 'TEST-CODE',
        balance: 50.0,
        currency: 'USD',
        status: 'ACTIVE',
      }

      ;(giftCardService.checkBalance as jest.Mock).mockResolvedValue(mockBalance)

      const request = createMockRequest('http://localhost:3000/api/gift-cards?balance=TEST-CODE')
      const response = await getGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.balance).toEqual(mockBalance)
    })

    it('should return 404 when checking balance for non-existent card', async () => {
      ;(giftCardService.checkBalance as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/gift-cards?balance=INVALID')
      const response = await getGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Gift card not found')
    })

    it('should return error when no code or balance parameter', async () => {
      const request = createMockRequest('http://localhost:3000/api/gift-cards')
      const response = await getGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Code or balance parameter required')
    })

    it('should handle validation errors when checking balance', async () => {
      // Mock zod error by providing invalid data
      ;(giftCardService.checkBalance as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid code format')
      })

      const request = createMockRequest(
        'http://localhost:3000/api/gift-cards?balance=INVALID-CODE'
      )
      const response = await getGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch gift card')
    })
  })

  describe('GET /api/gift-cards/[id]', () => {
    it('should return gift card by ID', async () => {
      const mockGiftCard = { id: 'gc1', code: 'TEST-CODE' }
      ;(giftCardService.getGiftCardById as jest.Mock).mockResolvedValue(mockGiftCard)

      const request = createMockRequest('http://localhost:3000/api/gift-cards/gc1')
      const response = await getGiftCardById(request, {
        params: Promise.resolve({ id: 'gc1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.giftCard).toEqual(mockGiftCard)
    })

    it('should return 404 when gift card not found', async () => {
      ;(giftCardService.getGiftCardById as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/gift-cards/gc1')
      const response = await getGiftCardById(request, {
        params: Promise.resolve({ id: 'gc1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Gift card not found')
    })

    it('should handle service errors on validation', async () => {
      ;(giftCardService.validateGiftCard as jest.Mock).mockRejectedValue(new Error('db down'))

      const request = createMockRequest('http://localhost:3000/api/gift-cards?code=TEST')
      const response = await getGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch gift card')
    })

    it('should handle service errors on balance check', async () => {
      ;(giftCardService.checkBalance as jest.Mock).mockRejectedValue(new Error('db down'))

      const request = createMockRequest('http://localhost:3000/api/gift-cards?balance=TEST')
      const response = await getGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch gift card')
    })
  })

  describe('POST /api/gift-cards/use', () => {
    it('should use gift card', async () => {
      const mockGiftCard = {
        id: 'gc1',
        currentBalance: 30.0,
        status: 'ACTIVE',
      }

      ;(giftCardService.useGiftCard as jest.Mock).mockResolvedValue({
        success: true,
        giftCard: mockGiftCard,
      })

      const request = createMockRequest(
        'http://localhost:3000/api/gift-cards/use',
        {
          giftCardId: 'gc1',
          amount: 20.0,
          orderId: 'order1',
        },
        'POST'
      )

      const response = await useGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.giftCard).toEqual(mockGiftCard)
    })

    it('should return error for failed usage', async () => {
      ;(giftCardService.useGiftCard as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Insufficient balance',
      })

      const request = createMockRequest(
        'http://localhost:3000/api/gift-cards/use',
        {
          giftCardId: 'gc1',
          amount: 100.0,
        },
        'POST'
      )

      const response = await useGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Insufficient balance')
    })

    it('should handle validation errors', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/gift-cards/use',
        {
          giftCardId: '', // Invalid: empty ID
          amount: 20.0,
        },
        'POST'
      )

      const response = await useGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should handle errors when using gift card', async () => {
      ;(giftCardService.useGiftCard as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/gift-cards/use',
        {
          giftCardId: 'gc1',
          amount: 20.0,
        },
        'POST'
      )

      const response = await useGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to use gift card')
    })
  })

  describe('GET /api/gift-cards validation errors', () => {
    it('should handle validation errors when validating', async () => {
      // When code parameter is missing (not present at all), it should return parameter required error
      const request = createMockRequest('http://localhost:3000/api/gift-cards')
      const response = await getGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Code or balance parameter required')
    })

    it('should handle errors when validating gift card', async () => {
      ;(giftCardService.validateGiftCard as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/gift-cards?code=TEST-CODE')
      const response = await getGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch gift card')
    })

    it('should handle errors when checking balance', async () => {
      ;(giftCardService.checkBalance as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/gift-cards?balance=TEST-CODE')
      const response = await getGiftCard(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch gift card')
    })
  })

  describe('GET /api/gift-cards/[id] errors', () => {
    it('should handle errors when fetching by ID', async () => {
      ;(giftCardService.getGiftCardById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/gift-cards/gc1')
      const response = await getGiftCardById(request, {
        params: Promise.resolve({ id: 'gc1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch gift card')
    })
  })
})

