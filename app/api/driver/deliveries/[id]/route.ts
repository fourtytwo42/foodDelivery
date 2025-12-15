import { NextRequest, NextResponse } from 'next/server'
import { deliveryService } from '@/services/delivery-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const delivery = await deliveryService.getDeliveryById(id)

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, delivery })
  } catch (error) {
    console.error('Error fetching delivery:', error)
    return NextResponse.json(
      { error: 'Failed to fetch delivery' },
      { status: 500 }
    )
  }
}

