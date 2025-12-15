import { NextRequest, NextResponse } from 'next/server'
import { couponService } from '@/services/coupon-service'
import { z } from 'zod'

const createCouponSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED', 'BUY_X_GET_Y', 'FREE_SHIPPING']),
  discountValue: z.number().positive().optional(),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  buyXGetY: z
    .object({
      buyQuantity: z.number().int().positive(),
      getQuantity: z.number().int().positive(),
      getItemId: z.string().optional(),
    })
    .optional(),
  usageLimit: z.number().int().positive().optional(),
  usageLimitPerUser: z.number().int().positive().optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  createdBy: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createCouponSchema.parse(body)

    const coupon = await couponService.createCoupon({
      ...data,
      validFrom: new Date(data.validFrom),
      validUntil: new Date(data.validUntil),
    })

    return NextResponse.json({ success: true, coupon }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating coupon:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create coupon' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const active = searchParams.get('active') === 'true'

    const coupons = await couponService.getCoupons({
      status,
      active: active || undefined,
    })

    return NextResponse.json({ success: true, coupons })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}

