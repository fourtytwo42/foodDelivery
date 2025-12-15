'use client'

import { useState } from 'react'
import { OrderList } from '@/components/pos/OrderList'
import { QuickOrder } from '@/components/pos/QuickOrder'

export default function POSPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'quick-order'>('orders')

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'orders'
                  ? 'bg-white text-indigo-600'
                  : 'bg-indigo-700 text-white hover:bg-indigo-800'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('quick-order')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'quick-order'
                  ? 'bg-white text-indigo-600'
                  : 'bg-indigo-700 text-white hover:bg-indigo-800'
              }`}
            >
              Quick Order
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'orders' ? (
          <OrderList />
        ) : (
          <QuickOrder onOrderCreated={() => setActiveTab('orders')} />
        )}
      </main>
    </div>
  )
}

