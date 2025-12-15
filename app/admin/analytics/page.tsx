import React from 'react'

async function fetchJSON(url: string) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    return null
  }
  return res.json()
}

export default async function AnalyticsPage() {
  const [salesRes, itemsRes, deliveryRes] = await Promise.all([
    fetchJSON(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/analytics/sales`),
    fetchJSON(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/analytics/popular-items?limit=5`),
    fetchJSON(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/analytics/delivery`),
  ])

  const sales = salesRes?.data
  const popularItems = itemsRes?.data || []
  const delivery = deliveryRes?.data

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Sales" value={sales ? `$${sales.totalSales.toFixed(2)}` : '—'} />
        <StatCard title="Total Orders" value={sales ? sales.totalOrders : '—'} />
        <StatCard
          title="Avg Order Value"
          value={sales ? `$${sales.averageOrderValue.toFixed(2)}` : '—'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h2 className="font-medium mb-2">Popular Items</h2>
          <ul className="space-y-1">
            {popularItems.map((item: any) => (
              <li key={item.menuItemId} className="flex justify-between text-sm">
                <span>{item.name}</span>
                <span className="text-gray-600">
                  {item.quantitySold} sold · ${item.revenue.toFixed(2)}
                </span>
              </li>
            ))}
            {popularItems.length === 0 && <p className="text-sm text-gray-500">No data</p>}
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-medium mb-2">Delivery Metrics</h2>
          {delivery ? (
            <ul className="text-sm space-y-1">
              <li>Total deliveries: {delivery.totalDeliveries}</li>
              <li>Avg delivery time: {delivery.avgDeliveryTime.toFixed(1)} min</li>
              <li>Avg distance: {delivery.avgDistance.toFixed(2)} mi</li>
              <li>On-time rate: {(delivery.onTimeRate * 100).toFixed(1)}%</li>
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No data</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  )
}


