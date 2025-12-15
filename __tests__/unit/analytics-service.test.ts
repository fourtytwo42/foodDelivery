import { analyticsService } from '@/services/analytics-service'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findMany: jest.fn() },
    orderItem: { findMany: jest.fn() },
    delivery: { findMany: jest.fn() },
  },
}))

describe('analyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSalesAnalytics', () => {
    it('calculates totals and byPeriod', async () => {
      const now = new Date('2025-01-01T12:00:00Z')
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([
        { total: 20, placedAt: now, paymentMethod: 'CASH', type: 'DELIVERY' },
        { total: 30, placedAt: new Date('2025-01-02T12:00:00Z'), paymentMethod: 'CASH', type: 'PICKUP' },
      ])

      const result = await analyticsService.getSalesAnalytics({ groupBy: 'day' })
      expect(result.totalSales).toBe(50)
      expect(result.totalOrders).toBe(2)
      expect(result.averageOrderValue).toBe(25)
      expect(result.byPeriod).toHaveLength(2)
    })

    it('handles empty orders', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([])
      const result = await analyticsService.getSalesAnalytics({ groupBy: 'month' })
      expect(result.totalSales).toBe(0)
      expect(result.totalOrders).toBe(0)
      expect(result.byPeriod).toEqual([])
    })

    it('supports week grouping', async () => {
      const wed = new Date('2025-01-08T12:00:00Z') // Wednesday
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([
        { total: 10, placedAt: wed, paymentMethod: 'CASH', type: 'DELIVERY' },
      ])

      const result = await analyticsService.getSalesAnalytics({ groupBy: 'week' })
      expect(result.byPeriod[0].period).toBe('2025-01-06') // Monday of that week
    })

    it('ignores invalid date filters', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([])
      await analyticsService.getSalesAnalytics({ dateFrom: 'not-a-date', dateTo: 'also-bad' })
      expect(prisma.order.findMany).toHaveBeenCalled()
    })
  })

  describe('getPopularItems', () => {
    it('aggregates items and applies limit', async () => {
      ;(prisma.orderItem.findMany as jest.Mock).mockResolvedValue([
        { menuItemId: 'm1', name: 'Item 1', price: 10, quantity: 2 },
        { menuItemId: 'm1', name: 'Item 1', price: 10, quantity: 1 },
        { menuItemId: 'm2', name: 'Item 2', price: 5, quantity: 5 },
      ])

      const result = await analyticsService.getPopularItems({ limit: 1 })
      expect(result).toHaveLength(1)
      expect(result[0].menuItemId).toBe('m2') // highest qty
      expect(result[0].revenue).toBe(25)
    })

    it('returns empty when no items', async () => {
      ;(prisma.orderItem.findMany as jest.Mock).mockResolvedValue([])
      const result = await analyticsService.getPopularItems({})
      expect(result).toEqual([])
    })
  })

  describe('getDeliveryMetrics', () => {
    it('computes averages and rates', async () => {
      const created = new Date('2025-01-01T10:00:00Z')
      const delivered = new Date('2025-01-01T10:30:00Z')
      ;(prisma.delivery.findMany as jest.Mock).mockResolvedValue([
        { createdAt: created, actualDeliveryTime: delivered, distance: 5, status: 'DELIVERED' },
        { createdAt: created, actualDeliveryTime: null, distance: null, status: 'PENDING' },
      ])

      const result = await analyticsService.getDeliveryMetrics({})
      expect(result.totalDeliveries).toBe(2)
      expect(result.avgDeliveryTime).toBeCloseTo(30) // minutes
      expect(result.avgDistance).toBeCloseTo(2.5)
      expect(result.onTimeRate).toBeCloseTo(0.5)
    })

    it('handles no deliveries', async () => {
      ;(prisma.delivery.findMany as jest.Mock).mockResolvedValue([])
      const result = await analyticsService.getDeliveryMetrics({})
      expect(result.totalDeliveries).toBe(0)
      expect(result.avgDeliveryTime).toBe(0)
      expect(result.onTimeRate).toBe(0)
    })

    it('handles missing distance values', async () => {
      const created = new Date('2025-01-01T10:00:00Z')
      ;(prisma.delivery.findMany as jest.Mock).mockResolvedValue([
        { createdAt: created, actualDeliveryTime: created, distance: null, status: 'DELIVERED' },
      ])

      const result = await analyticsService.getDeliveryMetrics({})
      expect(result.avgDistance).toBe(0)
    })
  })

  describe('exportReport', () => {
    it('exports sales csv', async () => {
      jest.spyOn(analyticsService, 'getSalesAnalytics').mockResolvedValue({
        totalSales: 100,
        totalOrders: 4,
        averageOrderValue: 25,
        byPeriod: [],
      })

      const report = await analyticsService.exportReport({
        type: 'sales',
        format: 'csv',
      })

      expect(report.content).toContain('totalSales')
      expect(report.mime).toBe('text/csv')
    })

    it('exports items csv', async () => {
      jest.spyOn(analyticsService, 'getPopularItems').mockResolvedValue([
        { menuItemId: 'm1', name: 'Item 1', quantitySold: 2, revenue: 20 },
      ])

      const report = await analyticsService.exportReport({
        type: 'items',
        format: 'csv',
      })

      expect(report.content).toContain('Item 1')
    })

    it('returns stub for pdf', async () => {
      const report = await analyticsService.exportReport({
        type: 'sales',
        format: 'pdf',
      })
      expect(report.mime).toBe('text/plain')
    })

    it('returns fallback for unsupported type', async () => {
      const report = await analyticsService.exportReport({
        type: 'orders',
        format: 'csv',
      })
      expect(report.content).toContain('orders')
    })
  })
})


