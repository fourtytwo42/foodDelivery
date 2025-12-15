import { NextRequest, NextResponse } from 'next/server'
import { giftCardService } from '@/services/gift-card-service'
import { z } from 'zod'

const createGiftCardSchema = z.object({
  code: z.string().optional(),
  pin: z.string().optional(),
  originalBalance: z.number().positive(),
  currency: z.string().default('USD'),
  purchasedBy: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

const validateGiftCardSchema = z.object({
  code: z.string().min(1),
  pin: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createGiftCardSchema.parse(body)

    const giftCard = await giftCardService.createGiftCard({
      code: data.code,
      pin: data.pin,
      originalBalance: data.originalBalance,
      currency: data.currency,
      purchasedBy: data.purchasedBy,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    })

    return NextResponse.json({ success: true, giftCard }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating gift card:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create gift card' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
      // Validate gift card
      const data = validateGiftCardSchema.parse({ code })
      const validation = await giftCardService.validateGiftCard(data)

      if (!validation.valid) {
        return NextResponse.json(
          { valid: false, error: validation.error },
          { status: 400 }
        )
      }

      return NextResponse.json({ valid: true, giftCard: validation.giftCard })
    }

    // Check balance (public endpoint)
    const balanceCode = searchParams.get('balance')
    if (balanceCode) {
      const balance = await giftCardService.checkBalance(balanceCode)
      if (!balance) {
        return NextResponse.json(
          { error: 'Gift card not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, balance })
    }

    return NextResponse.json(
      { error: 'Code or balance parameter required' },
      { status: 400 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching gift card:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gift card' },
      { status: 500 }
    )
  }
}

