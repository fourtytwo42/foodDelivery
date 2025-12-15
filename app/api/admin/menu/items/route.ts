import { NextRequest, NextResponse } from 'next/server'
import { menuService, CreateMenuItemInput } from '@/services/menu-service'
import { z } from 'zod'

const createItemSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
  price: z.number().positive('Price must be positive'),
  featured: z.boolean().optional(),
  popular: z.boolean().optional(),
  availableTimes: z
    .array(
      z.object({
        start: z.string(),
        end: z.string(),
      })
    )
    .optional(),
  dietaryTags: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  calories: z.number().int().positive().optional(),
  preparationTime: z.number().int().positive().optional(),
  spiceLevel: z.number().int().min(0).max(5).optional(),
  modifierIds: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId') || undefined
    const featured = searchParams.get('featured') === 'true' ? true : undefined
    const popular = searchParams.get('popular') === 'true' ? true : undefined
    const search = searchParams.get('search') || undefined

    const items = await menuService.getMenuItems({
      categoryId,
      featured,
      popular,
      search,
    })

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createItemSchema.parse(body)

    const item = await menuService.createMenuItem(data as CreateMenuItemInput)

    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
}

