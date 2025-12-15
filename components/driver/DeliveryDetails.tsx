'use client'

import { useState } from 'react'
import { formatAddress, getMapUrl, calculateDistance } from '@/lib/location-utils'
import { MapPin, ArrowLeft, CheckCircle, Package, Navigation } from 'lucide-react'

interface Delivery {
  id: string
  orderId: string
  status: string
  deliveryAddress: any
  latitude?: number
  longitude?: number
  driverLatitude?: number
  driverLongitude?: number
  order: {
    orderNumber: string
    customerName?: string
    customerPhone?: string
    total: number | string
    items: Array<{
      name: string
      quantity: number
      price: number | string
    }>
  }
}

interface DeliveryDetailsProps {
  delivery: Delivery
  onBack: () => void
  onAccept: (deliveryId: string) => Promise<void>
  onPickedUp: (deliveryId: string) => Promise<void>
  onDelivered: (deliveryId: string, driverNotes?: string) => Promise<void>
  onUpdateLocation: (deliveryId: string) => Promise<void>
  location: { latitude: number; longitude: number } | null
  locationError: string | null
  requestLocation: () => Promise<any>
}

export function DeliveryDetails({
  delivery,
  onBack,
  onAccept,
  onPickedUp,
  onDelivered,
  onUpdateLocation,
  location,
  locationError,
  requestLocation,
}: DeliveryDetailsProps) {
  const [driverNotes, setDriverNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAccept = async () => {
    setIsProcessing(true)
    try {
      await onAccept(delivery.id)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePickedUp = async () => {
    setIsProcessing(true)
    try {
      await onPickedUp(delivery.id)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelivered = async () => {
    setIsProcessing(true)
    try {
      await onDelivered(delivery.id, driverNotes || undefined)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNavigate = () => {
    if (delivery.latitude && delivery.longitude) {
      const url = getMapUrl(
        delivery.latitude,
        delivery.longitude,
        formatAddress(delivery.deliveryAddress)
      )
      window.open(url, '_blank')
    }
  }

  const handleUpdateLocationClick = async () => {
    if (!location) {
      await requestLocation()
    }
    if (location) {
      await onUpdateLocation(delivery.id)
    }
  }

  const distance =
    location && delivery.latitude && delivery.longitude
      ? calculateDistance(
          location.latitude,
          location.longitude,
          delivery.latitude,
          delivery.longitude
        )
      : null

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center text-indigo-600 font-medium mb-4 active:opacity-70"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to List
      </button>

      {/* Order Info */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Order #{delivery.order.orderNumber}
        </h2>

        <div className="space-y-3">
          {delivery.order.customerName && (
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-semibold">{delivery.order.customerName}</p>
              {delivery.order.customerPhone && (
                <a
                  href={`tel:${delivery.order.customerPhone}`}
                  className="text-indigo-600 text-sm"
                >
                  {delivery.order.customerPhone}
                </a>
              )}
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600">Delivery Address</p>
            <p className="font-semibold">{formatAddress(delivery.deliveryAddress)}</p>
          </div>

          {distance !== null && (
            <div>
              <p className="text-sm text-gray-600">Distance</p>
              <p className="font-semibold">{distance} miles</p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="font-semibold text-lg">
              ${typeof delivery.order.total === 'string'
                ? parseFloat(delivery.order.total).toFixed(2)
                : delivery.order.total.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
        <div className="space-y-2">
          {delivery.order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span className="font-semibold">
                ${typeof item.price === 'string'
                  ? parseFloat(item.price).toFixed(2)
                  : item.price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Navigate Button */}
        {delivery.latitude && delivery.longitude && (
          <button
            onClick={handleNavigate}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            <Navigation className="w-5 h-5 mr-2" />
            Open in Maps
          </button>
        )}

        {/* Update Location Button */}
        <button
          onClick={handleUpdateLocationClick}
          disabled={isProcessing || !!locationError}
          className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-700 transition-colors"
        >
          {locationError ? 'Location Permission Needed' : 'Update My Location'}
        </button>

        {/* Accept Delivery */}
        {delivery.status === 'ASSIGNED' && (
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 active:bg-green-800 transition-colors"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Accept Delivery
          </button>
        )}

        {/* Mark Picked Up */}
        {delivery.status === 'ACCEPTED' && (
          <button
            onClick={handlePickedUp}
            disabled={isProcessing}
            className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 active:bg-purple-800 transition-colors"
          >
            <Package className="w-5 h-5 mr-2" />
            Mark as Picked Up
          </button>
        )}

        {/* Mark Delivered */}
        {(delivery.status === 'IN_TRANSIT' || delivery.status === 'PICKED_UP') && (
          <div className="space-y-3">
            <textarea
              value={driverNotes}
              onChange={(e) => setDriverNotes(e.target.value)}
              placeholder="Delivery notes (optional)"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
            <button
              onClick={handleDelivered}
              disabled={isProcessing}
              className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Mark as Delivered
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

