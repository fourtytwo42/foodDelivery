import { NextRequest, NextResponse } from 'next/server'
import { deliveryService } from '@/services/delivery-service'
import { z } from 'zod'

const acceptDeliverySchema = z.object({
  driverId: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { driverId } = acceptDeliverySchema.parse(body)

    const delivery = await deliveryService.acceptDelivery(id, driverId)

    return NextResponse.json({ success: true, delivery })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message === 'Delivery not found') {
        return NextResponse.json(
          { error: 'Delivery not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('not assigned')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }

    console.error('Error accepting delivery:', error)
    return NextResponse.json(
      { error: 'Failed to accept delivery' },
      { status: 500 }
    )
  }
}

