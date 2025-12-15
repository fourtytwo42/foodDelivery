import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/services/analytics-service'
import { z } from 'zod'

const schema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = schema.parse({
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    })

    const data = await analyticsService.getDeliveryMetrics(query)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Analytics delivery error:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery analytics' }, { status: 500 })
  }
}


