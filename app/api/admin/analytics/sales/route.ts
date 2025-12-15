import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/services/analytics-service'
import { z } from 'zod'

const salesQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = salesQuerySchema.parse({
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      groupBy: (searchParams.get('groupBy') as 'day' | 'week' | 'month') || undefined,
    })

    const data = await analyticsService.getSalesAnalytics(query)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Analytics sales error:', error)
    return NextResponse.json({ error: 'Failed to fetch sales analytics' }, { status: 500 })
  }
}


