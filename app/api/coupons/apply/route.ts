import { NextRequest, NextResponse } from 'next/server'
import { couponService } from '@/services/coupon-service'
import { z } from 'zod'

const applyCouponSchema = z.object({
  couponCode: z.string().min(1),
  orderSubtotal: z.number().min(0),
  orderItems: z.array(
    z.object({
      menuItemId: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    })
  ),
  userId: z.string().optional(),
  deliveryFee: z.number().min(0).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = applyCouponSchema.parse(body)

    const result = await couponService.applyCoupon(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to apply coupon' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      discount: result.discount,
      coupon: result.coupon,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error applying coupon:', error)
    return NextResponse.json(
      { error: 'Failed to apply coupon' },
      { status: 500 }
    )
  }
}

