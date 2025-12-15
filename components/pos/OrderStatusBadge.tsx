'use client'

interface OrderStatusBadgeProps {
  status: string
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'PREPARING':
        return 'bg-purple-100 text-purple-800'
      case 'READY':
        return 'bg-green-100 text-green-800'
      case 'OUT_FOR_DELIVERY':
        return 'bg-indigo-100 text-indigo-800'
      case 'DELIVERED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(status)}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

