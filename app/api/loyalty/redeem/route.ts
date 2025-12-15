import { NextRequest, NextResponse } from 'next/server'
import { loyaltyService } from '@/services/loyalty-service'
import { z } from 'zod'

const redeemPointsSchema = z.object({
  userId: z.string().min(1),
  points: z.number().int().positive(),
  orderId: z.string().optional(),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = redeemPointsSchema.parse(body)

    const result = await loyaltyService.redeemPoints(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to redeem points' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      account: result.account,
      discountAmount: result.discountAmount,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error redeeming points:', error)
    return NextResponse.json(
      { error: 'Failed to redeem points' },
      { status: 500 }
    )
  }
}

