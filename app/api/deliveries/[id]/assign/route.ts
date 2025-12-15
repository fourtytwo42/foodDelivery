import { NextRequest, NextResponse } from 'next/server'
import { deliveryService } from '@/services/delivery-service'
import { z } from 'zod'

const assignDeliverySchema = z.object({
  driverId: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { driverId } = assignDeliverySchema.parse(body)

    const delivery = await deliveryService.assignDelivery(id, driverId)

    return NextResponse.json({ success: true, delivery })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error assigning delivery:', error)
    return NextResponse.json(
      { error: 'Failed to assign delivery' },
      { status: 500 }
    )
  }
}

