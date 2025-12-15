import { NextRequest, NextResponse } from 'next/server'
import { menuService, CreateModifierInput } from '@/services/menu-service'
import { z } from 'zod'

const createModifierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT', 'NUMBER']),
  required: z.boolean().optional(),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
  options: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().min(0),
        order: z.number().int().optional(),
      })
    )
    .optional(),
})

export async function GET() {
  try {
    const modifiers = await menuService.getModifiers()

    return NextResponse.json({ success: true, modifiers })
  } catch (error) {
    console.error('Error fetching modifiers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch modifiers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createModifierSchema.parse(body)

    const modifier = await menuService.createModifier(data as CreateModifierInput)

    return NextResponse.json({ success: true, modifier }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating modifier:', error)
    return NextResponse.json(
      { error: 'Failed to create modifier' },
      { status: 500 }
    )
  }
}

