import { NextRequest, NextResponse } from 'next/server'
import { deliveryService } from '@/services/delivery-service'
import { z } from 'zod'

const markDeliveredSchema = z.object({
  driverId: z.string().min(1),
  driverNotes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { driverId, driverNotes } = markDeliveredSchema.parse(body)

    const delivery = await deliveryService.markDelivered(id, driverId, driverNotes)

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

    console.error('Error marking delivery as delivered:', error)
    return NextResponse.json(
      { error: 'Failed to mark delivery as delivered' },
      { status: 500 }
    )
  }
}

