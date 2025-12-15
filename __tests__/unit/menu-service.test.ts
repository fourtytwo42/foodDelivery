import { menuService } from '@/services/menu-service'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    menuCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    menuItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    modifier: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('menuService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCategories', () => {
    it('should fetch active categories by default', async () => {
      const mockCategories = [
        { id: '1', name: 'Appetizers', active: true },
        { id: '2', name: 'Entrees', active: true },
      ]

      ;(prisma.menuCategory.findMany as jest.Mock).mockResolvedValue(
        mockCategories
      )

      const result = await menuService.getCategories()

      expect(prisma.menuCategory.findMany).toHaveBeenCalledWith({
        where: { active: true, deletedAt: null },
        orderBy: { order: 'asc' },
        include: {
          items: {
            where: { active: true, deletedAt: null },
          },
        },
      })
      expect(result).toEqual(mockCategories)
    })

    it('should fetch all categories when includeInactive is true', async () => {
      const mockCategories = [
        { id: '1', name: 'Appetizers', active: true },
        { id: '2', name: 'Entrees', active: false },
      ]

      ;(prisma.menuCategory.findMany as jest.Mock).mockResolvedValue(
        mockCategories
      )

      const result = await menuService.getCategories(true)

      expect(prisma.menuCategory.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
        include: {
          items: {
            where: { active: true, deletedAt: null },
          },
        },
      })
      expect(result).toEqual(mockCategories)
    })
  })

  describe('createCategory', () => {
    it('should create a category with all fields', async () => {
      const input = {
        name: 'Desserts',
        description: 'Sweet treats',
        image: 'https://example.com/dessert.jpg',
        order: 3,
        availableTimes: [{ start: '10:00', end: '22:00' }],
      }

      const mockCategory = { id: '1', ...input, active: true }

      ;(prisma.menuCategory.create as jest.Mock).mockResolvedValue(mockCategory)

      const result = await menuService.createCategory(input)

      expect(prisma.menuCategory.create).toHaveBeenCalledWith({
        data: {
          name: input.name,
          description: input.description,
          image: input.image,
          order: input.order,
          availableTimes: input.availableTimes,
        },
      })
      expect(result).toEqual(mockCategory)
    })

    it('should create a category with minimal fields', async () => {
      const input = { name: 'Drinks' }
      const mockCategory = { id: '1', ...input, order: 0, active: true }

      ;(prisma.menuCategory.create as jest.Mock).mockResolvedValue(mockCategory)

      const result = await menuService.createCategory(input)

      expect(prisma.menuCategory.create).toHaveBeenCalledWith({
        data: {
          name: input.name,
          description: undefined,
          image: undefined,
          order: 0,
          availableTimes: undefined,
        },
      })
      expect(result).toEqual(mockCategory)
    })
  })

  describe('getMenuItems', () => {
    it('should fetch menu items without filters', async () => {
      const mockItems = [
        { id: '1', name: 'Pizza', price: 14.99 },
        { id: '2', name: 'Burger', price: 11.99 },
      ]

      ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue(mockItems)

      const result = await menuService.getMenuItems()

      expect(prisma.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          deletedAt: null,
        },
        include: expect.objectContaining({
          category: true,
          modifiers: expect.any(Object),
        }),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockItems)
    })

    it('should filter menu items by category', async () => {
      const mockItems = [{ id: '1', name: 'Pizza', categoryId: 'cat1' }]

      ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue(mockItems)

      const result = await menuService.getMenuItems({ categoryId: 'cat1' })

      expect(prisma.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          deletedAt: null,
          categoryId: 'cat1',
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockItems)
    })

    it('should filter menu items by search term', async () => {
      const mockItems = [{ id: '1', name: 'Pizza', description: 'Delicious' }]

      ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue(mockItems)

      const result = await menuService.getMenuItems({ search: 'pizza' })

      expect(prisma.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          deletedAt: null,
          OR: [
            { name: { contains: 'pizza', mode: 'insensitive' } },
            { description: { contains: 'pizza', mode: 'insensitive' } },
          ],
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockItems)
    })

    it('should filter menu items by featured flag', async () => {
      const mockItems = [{ id: '1', name: 'Pizza', featured: true }]

      ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue(mockItems)

      const result = await menuService.getMenuItems({ featured: true })

      expect(prisma.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          deletedAt: null,
          featured: true,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockItems)
    })
  })

  describe('createMenuItem', () => {
    it('should create a menu item with modifiers', async () => {
      const input = {
        categoryId: 'cat1',
        name: 'Pizza',
        price: 14.99,
        modifierIds: ['mod1', 'mod2'],
      }

      const mockItem = { id: '1', ...input }

      ;(prisma.menuItem.create as jest.Mock).mockResolvedValue(mockItem)

      const result = await menuService.createMenuItem(input)

      expect(prisma.menuItem.create).toHaveBeenCalled()
      const callArgs = (prisma.menuItem.create as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.modifiers.create).toHaveLength(2)
      expect(callArgs.data.modifiers.create[0].modifierId).toBe('mod1')
      expect(callArgs.data.modifiers.create[1].modifierId).toBe('mod2')
      expect(result).toEqual(mockItem)
    })

    it('should create a menu item without modifiers', async () => {
      const input = {
        categoryId: 'cat1',
        name: 'Pizza',
        price: 14.99,
      }

      const mockItem = { id: '1', ...input }

      ;(prisma.menuItem.create as jest.Mock).mockResolvedValue(mockItem)

      const result = await menuService.createMenuItem(input)

      expect(prisma.menuItem.create).toHaveBeenCalled()
      const callArgs = (prisma.menuItem.create as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.modifiers).toBeUndefined()
      expect(result).toEqual(mockItem)
    })
  })

  describe('getModifiers', () => {
    it('should fetch all active modifiers', async () => {
      const mockModifiers = [
        { id: '1', name: 'Size', type: 'SINGLE_CHOICE' },
        { id: '2', name: 'Toppings', type: 'MULTIPLE_CHOICE' },
      ]

      ;(prisma.modifier.findMany as jest.Mock).mockResolvedValue(mockModifiers)

      const result = await menuService.getModifiers()

      expect(prisma.modifier.findMany).toHaveBeenCalledWith({
        where: { active: true, deletedAt: null },
        include: {
          options: {
            where: { active: true, deletedAt: null },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      })
      expect(result).toEqual(mockModifiers)
    })
  })

  describe('createModifier', () => {
    it('should create a modifier with options', async () => {
      const input = {
        name: 'Size',
        type: 'SINGLE_CHOICE' as const,
        required: true,
        options: [
          { name: 'Small', price: 0 },
          { name: 'Large', price: 2 },
        ],
      }

      const mockModifier = { id: '1', ...input }

      ;(prisma.modifier.create as jest.Mock).mockResolvedValue(mockModifier)

      const result = await menuService.createModifier(input)

      expect(prisma.modifier.create).toHaveBeenCalled()
      const callArgs = (prisma.modifier.create as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.options.create).toHaveLength(2)
      expect(result).toEqual(mockModifier)
    })

    it('should create a modifier without options', async () => {
      const input = {
        name: 'Notes',
        type: 'TEXT' as const,
      }

      const mockModifier = { id: '1', ...input }

      ;(prisma.modifier.create as jest.Mock).mockResolvedValue(mockModifier)

      const result = await menuService.createModifier(input)

      expect(prisma.modifier.create).toHaveBeenCalled()
      const callArgs = (prisma.modifier.create as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.options).toBeUndefined()
      expect(result).toEqual(mockModifier)
    })
  })

  describe('deleteCategory', () => {
    it('should soft delete a category', async () => {
      const categoryId = 'cat1'
      const mockUpdated = { id: categoryId, deletedAt: new Date(), active: false }

      ;(prisma.menuCategory.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await menuService.deleteCategory(categoryId)

      expect(prisma.menuCategory.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: { deletedAt: expect.any(Date), active: false },
      })
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('deleteMenuItem', () => {
    it('should soft delete a menu item', async () => {
      const itemId = 'item1'
      const mockUpdated = { id: itemId, deletedAt: new Date(), active: false }

      ;(prisma.menuItem.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await menuService.deleteMenuItem(itemId)

      expect(prisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: itemId },
        data: { deletedAt: expect.any(Date), active: false },
      })
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('getCategoryById', () => {
    it('should fetch a category by id', async () => {
      const categoryId = 'cat1'
      const mockCategory = { id: categoryId, name: 'Appetizers' }

      ;(prisma.menuCategory.findUnique as jest.Mock).mockResolvedValue(
        mockCategory
      )

      const result = await menuService.getCategoryById(categoryId)

      expect(prisma.menuCategory.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
        include: expect.any(Object),
      })
      expect(result).toEqual(mockCategory)
    })
  })

  describe('getMenuItemById', () => {
    it('should fetch a menu item by id', async () => {
      const itemId = 'item1'
      const mockItem = { id: itemId, name: 'Pizza', price: 14.99 }

      ;(prisma.menuItem.findUnique as jest.Mock).mockResolvedValue(mockItem)

      const result = await menuService.getMenuItemById(itemId)

      expect(prisma.menuItem.findUnique).toHaveBeenCalledWith({
        where: { id: itemId },
        include: expect.any(Object),
      })
      expect(result).toEqual(mockItem)
    })
  })

  describe('getModifierById', () => {
    it('should fetch a modifier by id', async () => {
      const modifierId = 'mod1'
      const mockModifier = { id: modifierId, name: 'Size', type: 'SINGLE_CHOICE' }

      ;(prisma.modifier.findUnique as jest.Mock).mockResolvedValue(
        mockModifier
      )

      const result = await menuService.getModifierById(modifierId)

      expect(prisma.modifier.findUnique).toHaveBeenCalledWith({
        where: { id: modifierId },
        include: expect.any(Object),
      })
      expect(result).toEqual(mockModifier)
    })
  })

  describe('updateModifier', () => {
    it('should update a modifier', async () => {
      const modifierId = 'mod1'
      const updateData = { name: 'Updated Size' }
      const mockUpdated = { id: modifierId, ...updateData }

      ;(prisma.modifier.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await menuService.updateModifier(modifierId, updateData)

      expect(prisma.modifier.update).toHaveBeenCalledWith({
        where: { id: modifierId },
        data: expect.objectContaining({ name: updateData.name }),
        include: expect.any(Object),
      })
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('deleteModifier', () => {
    it('should soft delete a modifier', async () => {
      const modifierId = 'mod1'
      const mockUpdated = { id: modifierId, deletedAt: new Date(), active: false }

      ;(prisma.modifier.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await menuService.deleteModifier(modifierId)

      expect(prisma.modifier.update).toHaveBeenCalledWith({
        where: { id: modifierId },
        data: { deletedAt: expect.any(Date), active: false },
      })
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('updateCategory', () => {
    it('should update a category', async () => {
      const categoryId = 'cat1'
      const updateData = { name: 'Updated Name' }
      const mockUpdated = { id: categoryId, ...updateData }

      ;(prisma.menuCategory.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await menuService.updateCategory(categoryId, updateData)

      expect(prisma.menuCategory.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: expect.objectContaining({ name: updateData.name }),
      })
      expect(result).toEqual(mockUpdated)
    })

    it('should update category with all fields', async () => {
      const categoryId = 'cat1'
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        image: 'new-image.jpg',
        order: 5,
        availableTimes: [{ start: '09:00', end: '21:00' }],
      }
      const mockUpdated = { id: categoryId, ...updateData }

      ;(prisma.menuCategory.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await menuService.updateCategory(categoryId, updateData)

      expect(prisma.menuCategory.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: expect.objectContaining({
          name: updateData.name,
          description: updateData.description,
          image: updateData.image,
          order: updateData.order,
          availableTimes: updateData.availableTimes,
        }),
      })
      expect(result).toEqual(mockUpdated)
    })

    it('should handle undefined fields in update', async () => {
      const categoryId = 'cat1'
      const updateData = {
        name: 'Updated Name',
        description: undefined,
        image: undefined,
      }
      const mockUpdated = { id: categoryId, name: updateData.name }

      ;(prisma.menuCategory.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await menuService.updateCategory(categoryId, updateData)

      const callArgs = (prisma.menuCategory.update as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.description).toBeUndefined()
      expect(callArgs.data.image).toBeUndefined()
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('updateMenuItem', () => {
    it('should update a menu item', async () => {
      const itemId = 'item1'
      const updateData = { name: 'Updated Pizza', price: 16.99 }
      const mockUpdated = { id: itemId, ...updateData }

      ;(prisma.menuItem.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await menuService.updateMenuItem(itemId, updateData)

      expect(prisma.menuItem.update).toHaveBeenCalledWith({
        where: { id: itemId },
        data: expect.any(Object),
        include: expect.any(Object),
      })
      expect(result).toEqual(mockUpdated)
    })

    it('should update menu item with all fields', async () => {
      const itemId = 'item1'
      const updateData = {
        name: 'Updated Pizza',
        description: 'Updated description',
        image: 'new-image.jpg',
        price: 16.99,
        categoryId: 'cat2',
        featured: true,
        popular: false,
        availableTimes: [{ start: '11:00', end: '22:00' }],
        dietaryTags: ['vegetarian'],
        allergens: ['gluten'],
        calories: 350,
        preparationTime: 20,
        spiceLevel: 2,
      }
      const mockUpdated = { id: itemId, ...updateData }

      ;(prisma.menuItem.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await menuService.updateMenuItem(itemId, updateData)

      const callArgs = (prisma.menuItem.update as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.name).toBe(updateData.name)
      expect(callArgs.data.description).toBe(updateData.description)
      expect(callArgs.data.categoryId).toBe(updateData.categoryId)
      expect(callArgs.data.featured).toBe(updateData.featured)
      expect(callArgs.data.popular).toBe(updateData.popular)
      expect(result).toEqual(mockUpdated)
    })

    it('should handle undefined fields in update', async () => {
      const itemId = 'item1'
      const updateData = {
        name: 'Updated Pizza',
        description: undefined,
        image: undefined,
      }
      const mockUpdated = { id: itemId, name: updateData.name }

      ;(prisma.menuItem.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await menuService.updateMenuItem(itemId, updateData)

      const callArgs = (prisma.menuItem.update as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.description).toBeUndefined()
      expect(callArgs.data.image).toBeUndefined()
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('updateModifier', () => {
    it('should update modifier with all fields', async () => {
      const modifierId = 'mod1'
      const updateData = {
        name: 'Updated Size',
        description: 'Updated description',
        type: 'MULTIPLE_CHOICE' as const,
        required: false,
        minSelections: 1,
        maxSelections: 3,
      }
      const mockUpdated = { id: modifierId, ...updateData }

      ;(prisma.modifier.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await menuService.updateModifier(modifierId, updateData)

      const callArgs = (prisma.modifier.update as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.name).toBe(updateData.name)
      expect(callArgs.data.type).toBe(updateData.type)
      expect(callArgs.data.required).toBe(updateData.required)
      expect(callArgs.data.minSelections).toBe(updateData.minSelections)
      expect(callArgs.data.maxSelections).toBe(updateData.maxSelections)
      expect(result).toEqual(mockUpdated)
    })

    it('should handle undefined fields in modifier update', async () => {
      const modifierId = 'mod1'
      const updateData = {
        name: 'Updated Size',
        description: undefined,
      }
      const mockUpdated = { id: modifierId, name: updateData.name }

      ;(prisma.modifier.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await menuService.updateModifier(modifierId, updateData)

      const callArgs = (prisma.modifier.update as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.description).toBeUndefined()
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('getMenuItems', () => {
    it('should filter menu items by popular flag', async () => {
      const mockItems = [{ id: '1', name: 'Pizza', popular: true }]

      ;(prisma.menuItem.findMany as jest.Mock).mockResolvedValue(mockItems)

      const result = await menuService.getMenuItems({ popular: true })

      expect(prisma.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          deletedAt: null,
          popular: true,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockItems)
    })
  })
})

