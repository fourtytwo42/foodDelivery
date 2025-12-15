import { NextRequest, NextResponse } from 'next/server'
import { menuService, CreateCategoryInput } from '@/services/menu-service'
import { z } from 'zod'

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
  order: z.number().int().optional(),
  availableTimes: z
    .array(
      z.object({
        start: z.string(),
        end: z.string(),
      })
    )
    .optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const category = await menuService.getCategoryById(id)

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
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
    const data = updateCategorySchema.parse(body)

    const category = await menuService.updateCategory(
      id,
      data as Partial<CreateCategoryInput>
    )

    return NextResponse.json({ success: true, category })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
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
    await menuService.deleteCategory(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}

