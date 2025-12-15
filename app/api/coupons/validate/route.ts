import { NextRequest, NextResponse } from 'next/server'
import { couponService } from '@/services/coupon-service'
import { z } from 'zod'

const validateCouponSchema = z.object({
  couponCode: z.string().min(1),
  orderSubtotal: z.number().min(0),
  userId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = validateCouponSchema.parse(body)

    const validation = await couponService.validateCoupon(data)

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, error: validation.error },
        { status: 400 }
      )
    }

    // Calculate discount amount
    const discount = couponService.calculateDiscount(validation.coupon, data.orderSubtotal)

    return NextResponse.json({
      valid: true,
      coupon: validation.coupon,
      discount,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    )
  }
}

