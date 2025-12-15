'use client'

import { useEffect, useState } from 'react'
import { OrderStatusBadge } from '@/components/pos/OrderStatusBadge'

interface Order {
  id: string
  orderNumber: string
  status: string
  type: string
  total: number | string
  customerName?: string | null
  items: Array<{
    id: string
    name: string
    quantity: number
  }>
  placedAt: string
}

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
    // Refresh orders every 5 seconds for real-time updates
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/orders?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchOrders()
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null)
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter)

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PREPARING', label: 'Preparing' },
    { value: 'READY', label: 'Ready' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ]

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600 text-lg">Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex gap-4 p-4">
      {/* Order List */}
      <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Orders</h2>
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === option.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600">No orders found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedOrder?.id === order.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-lg">{order.orderNumber}</span>
                      {order.customerName && (
                        <span className="ml-3 text-gray-600">{order.customerName}</span>
                      )}
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{order.type}</span>
                    <span className="font-semibold text-gray-900">
                      ${typeof order.total === 'string' ? parseFloat(order.total).toFixed(2) : order.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details */}
      {selectedOrder && (
        <div className="w-96 bg-white rounded-lg shadow-lg p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">{selectedOrder.orderNumber}</h3>
            <button
              onClick={() => setSelectedOrder(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mb-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>

              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-medium">{selectedOrder.type}</p>
              </div>

              {selectedOrder.customerName && (
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-2">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold">
                  ${typeof selectedOrder.total === 'string' ? parseFloat(selectedOrder.total).toFixed(2) : selectedOrder.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 border-t pt-4">
            <button
              onClick={() => window.open(`/api/orders/${selectedOrder.id}/receipt`, '_blank')}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors mb-4"
            >
              Print Receipt
            </button>

            {/* Status Update Buttons */}
            <div>
              <p className="text-sm font-semibold mb-2">Update Status</p>
            {selectedOrder.status === 'PENDING' && (
              <button
                onClick={() => handleStatusUpdate(selectedOrder.id, 'CONFIRMED')}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirm Order
              </button>
            )}
            {selectedOrder.status === 'CONFIRMED' && (
              <button
                onClick={() => handleStatusUpdate(selectedOrder.id, 'PREPARING')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Preparing
              </button>
            )}
            {selectedOrder.status === 'PREPARING' && (
              <button
                onClick={() => handleStatusUpdate(selectedOrder.id, 'READY')}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Mark as Ready
              </button>
            )}
            {selectedOrder.status === 'READY' && selectedOrder.type === 'PICKUP' && (
              <button
                onClick={() => handleStatusUpdate(selectedOrder.id, 'DELIVERED')}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Mark as Picked Up
              </button>
            )}
            {selectedOrder.status === 'READY' && selectedOrder.type === 'DELIVERY' && (
              <button
                onClick={() => handleStatusUpdate(selectedOrder.id, 'OUT_FOR_DELIVERY')}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Out for Delivery
              </button>
            )}
            {selectedOrder.status === 'OUT_FOR_DELIVERY' && (
              <button
                onClick={() => handleStatusUpdate(selectedOrder.id, 'DELIVERED')}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark as Delivered
              </button>
            )}
            {['PENDING', 'CONFIRMED', 'PREPARING'].includes(selectedOrder.status) && (
              <button
                onClick={() => handleStatusUpdate(selectedOrder.id, 'CANCELLED')}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Order
              </button>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

