import { NextRequest, NextResponse } from 'next/server'
import { deliveryService } from '@/services/delivery-service'
import { z } from 'zod'

const createDeliverySchema = z.object({
  orderId: z.string().min(1),
  deliveryAddress: z.any(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  estimatedPickupTime: z.string().datetime().optional(),
  estimatedDeliveryTime: z.string().datetime().optional(),
  deliveryNotes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createDeliverySchema.parse(body)

    const delivery = await deliveryService.createDelivery({
      orderId: data.orderId,
      deliveryAddress: data.deliveryAddress,
      latitude: data.latitude,
      longitude: data.longitude,
      estimatedPickupTime: data.estimatedPickupTime
        ? new Date(data.estimatedPickupTime)
        : undefined,
      estimatedDeliveryTime: data.estimatedDeliveryTime
        ? new Date(data.estimatedDeliveryTime)
        : undefined,
      deliveryNotes: data.deliveryNotes,
    })

    return NextResponse.json({ success: true, delivery }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating delivery:', error)
    return NextResponse.json(
      { error: 'Failed to create delivery' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId') || undefined
    const status = searchParams.get('status') || undefined
    const orderId = searchParams.get('orderId') || undefined

    const deliveries = await deliveryService.getDeliveries({
      driverId,
      status,
      orderId,
    })

    return NextResponse.json({ success: true, deliveries })
  } catch (error) {
    console.error('Error fetching deliveries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    )
  }
}

