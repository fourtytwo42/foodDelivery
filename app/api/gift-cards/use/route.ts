import { NextRequest, NextResponse } from 'next/server'
import { giftCardService } from '@/services/gift-card-service'
import { z } from 'zod'

const useGiftCardSchema = z.object({
  giftCardId: z.string().min(1),
  orderId: z.string().optional(),
  amount: z.number().positive(),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = useGiftCardSchema.parse(body)

    const result = await giftCardService.useGiftCard(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to use gift card' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, giftCard: result.giftCard })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error using gift card:', error)
    return NextResponse.json(
      { error: 'Failed to use gift card' },
      { status: 500 }
    )
  }
}

