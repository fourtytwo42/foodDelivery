import { prisma } from '@/lib/prisma'

type DateRange = { dateFrom?: string; dateTo?: string }

function parseDate(input?: string) {
  if (!input) return undefined
  const d = new Date(input)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function dateInRange(date: Date, range: DateRange) {
  const from = parseDate(range.dateFrom)
  const to = parseDate(range.dateTo)
  if (from && date < from) return false
  if (to && date > to) return false
  return true
}

function periodKey(date: Date, groupBy: 'day' | 'week' | 'month') {
  const iso = date.toISOString()
  if (groupBy === 'month') return iso.slice(0, 7) // YYYY-MM
  if (groupBy === 'week') {
    const tmp = new Date(date)
    const day = tmp.getUTCDay()
    const diff = tmp.getUTCDate() - day + (day === 0 ? -6 : 1) // Monday as first day
    tmp.setUTCDate(diff)
    return tmp.toISOString().slice(0, 10)
  }
  return iso.slice(0, 10) // day
}

export const analyticsService = {
  /**
   * Sales analytics (totals and grouped by period)
   */
  async getSalesAnalytics({
    dateFrom,
    dateTo,
    groupBy = 'day',
  }: DateRange & { groupBy?: 'day' | 'week' | 'month' }) {
    const orders = await prisma.order.findMany({
      where: {
        placedAt: {
          gte: parseDate(dateFrom),
          lte: parseDate(dateTo),
        },
      },
      select: {
        total: true,
        placedAt: true,
        paymentMethod: true,
        type: true,
      },
    })

    const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders ? totalSales / totalOrders : 0

    const byPeriod = orders.reduce<Record<string, { sales: number; orders: number }>>((acc, o) => {
      const key = periodKey(o.placedAt, groupBy)
      if (!acc[key]) acc[key] = { sales: 0, orders: 0 }
      acc[key].sales += Number(o.total)
      acc[key].orders += 1
      return acc
    }, {})

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      byPeriod: Object.entries(byPeriod).map(([period, value]) => ({
        period,
        sales: value.sales,
        orders: value.orders,
      })),
    }
  },

  /**
   * Popular items analytics
   */
  async getPopularItems({ dateFrom, dateTo, limit = 10 }: DateRange & { limit?: number }) {
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          placedAt: {
            gte: parseDate(dateFrom),
            lte: parseDate(dateTo),
          },
        },
      },
      select: {
        menuItemId: true,
        name: true,
        price: true,
        quantity: true,
      },
    })

    const aggregated = items.reduce<Record<string, { name: string; quantitySold: number; revenue: number }>>(
      (acc, item) => {
        const key = item.menuItemId
        if (!acc[key]) acc[key] = { name: item.name, quantitySold: 0, revenue: 0 }
        acc[key].quantitySold += item.quantity
        acc[key].revenue += Number(item.price) * item.quantity
        return acc
      },
      {}
    )

    return Object.entries(aggregated)
      .map(([menuItemId, data]) => ({ menuItemId, ...data }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, limit)
  },

  /**
   * Delivery metrics
   */
  async getDeliveryMetrics(range: DateRange) {
    const deliveries = await prisma.delivery.findMany({
      where: {
        createdAt: {
          gte: parseDate(range.dateFrom),
          lte: parseDate(range.dateTo),
        },
      },
      select: {
        createdAt: true,
        actualDeliveryTime: true,
        distance: true,
        status: true,
      },
    })

    const completed = deliveries.filter((d) => d.actualDeliveryTime && d.createdAt)
    const deliveryTimes = completed.map(
      (d) => (d.actualDeliveryTime!.getTime() - d.createdAt.getTime()) / (1000 * 60) // minutes
    )
    const avgDeliveryTime = deliveryTimes.length
      ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
      : 0
    const avgDistance =
      deliveries.length && deliveries.some((d) => d.distance != null)
        ? deliveries.reduce((sum, d) => sum + (d.distance || 0), 0) / deliveries.length
        : 0
    const onTimeRate =
      deliveries.length > 0
        ? completed.length / deliveries.length
        : 0

    return {
      totalDeliveries: deliveries.length,
      avgDeliveryTime,
      avgDistance,
      onTimeRate,
    }
  },

  /**
   * Export report as CSV (PDF stubbed)
   */
  async exportReport({
    type,
    format,
    dateFrom,
    dateTo,
  }: {
    type: 'sales' | 'orders' | 'items' | 'gift-cards'
    format: 'csv' | 'pdf'
    dateFrom?: string
    dateTo?: string
  }) {
    if (format === 'pdf') {
      return { content: 'PDF export not implemented yet', mime: 'text/plain' }
    }

    if (type === 'sales') {
      const sales = await this.getSalesAnalytics({ dateFrom, dateTo })
      const rows = [
        ['metric', 'value'],
        ['totalSales', sales.totalSales.toFixed(2)],
        ['totalOrders', sales.totalOrders],
        ['averageOrderValue', sales.averageOrderValue.toFixed(2)],
      ]
      return { content: rows.map((r) => r.join(',')).join('\n'), mime: 'text/csv' }
    }

    if (type === 'items') {
      const items = await this.getPopularItems({ dateFrom, dateTo })
      const rows = [['menuItemId', 'name', 'quantitySold', 'revenue'], ...items.map((i) => [i.menuItemId, i.name, i.quantitySold, i.revenue.toFixed(2)])]
      return { content: rows.map((r) => r.join(',')).join('\n'), mime: 'text/csv' }
    }

    // Fallback empty CSV
    return { content: 'type,not_implemented\n' + `${type},true`, mime: 'text/csv' }
  },
}


