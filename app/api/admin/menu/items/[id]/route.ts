import { NextRequest, NextResponse } from 'next/server'
import { menuService, CreateMenuItemInput } from '@/services/menu-service'
import { z } from 'zod'

const updateItemSchema = z.object({
  categoryId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
  price: z.number().positive().optional(),
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
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await menuService.getMenuItemById(id)

    if (!item) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('Error fetching menu item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateItemSchema.parse(body)

    const item = await menuService.updateMenuItem(id, data as Partial<CreateMenuItemInput>)

    return NextResponse.json({ success: true, item })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await menuService.deleteMenuItem(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    )
  }
}

