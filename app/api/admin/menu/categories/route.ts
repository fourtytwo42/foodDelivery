import { NextRequest, NextResponse } from 'next/server'
import { menuService, CreateCategoryInput } from '@/services/menu-service'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const categories = await menuService.getCategories(includeInactive)

    return NextResponse.json({ success: true, categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createCategorySchema.parse(body)

    const category = await menuService.createCategory(data as CreateCategoryInput)

    return NextResponse.json({ success: true, category }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}

