'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart-store'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const checkoutSchema = z
  .object({
    type: z.enum(['DELIVERY', 'PICKUP']),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    specialInstructions: z.string().optional(),
    deliveryInstructions: z.string().optional(),
    tip: z.number().min(0).default(0),
  })
  .refine(
    (data) => {
      if (data.type === 'DELIVERY') {
        return (
          data.street &&
          data.city &&
          data.state &&
          data.zipCode &&
          data.street.length > 0 &&
          data.city.length > 0 &&
          data.state.length > 0 &&
          data.zipCode.length > 0
        )
      }
      return true
    },
    {
      message: 'Delivery address is required for delivery orders',
      path: ['street'],
    }
  )

type CheckoutFormData = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart, getSubtotal, getTotalWithTaxAndFees } =
    useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [taxRate, setTaxRate] = useState(0.0825)
  const [deliveryFee, setDeliveryFee] = useState(3.99)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      type: 'DELIVERY',
      tip: 0,
    },
  })

  const orderType = watch('type')

  useEffect(() => {
    // Fetch restaurant settings for tax rate and delivery fee
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setTaxRate(Number(data.settings.taxRate) || 0.0825)
          // Delivery fee calculation would be enhanced based on distance/zones
          setDeliveryFee(data.settings.type === 'DELIVERY' ? 3.99 : 0)
        }
      })
      .catch(() => {
        // Use defaults if settings fetch fails
      })
  }, [])

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <a
            href="/menu"
            className="text-indigo-600 hover:text-indigo-700 underline"
          >
            Continue shopping
          </a>
        </div>
      </div>
    )
  }

  const subtotal = getSubtotal()
  const tax = subtotal * taxRate
  const total = subtotal + tax + (orderType === 'DELIVERY' ? deliveryFee : 0)

  const onSubmit = async (data: CheckoutFormData) => {
    setLoading(true)
    setError(null)

    try {
      const orderData = {
        type: data.type,
        customerName: `${data.firstName} ${data.lastName}`,
        customerEmail: data.email,
        customerPhone: data.phone,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          modifiers: item.modifiers.map((mod) => ({
            modifierId: mod.modifierId,
            modifierName: mod.modifierName,
            optionId: mod.optionId,
            optionName: mod.optionName,
            price: mod.price,
          })),
          specialInstructions: item.specialInstructions,
        })),
        deliveryAddress:
          data.type === 'DELIVERY' && data.street
            ? {
                street: data.street!,
                city: data.city!,
                state: data.state!,
                zipCode: data.zipCode!,
                country: 'US',
              }
            : undefined,
        specialInstructions: data.specialInstructions,
        deliveryInstructions: data.deliveryInstructions,
        tip: data.tip || 0,
        discount: 0,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order')
      }

      // Clear cart and redirect to confirmation
      clearCart()
      router.push(`/order/${result.order.id}/confirmation`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Order Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="DELIVERY"
                      {...register('type')}
                      className="mr-2"
                    />
                    Delivery
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="PICKUP"
                      {...register('type')}
                      className="mr-2"
                    />
                    Pickup
                  </label>
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    {...register('firstName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.firstName && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    {...register('lastName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.lastName && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Delivery Address */}
              {orderType === 'DELIVERY' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Delivery Address</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      {...register('street')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        {...register('city')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        {...register('state')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      {...register('zipCode')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions
                </label>
                <textarea
                  {...register('specialInstructions')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Any special instructions for your order..."
                />
              </div>

              {orderType === 'DELIVERY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Instructions
                  </label>
                  <textarea
                    {...register('deliveryInstructions')}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Door code, building instructions, etc."
                  />
                </div>
              )}

              {/* Tip */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tip
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('tip', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:bg-gray-400"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span>
                      $
                      {(
                        item.price * item.quantity +
                        item.modifiers.reduce(
                          (sum, mod) => sum + mod.price * item.quantity,
                          0
                        )
                      ).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {orderType === 'DELIVERY' && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

