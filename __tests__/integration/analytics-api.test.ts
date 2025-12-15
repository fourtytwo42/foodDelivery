/**
 * @jest-environment node
 */
import { GET as getSales } from '@/app/api/admin/analytics/sales/route'
import { GET as getPopular } from '@/app/api/admin/analytics/popular-items/route'
import { GET as getDelivery } from '@/app/api/admin/analytics/delivery/route'
import { GET as exportReport } from '@/app/api/admin/analytics/export/route'
import { analyticsService } from '@/services/analytics-service'
import { NextRequest } from 'next/server'

jest.mock('@/services/analytics-service', () => ({
  analyticsService: {
    getSalesAnalytics: jest.fn(),
    getPopularItems: jest.fn(),
    getDeliveryMetrics: jest.fn(),
    exportReport: jest.fn(),
  },
}))

const createMockRequest = (url: string) => {
  const urlObj = new URL(url)
  return {
    url,
    method: 'GET',
    nextUrl: urlObj,
    headers: new Headers(),
  } as unknown as NextRequest
}

describe('Analytics API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns sales analytics', async () => {
    ;(analyticsService.getSalesAnalytics as jest.Mock).mockResolvedValue({
      totalSales: 100,
      totalOrders: 4,
      averageOrderValue: 25,
      byPeriod: [],
    })

    const res = await getSales(createMockRequest('http://localhost:3000/api/admin/analytics/sales'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(analyticsService.getSalesAnalytics).toHaveBeenCalled()
  })

  it('validates sales query', async () => {
    const res = await getSales(
      createMockRequest('http://localhost:3000/api/admin/analytics/sales?groupBy=year')
    )
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBe('Validation error')
  })

  it('returns popular items', async () => {
    ;(analyticsService.getPopularItems as jest.Mock).mockResolvedValue([])
    const res = await getPopular(
      createMockRequest('http://localhost:3000/api/admin/analytics/popular-items?limit=5')
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(analyticsService.getPopularItems).toHaveBeenCalledWith({
      dateFrom: undefined,
      dateTo: undefined,
      limit: 5,
    })
  })

  it('validates popular items query', async () => {
    const res = await getPopular(
      createMockRequest('http://localhost:3000/api/admin/analytics/popular-items?limit=-1')
    )
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBe('Validation error')
  })

  it('returns delivery metrics', async () => {
    ;(analyticsService.getDeliveryMetrics as jest.Mock).mockResolvedValue({ totalDeliveries: 0 })
    const res = await getDelivery(createMockRequest('http://localhost:3000/api/admin/analytics/delivery'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('exports csv report', async () => {
    ;(analyticsService.exportReport as jest.Mock).mockResolvedValue({
      content: 'metric,value',
      mime: 'text/csv',
    })

    const res = await exportReport(
      createMockRequest('http://localhost:3000/api/admin/analytics/export?type=sales&format=csv')
    )

    expect(res.status).toBe(200)
    expect(analyticsService.exportReport).toHaveBeenCalled()
  })

  it('validates export params', async () => {
    const res = await exportReport(
      createMockRequest('http://localhost:3000/api/admin/analytics/export?type=unknown&format=csv')
    )
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBe('Validation error')
  })
})


