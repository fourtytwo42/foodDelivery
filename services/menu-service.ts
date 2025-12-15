import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface CreateCategoryInput {
  name: string
  description?: string
  image?: string
  order?: number
  availableTimes?: Array<{ start: string; end: string }>
}

export interface CreateMenuItemInput {
  categoryId: string
  name: string
  description?: string
  image?: string
  price: number
  featured?: boolean
  popular?: boolean
  availableTimes?: Array<{ start: string; end: string }>
  dietaryTags?: string[]
  allergens?: string[]
  calories?: number
  preparationTime?: number
  spiceLevel?: number
  modifierIds?: string[]
}

export interface CreateModifierInput {
  name: string
  description?: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT' | 'NUMBER'
  required?: boolean
  minSelections?: number
  maxSelections?: number
  options?: Array<{
    name: string
    description?: string
    price: number
    order?: number
  }>
}

export const menuService = {
  // Categories
  async getCategories(includeInactive = false) {
    return prisma.menuCategory.findMany({
      where: includeInactive
        ? { deletedAt: null }
        : { active: true, deletedAt: null },
      orderBy: { order: 'asc' },
      include: {
        items: {
          where: { active: true, deletedAt: null },
        },
      },
    })
  },

  async getCategoryById(id: string) {
    return prisma.menuCategory.findUnique({
      where: { id },
      include: {
        items: {
          where: { active: true, deletedAt: null },
          include: {
            modifiers: {
              include: {
                modifier: {
                  include: {
                    options: {
                      where: { active: true, deletedAt: null },
                      orderBy: { order: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
  },

  async createCategory(data: CreateCategoryInput) {
    return prisma.menuCategory.create({
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        order: data.order ?? 0,
        availableTimes: data.availableTimes,
      },
    })
  },

  async updateCategory(id: string, data: Partial<CreateCategoryInput>) {
    return prisma.menuCategory.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.availableTimes !== undefined && { availableTimes: data.availableTimes }),
      },
    })
  },

  async deleteCategory(id: string) {
    return prisma.menuCategory.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    })
  },

  // Menu Items
  async getMenuItems(filters?: {
    categoryId?: string
    featured?: boolean
    popular?: boolean
    search?: string
  }) {
    return prisma.menuItem.findMany({
      where: {
        active: true,
        deletedAt: null,
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.featured !== undefined && { featured: filters.featured }),
        ...(filters?.popular !== undefined && { popular: filters.popular }),
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        category: true,
        modifiers: {
          include: {
            modifier: {
              include: {
                options: {
                  where: { active: true, deletedAt: null },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async getMenuItemById(id: string) {
    return prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        modifiers: {
          include: {
            modifier: {
              include: {
                options: {
                  where: { active: true, deletedAt: null },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    })
  },

  async createMenuItem(data: CreateMenuItemInput) {
    const { modifierIds, ...itemData } = data
    return prisma.menuItem.create({
      data: {
        ...itemData,
        price: new Decimal(itemData.price),
        modifiers: modifierIds
          ? {
              create: modifierIds.map((modifierId, index) => ({
                modifierId,
                required: false,
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        modifiers: {
          include: {
            modifier: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    })
  },

  async updateMenuItem(id: string, data: Partial<CreateMenuItemInput>) {
    const { modifierIds, ...itemData } = data
    return prisma.menuItem.update({
      where: { id },
      data: {
        ...(itemData.name && { name: itemData.name }),
        ...(itemData.description !== undefined && { description: itemData.description }),
        ...(itemData.image !== undefined && { image: itemData.image }),
        ...(itemData.price !== undefined && { price: new Decimal(itemData.price) }),
        ...(itemData.categoryId && { categoryId: itemData.categoryId }),
        ...(itemData.featured !== undefined && { featured: itemData.featured }),
        ...(itemData.popular !== undefined && { popular: itemData.popular }),
        ...(itemData.availableTimes !== undefined && { availableTimes: itemData.availableTimes }),
        ...(itemData.dietaryTags !== undefined && { dietaryTags: itemData.dietaryTags }),
        ...(itemData.allergens !== undefined && { allergens: itemData.allergens }),
        ...(itemData.calories !== undefined && { calories: itemData.calories }),
        ...(itemData.preparationTime !== undefined && { preparationTime: itemData.preparationTime }),
        ...(itemData.spiceLevel !== undefined && { spiceLevel: itemData.spiceLevel }),
      },
      include: {
        category: true,
        modifiers: {
          include: {
            modifier: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    })
  },

  async deleteMenuItem(id: string) {
    return prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    })
  },

  // Modifiers
  async getModifiers() {
    return prisma.modifier.findMany({
      where: { active: true, deletedAt: null },
      include: {
        options: {
          where: { active: true, deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })
  },

  async getModifierById(id: string) {
    return prisma.modifier.findUnique({
      where: { id },
      include: {
        options: {
          where: { active: true, deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    })
  },

  async createModifier(data: CreateModifierInput) {
    const { options, ...modifierData } = data
    return prisma.modifier.create({
      data: {
        ...modifierData,
        options: options
          ? {
              create: options.map((opt, index) => ({
                name: opt.name,
                description: opt.description,
                price: new Decimal(opt.price),
                order: opt.order ?? index,
              })),
            }
          : undefined,
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    })
  },

  async updateModifier(id: string, data: Partial<CreateModifierInput>) {
    return prisma.modifier.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type && { type: data.type }),
        ...(data.required !== undefined && { required: data.required }),
        ...(data.minSelections !== undefined && { minSelections: data.minSelections }),
        ...(data.maxSelections !== undefined && { maxSelections: data.maxSelections }),
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    })
  },

  async deleteModifier(id: string) {
    return prisma.modifier.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    })
  },
}

