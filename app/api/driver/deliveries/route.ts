import { NextRequest, NextResponse } from 'next/server'
import { deliveryService } from '@/services/delivery-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId') || undefined
    const status = searchParams.get('status') || undefined

    const deliveries = await deliveryService.getDeliveries({
      driverId,
      status,
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

