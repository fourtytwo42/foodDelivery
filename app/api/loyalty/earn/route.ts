import { NextRequest, NextResponse } from 'next/server'
import { loyaltyService } from '@/services/loyalty-service'
import { z } from 'zod'

const earnPointsSchema = z.object({
  userId: z.string().min(1),
  orderId: z.string().min(1),
  orderTotal: z.number().positive(),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = earnPointsSchema.parse(body)

    const result = await loyaltyService.earnPoints(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to earn points' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      account: result.account,
      pointsEarned: result.pointsEarned,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error earning points:', error)
    return NextResponse.json(
      { error: 'Failed to earn points' },
      { status: 500 }
    )
  }
}

