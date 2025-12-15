/**
 * @jest-environment node
 */
import { GET as getAccount } from '@/app/api/loyalty/account/route'
import { POST as earnPoints } from '@/app/api/loyalty/earn/route'
import { POST as redeemPoints } from '@/app/api/loyalty/redeem/route'
import { GET as getHistory } from '@/app/api/loyalty/history/route'
import { loyaltyService } from '@/services/loyalty-service'
import { NextRequest } from 'next/server'

jest.mock('@/services/loyalty-service', () => ({
  loyaltyService: {
    getAccount: jest.fn(),
    getPointsValue: jest.fn(),
    earnPoints: jest.fn(),
    redeemPoints: jest.fn(),
    getTransactionHistory: jest.fn(),
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

describe('Loyalty API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/loyalty/account', () => {
    it('should return loyalty account', async () => {
      const mockAccount = {
        id: 'acc1',
        userId: 'user1',
        points: 250,
        lifetimePoints: 500,
        tier: 'BRONZE',
      }

      ;(loyaltyService.getAccount as jest.Mock).mockResolvedValue(mockAccount)
      ;(loyaltyService.getPointsValue as jest.Mock).mockResolvedValue(2.5)

      const request = createMockRequest('http://localhost:3000/api/loyalty/account?userId=user1')
      const response = await getAccount(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.account).toEqual(mockAccount)
      expect(data.pointsValue).toBe(2.5)
    })

    it('should return 400 when userId missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/loyalty/account')
      const response = await getAccount(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('userId parameter required')
    })

    it('should return 404 when account not found', async () => {
      ;(loyaltyService.getAccount as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/loyalty/account?userId=user1')
      const response = await getAccount(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Loyalty account not found')
    })
  })

  describe('POST /api/loyalty/earn', () => {
    it('should earn points from order', async () => {
      const mockAccount = {
        id: 'acc1',
        userId: 'user1',
        points: 250,
        lifetimePoints: 500,
      }

      ;(loyaltyService.earnPoints as jest.Mock).mockResolvedValue({
        success: true,
        account: mockAccount,
        pointsEarned: 50,
      })

      const request = createMockRequest(
        'http://localhost:3000/api/loyalty/earn',
        {
          userId: 'user1',
          orderId: 'order1',
          orderTotal: 100.0,
        },
        'POST'
      )

      const response = await earnPoints(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.pointsEarned).toBe(50)
      expect(data.account).toEqual(mockAccount)
    })

    it('should return error for failed earning', async () => {
      ;(loyaltyService.earnPoints as jest.Mock).mockResolvedValue({
        success: false,
        error: 'No points to earn',
      })

      const request = createMockRequest(
        'http://localhost:3000/api/loyalty/earn',
        {
          userId: 'user1',
          orderId: 'order1',
          orderTotal: 100.0,
        },
        'POST'
      )

      const response = await earnPoints(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No points to earn')
    })

    it('should handle validation errors', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/loyalty/earn',
        {
          userId: '', // Invalid: empty userId
          orderId: 'order1',
          orderTotal: 100.0,
        },
        'POST'
      )

      const response = await earnPoints(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })
  })

  describe('POST /api/loyalty/redeem', () => {
    it('should redeem points', async () => {
      const mockAccount = {
        id: 'acc1',
        userId: 'user1',
        points: 150,
      }

      ;(loyaltyService.redeemPoints as jest.Mock).mockResolvedValue({
        success: true,
        account: mockAccount,
        discountAmount: 1.0,
      })

      const request = createMockRequest(
        'http://localhost:3000/api/loyalty/redeem',
        {
          userId: 'user1',
          points: 100,
          orderId: 'order1',
        },
        'POST'
      )

      const response = await redeemPoints(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.discountAmount).toBe(1.0)
      expect(data.account).toEqual(mockAccount)
    })

    it('should return error for insufficient points', async () => {
      ;(loyaltyService.redeemPoints as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Insufficient points',
      })

      const request = createMockRequest(
        'http://localhost:3000/api/loyalty/redeem',
        {
          userId: 'user1',
          points: 1000,
        },
        'POST'
      )

      const response = await redeemPoints(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Insufficient points')
    })

    it('should handle validation errors', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/loyalty/redeem',
        {
          userId: '', // invalid userId
          points: 0, // invalid points
        },
        'POST'
      )

      const response = await redeemPoints(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })
  })

  describe('GET /api/loyalty/history', () => {
    it('should return transaction history', async () => {
      const mockDate = new Date('2024-01-15T12:00:00Z')
      const mockHistory = [
        {
          id: 'tx1',
          points: 50,
          type: 'EARNED',
          createdAt: mockDate,
        },
      ]

      ;(loyaltyService.getTransactionHistory as jest.Mock).mockResolvedValue(mockHistory)

      const request = createMockRequest('http://localhost:3000/api/loyalty/history?userId=user1')
      const response = await getHistory(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.history).toHaveLength(1)
      expect(data.history[0].id).toBe('tx1')
      expect(data.history[0].points).toBe(50)
      expect(data.history[0].type).toBe('EARNED')
    })

    it('should accept limit parameter', async () => {
      const mockHistory = []
      ;(loyaltyService.getTransactionHistory as jest.Mock).mockResolvedValue(mockHistory)

      const request = createMockRequest(
        'http://localhost:3000/api/loyalty/history?userId=user1&limit=10'
      )
      const response = await getHistory(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(loyaltyService.getTransactionHistory).toHaveBeenCalledWith('user1', 10)
    })

    it('should return 400 when userId missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/loyalty/history')
      const response = await getHistory(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('userId parameter required')
    })

    it('should handle errors when fetching history', async () => {
      ;(loyaltyService.getTransactionHistory as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/loyalty/history?userId=user1')
      const response = await getHistory(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch transaction history')
    })
  })

  describe('GET /api/loyalty/account errors', () => {
    it('should handle errors when fetching account', async () => {
      ;(loyaltyService.getAccount as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/loyalty/account?userId=user1')
      const response = await getAccount(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch loyalty account')
    })
  })

  describe('POST /api/loyalty/earn errors', () => {
    it('should handle errors when earning points', async () => {
      ;(loyaltyService.earnPoints as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/loyalty/earn',
        {
          userId: 'user1',
          orderId: 'order1',
          orderTotal: 100.0,
        },
        'POST'
      )

      const response = await earnPoints(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to earn points')
    })
  })

  describe('POST /api/loyalty/redeem errors', () => {
    it('should handle errors when redeeming points', async () => {
      ;(loyaltyService.redeemPoints as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(
        'http://localhost:3000/api/loyalty/redeem',
        {
          userId: 'user1',
          points: 100,
        },
        'POST'
      )

      const response = await redeemPoints(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to redeem points')
    })
  })
})

