'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface MenuItem {
  id: string
  name: string
  price: number
  categoryId: string
}

interface MenuCategory {
  id: string
  name: string
}

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

export function QuickOrder({ onOrderCreated }: { onOrderCreated: () => void }) {
  const router = useRouter()
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>('PICKUP')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchItems()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/menu/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/menu/items')
      const data = await response.json()
      if (data.success) {
        setItems(data.items)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id)
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId))
  }

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId)
      return
    }
    setCart((prev) =>
      prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i))
    )
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }

    if (!customerName.trim()) {
      alert('Customer name is required')
      return
    }

    setLoading(true)
    try {
      const orderData = {
        type: orderType,
        customerName: customerName.trim(),
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          modifiers: [],
        })),
        tip: 0,
        discount: 0,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Clear cart and form
        setCart([])
        setCustomerName('')
        onOrderCreated()
      } else {
        alert(data.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = selectedCategory
    ? items.filter((item) => item.categoryId === selectedCategory)
    : items

  return (
    <div className="h-full flex gap-4 p-4">
      {/* Menu Section */}
      <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Menu</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg ${
                selectedCategory === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg text-left transition-colors border border-gray-200"
              >
                <div className="font-semibold mb-1">{item.name}</div>
                <div className="text-indigo-600 font-bold">
                  ${item.price.toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white rounded-lg shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold mb-4">Order Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderType('PICKUP')}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    orderType === 'PICKUP'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Pickup
                </button>
                <button
                  onClick={() => setOrderType('DELIVERY')}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    orderType === 'DELIVERY'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Delivery
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="font-semibold mb-4">Cart ({cart.length})</h3>
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Cart is empty</p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">
                      ${item.price.toFixed(2)} x {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.menuItemId)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between mb-4 text-lg">
            <span className="font-semibold">Subtotal:</span>
            <span className="font-bold">${subtotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCreateOrder}
            disabled={loading || cart.length === 0 || !customerName.trim()}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

