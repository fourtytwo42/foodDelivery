import { NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services/order-service'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ]),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateStatusSchema.parse(body)

    const order = await orderService.updateOrderStatus(id, data.status)

    return NextResponse.json({ success: true, order })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}

