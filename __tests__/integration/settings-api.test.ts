/**
 * @jest-environment node
 */
import { GET as getSettings } from '@/app/api/settings/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    restaurantSettings: {
      findUnique: jest.fn(),
    },
  },
}))

const createMockRequest = (url: string) => {
  const urlObj = new URL(url)
  return {
    url: url,
    method: 'GET',
    nextUrl: urlObj,
    headers: new Headers(),
  } as unknown as NextRequest
}

describe('Settings API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/settings', () => {
    it('should return restaurant settings', async () => {
      const mockSettings = {
        id: 'default',
        name: 'Demo Restaurant',
        taxRate: 0.0825,
        minOrderAmount: 10.0,
      }

      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(
        mockSettings
      )

      const request = createMockRequest('http://localhost:3000/api/settings')
      const response = await getSettings()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.settings).toEqual(mockSettings)
      expect(prisma.restaurantSettings.findUnique).toHaveBeenCalledWith({
        where: { id: 'default' },
      })
    })

    it('should return 404 when settings not found', async () => {
      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockResolvedValue(
        null
      )

      const request = createMockRequest('http://localhost:3000/api/settings')
      const response = await getSettings()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Settings not found')
    })

    it('should handle errors', async () => {
      ;(prisma.restaurantSettings.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/settings')
      const response = await getSettings()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch settings')
    })
  })
})

