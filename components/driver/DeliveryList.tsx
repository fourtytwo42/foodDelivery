'use client'

import { formatAddress } from '@/lib/location-utils'

interface Delivery {
  id: string
  orderId: string
  status: string
  deliveryAddress: any
  estimatedDeliveryTime?: string
  order: {
    orderNumber: string
    customerName?: string
    total: number | string
  }
}

interface DeliveryListProps {
  deliveries: Delivery[]
  onSelectDelivery: (delivery: Delivery) => void
}

export function DeliveryList({ deliveries, onSelectDelivery }: DeliveryListProps) {
  const activeDeliveries = deliveries.filter(
    (d) => !['DELIVERED', 'FAILED'].includes(d.status)
  )

  if (activeDeliveries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No active deliveries</p>
        <p className="text-gray-500 text-sm mt-2">Check back soon for new deliveries</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800'
      case 'ACCEPTED':
        return 'bg-indigo-100 text-indigo-800'
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Deliveries</h2>
      {activeDeliveries.map((delivery) => (
        <div
          key={delivery.id}
          onClick={() => onSelectDelivery(delivery)}
          className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow active:bg-gray-50"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                Order #{delivery.order.orderNumber}
              </h3>
              {delivery.order.customerName && (
                <p className="text-sm text-gray-600">{delivery.order.customerName}</p>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                delivery.status
              )}`}
            >
              {delivery.status.replace('_', ' ')}
            </span>
          </div>

          <div className="mt-2 text-sm text-gray-600">
            <p>{formatAddress(delivery.deliveryAddress)}</p>
            <p className="mt-1 font-semibold text-gray-900">
              ${typeof delivery.order.total === 'string'
                ? parseFloat(delivery.order.total).toFixed(2)
                : delivery.order.total.toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

