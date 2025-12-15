import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/services/analytics-service'
import { z } from 'zod'

const schema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = schema.parse({
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      limit: searchParams.get('limit') || undefined,
    })

    const data = await analyticsService.getPopularItems(query)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Analytics popular items error:', error)
    return NextResponse.json({ error: 'Failed to fetch popular items' }, { status: 500 })
  }
}


