import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/services/analytics-service'
import { z } from 'zod'

const schema = z.object({
  type: z.enum(['sales', 'orders', 'items', 'gift-cards']),
  format: z.enum(['csv', 'pdf']),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = schema.parse({
      type: searchParams.get('type'),
      format: searchParams.get('format'),
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    })

    const report = await analyticsService.exportReport(query)
    return new NextResponse(report.content, {
      status: 200,
      headers: {
        'Content-Type': report.mime,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Analytics export error:', error)
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 })
  }
}


