/**
 * @jest-environment node
 */
import { GET as getCategories, POST as createCategory } from '@/app/api/admin/menu/categories/route'
import { GET as getCategory, PUT as updateCategory, DELETE as deleteCategory } from '@/app/api/admin/menu/categories/[id]/route'
import { GET as getItems, POST as createItem } from '@/app/api/admin/menu/items/route'
import { GET as getItem, PUT as updateItem, DELETE as deleteItem } from '@/app/api/admin/menu/items/[id]/route'
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

describe('Menu API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/menu/categories', () => {
    it('should return categories', async () => {
      const mockCategories = [
        { id: '1', name: 'Appetizers', order: 1 },
        { id: '2', name: 'Entrees', order: 2 },
      ]

      ;(menuService.getCategories as jest.Mock).mockResolvedValue(mockCategories)

      const request = createMockRequest('http://localhost:3000/api/admin/menu/categories')
      const response = await getCategories(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.categories).toEqual(mockCategories)
    })

    it('should handle errors', async () => {
      ;(menuService.getCategories as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/admin/menu/categories')
      const response = await getCategories(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch categories')
    })
  })

  describe('POST /api/admin/menu/categories', () => {
    it('should create a category', async () => {
      const categoryData = {
        name: 'Desserts',
        description: 'Sweet treats',
        order: 3,
      }

      const mockCategory = { id: '1', ...categoryData, active: true }

      ;(menuService.createCategory as jest.Mock).mockResolvedValue(mockCategory)

      const request = createMockRequest('http://localhost:3000/api/admin/menu/categories', categoryData, 'POST')
      const response = await createCategory(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.category).toEqual(mockCategory)
    })

    it('should validate required fields', async () => {
      const invalidData = { description: 'Missing name' }

      const request = createMockRequest('http://localhost:3000/api/admin/menu/categories', invalidData, 'POST')
      const response = await createCategory(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })
  })

  describe('GET /api/admin/menu/categories/[id]', () => {
    it('should return a category by id', async () => {
      const categoryId = 'cat1'
      const mockCategory = { id: categoryId, name: 'Appetizers' }

      ;(menuService.getCategoryById as jest.Mock).mockResolvedValue(mockCategory)

      const request = createMockRequest(`http://localhost:3000/api/admin/menu/categories/${categoryId}`)
      const response = await getCategory(request, {
        params: Promise.resolve({ id: categoryId }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.category).toEqual(mockCategory)
    })

    it('should return 404 when category not found', async () => {
      ;(menuService.getCategoryById as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/admin/menu/categories/notfound')
      const response = await getCategory(request, {
        params: Promise.resolve({ id: 'notfound' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Category not found')
    })

    it('should handle errors when fetching category', async () => {
      ;(menuService.getCategoryById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/admin/menu/categories/cat1')
      const response = await getCategory(request, {
        params: Promise.resolve({ id: 'cat1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch category')
    })
  })

  describe('PUT /api/admin/menu/categories/[id]', () => {
    it('should update a category', async () => {
      const categoryId = 'cat1'
      const updateData = { name: 'Updated Name' }
      const mockUpdated = { id: categoryId, ...updateData }

      ;(menuService.updateCategory as jest.Mock).mockResolvedValue(mockUpdated)

      const request = createMockRequest(`http://localhost:3000/api/admin/menu/categories/${categoryId}`, updateData, 'PUT')
      const response = await updateCategory(request, {
        params: Promise.resolve({ id: categoryId }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.category).toEqual(mockUpdated)
    })

    it('should handle errors when updating category', async () => {
      const categoryId = 'cat1'
      const updateData = { name: 'Updated Name' }

      ;(menuService.updateCategory as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(`http://localhost:3000/api/admin/menu/categories/${categoryId}`, updateData, 'PUT')
      const response = await updateCategory(request, {
        params: Promise.resolve({ id: categoryId }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update category')
    })
  })

  describe('DELETE /api/admin/menu/categories/[id]', () => {
    it('should delete a category', async () => {
      const categoryId = 'cat1'

      ;(menuService.deleteCategory as jest.Mock).mockResolvedValue({})

      const request = createMockRequest(`http://localhost:3000/api/admin/menu/categories/${categoryId}`, undefined, 'DELETE')
      const response = await deleteCategory(request, {
        params: Promise.resolve({ id: categoryId }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle errors when deleting category', async () => {
      const categoryId = 'cat1'

      ;(menuService.deleteCategory as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(`http://localhost:3000/api/admin/menu/categories/${categoryId}`, undefined, 'DELETE')
      const response = await deleteCategory(request, {
        params: Promise.resolve({ id: categoryId }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete category')
    })
  })

  describe('GET /api/admin/menu/items', () => {
    it('should return menu items', async () => {
      const mockItems = [
        { id: '1', name: 'Pizza', price: 14.99 },
        { id: '2', name: 'Burger', price: 11.99 },
      ]

      ;(menuService.getMenuItems as jest.Mock).mockResolvedValue(mockItems)

      const request = createMockRequest('http://localhost:3000/api/admin/menu/items')
      const response = await getItems(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.items).toEqual(mockItems)
    })

    it('should filter items by category', async () => {
      const mockItems = [{ id: '1', name: 'Pizza', categoryId: 'cat1' }]

      ;(menuService.getMenuItems as jest.Mock).mockResolvedValue(mockItems)

      const request = createMockRequest('http://localhost:3000/api/admin/menu/items?categoryId=cat1')
      const response = await getItems(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(menuService.getMenuItems).toHaveBeenCalledWith({ categoryId: 'cat1' })
      expect(data.items).toEqual(mockItems)
    })
  })

  describe('POST /api/admin/menu/items', () => {
    it('should create a menu item', async () => {
      const itemData = {
        categoryId: 'cat1',
        name: 'Pizza',
        price: 14.99,
        featured: true,
      }

      const mockItem = { id: '1', ...itemData }

      ;(menuService.createMenuItem as jest.Mock).mockResolvedValue(mockItem)

      const request = createMockRequest('http://localhost:3000/api/admin/menu/items', itemData, 'POST')
      const response = await createItem(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.item).toEqual(mockItem)
    })

    it('should validate required fields', async () => {
      const invalidData = { name: 'Missing categoryId and price' }

      const request = createMockRequest('http://localhost:3000/api/admin/menu/items', invalidData, 'POST')
      const response = await createItem(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })
  })

  describe('GET /api/admin/menu/items/[id]', () => {
    it('should return a menu item by id', async () => {
      const itemId = 'item1'
      const mockItem = { id: itemId, name: 'Pizza', price: 14.99 }

      ;(menuService.getMenuItemById as jest.Mock).mockResolvedValue(mockItem)

      const request = createMockRequest(`http://localhost:3000/api/admin/menu/items/${itemId}`)
      const response = await getItem(request, {
        params: Promise.resolve({ id: itemId }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.item).toEqual(mockItem)
    })

    it('should return 404 when item not found', async () => {
      ;(menuService.getMenuItemById as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/admin/menu/items/notfound')
      const response = await getItem(request, {
        params: Promise.resolve({ id: 'notfound' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Menu item not found')
    })

    it('should handle errors when fetching item', async () => {
      ;(menuService.getMenuItemById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest('http://localhost:3000/api/admin/menu/items/item1')
      const response = await getItem(request, {
        params: Promise.resolve({ id: 'item1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch menu item')
    })
  })

  describe('PUT /api/admin/menu/items/[id]', () => {
    it('should update a menu item', async () => {
      const itemId = 'item1'
      const updateData = { name: 'Updated Pizza', price: 16.99 }
      const mockUpdated = { id: itemId, ...updateData }

      ;(menuService.updateMenuItem as jest.Mock).mockResolvedValue(mockUpdated)

      const request = createMockRequest(`http://localhost:3000/api/admin/menu/items/${itemId}`, updateData, 'PUT')
      const response = await updateItem(request, {
        params: Promise.resolve({ id: itemId }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.item).toEqual(mockUpdated)
    })

    it('should handle errors when updating item', async () => {
      const itemId = 'item1'
      const updateData = { name: 'Updated Pizza' }

      ;(menuService.updateMenuItem as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(`http://localhost:3000/api/admin/menu/items/${itemId}`, updateData, 'PUT')
      const response = await updateItem(request, {
        params: Promise.resolve({ id: itemId }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update menu item')
    })
  })

  describe('DELETE /api/admin/menu/items/[id]', () => {
    it('should delete a menu item', async () => {
      const itemId = 'item1'

      ;(menuService.deleteMenuItem as jest.Mock).mockResolvedValue({})

      const request = createMockRequest(`http://localhost:3000/api/admin/menu/items/${itemId}`, undefined, 'DELETE')
      const response = await deleteItem(request, {
        params: Promise.resolve({ id: itemId }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle errors when deleting item', async () => {
      const itemId = 'item1'

      ;(menuService.deleteMenuItem as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = createMockRequest(`http://localhost:3000/api/admin/menu/items/${itemId}`, undefined, 'DELETE')
      const response = await deleteItem(request, {
        params: Promise.resolve({ id: itemId }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete menu item')
    })
  })
})

