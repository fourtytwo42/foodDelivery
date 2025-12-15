import { NextRequest, NextResponse } from 'next/server'
import { giftCardService } from '@/services/gift-card-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const giftCard = await giftCardService.getGiftCardById(id)

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, giftCard })
  } catch (error) {
    console.error('Error fetching gift card:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gift card' },
      { status: 500 }
    )
  }
}

