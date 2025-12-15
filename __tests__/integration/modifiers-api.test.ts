/**
 * @jest-environment node
 */
import { GET as getModifiers, POST as createModifier } from '@/app/api/admin/menu/modifiers/route'
import { menuService } from '@/services/menu-service'
import { NextRequest } from 'next/server'

jest.mock('@/services/menu-service')

const createMockRequest = (url: string, body?: unknown, method = 'GET') => {
  const urlObj = new URL(url)
  return {
    url: url,
    method,
    json: async () => body,
    nextUrl: urlObj,
    headers: new Headers(),
  } as unknown as NextRequest
}

describe('Modifiers API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/menu/modifiers', () => {
    it('should return modifiers', async () => {
      const mockModifiers = [
        { id: '1', name: 'Size', type: 'SINGLE_CHOICE' },
        { id: '2', name: 'Toppings', type: 'MULTIPLE_CHOICE' },
      ]

      ;(menuService.getModifiers as jest.Mock).mockResolvedValue(mockModifiers)

      const response = await getModifiers()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.modifiers).toEqual(mockModifiers)
    })
  })

  describe('POST /api/admin/menu/modifiers', () => {
    it('should create a modifier', async () => {
      const modifierData = {
        name: 'Size',
        type: 'SINGLE_CHOICE',
        required: true,
        options: [
          { name: 'Small', price: 0 },
          { name: 'Large', price: 2 },
        ],
      }

      const mockModifier = { id: '1', ...modifierData }

      ;(menuService.createModifier as jest.Mock).mockResolvedValue(mockModifier)

      const request = createMockRequest('http://localhost:3000/api/admin/menu/modifiers', modifierData, 'POST')
      const response = await createModifier(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.modifier).toEqual(mockModifier)
    })

    it('should validate required fields', async () => {
      const invalidData = { description: 'Missing name and type' }

      const request = createMockRequest('http://localhost:3000/api/admin/menu/modifiers', invalidData, 'POST')
      const response = await createModifier(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })

    it('should handle errors when creating modifier', async () => {
      const modifierData = {
        name: 'Size',
        type: 'SINGLE_CHOICE',
      }

      ;(menuService.createModifier as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/admin/menu/modifiers', modifierData, 'POST')
      const response = await createModifier(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create modifier')
    })
  })
})

