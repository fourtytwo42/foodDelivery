/**
 * @jest-environment node
 */
import { GET as getCategories } from '@/app/api/menu/categories/route'
import { GET as getItems } from '@/app/api/menu/items/route'
import { menuService } from '@/services/menu-service'
import { NextRequest } from 'next/server'

jest.mock('@/services/menu-service')

const createMockRequest = (url: string) => {
  const urlObj = new URL(url)
  return {
    url: url,
    method: 'GET',
    nextUrl: urlObj,
    headers: new Headers(),
  } as unknown as NextRequest
}

describe('Public Menu API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/menu/categories', () => {
    it('should return active categories', async () => {
      const mockCategories = [
        { id: '1', name: 'Appetizers', active: true },
        { id: '2', name: 'Entrees', active: true },
      ]

      ;(menuService.getCategories as jest.Mock).mockResolvedValue(mockCategories)

      const request = createMockRequest('http://localhost:3000/api/menu/categories')
      const response = await getCategories(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.categories).toEqual(mockCategories)
      expect(menuService.getCategories).toHaveBeenCalledWith(false)
    })

    it('should handle errors', async () => {
      ;(menuService.getCategories as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/menu/categories')
      const response = await getCategories(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch categories')
    })
  })

  describe('GET /api/menu/items', () => {
    it('should return menu items', async () => {
      const mockItems = [
        { id: '1', name: 'Pizza', price: 14.99 },
        { id: '2', name: 'Burger', price: 11.99 },
      ]

      ;(menuService.getMenuItems as jest.Mock).mockResolvedValue(mockItems)

      const request = createMockRequest('http://localhost:3000/api/menu/items')
      const response = await getItems(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.items).toEqual(mockItems)
    })

    it('should filter items by category', async () => {
      const mockItems = [{ id: '1', name: 'Pizza', categoryId: 'cat1' }]

      ;(menuService.getMenuItems as jest.Mock).mockResolvedValue(mockItems)

      const request = createMockRequest('http://localhost:3000/api/menu/items?categoryId=cat1')
      const response = await getItems(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(menuService.getMenuItems).toHaveBeenCalledWith({ categoryId: 'cat1' })
      expect(data.items).toEqual(mockItems)
    })

    it('should filter featured items', async () => {
      const mockItems = [{ id: '1', name: 'Pizza', featured: true }]

      ;(menuService.getMenuItems as jest.Mock).mockResolvedValue(mockItems)

      const request = createMockRequest('http://localhost:3000/api/menu/items?featured=true')
      const response = await getItems(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(menuService.getMenuItems).toHaveBeenCalledWith({ featured: true })
      expect(data.items).toEqual(mockItems)
    })

    it('should search items', async () => {
      const mockItems = [{ id: '1', name: 'Pizza', description: 'Delicious' }]

      ;(menuService.getMenuItems as jest.Mock).mockResolvedValue(mockItems)

      const request = createMockRequest('http://localhost:3000/api/menu/items?search=pizza')
      const response = await getItems(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(menuService.getMenuItems).toHaveBeenCalledWith({ search: 'pizza' })
      expect(data.items).toEqual(mockItems)
    })

    it('should handle errors', async () => {
      ;(menuService.getMenuItems as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/menu/items')
      const response = await getItems(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch menu items')
    })
  })
})

