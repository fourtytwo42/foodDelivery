'use client'

import { useEffect, useState } from 'react'
import { DeliveryList } from '@/components/driver/DeliveryList'
import { DeliveryDetails } from '@/components/driver/DeliveryDetails'
import { useLocationTracking } from '@/hooks/useLocationTracking'

interface Delivery {
  id: string
  orderId: string
  status: string
  deliveryAddress: any
  latitude?: number
  longitude?: number
  order: {
    orderNumber: string
    customerName?: string
    customerPhone?: string
    total: number
    items: any[]
  }
}

export default function DriverPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [driverId, setDriverId] = useState<string | null>(null)
  const { location, error: locationError, requestLocation } = useLocationTracking()

  useEffect(() => {
    // Get driver ID from user session (simplified - would come from auth)
    // For now, we'll use a query param or localStorage
    const storedDriverId = localStorage.getItem('driverId')
    if (storedDriverId) {
      setDriverId(storedDriverId)
    } else {
      // Prompt for driver ID (in real app, this would come from auth)
      const id = prompt('Enter your driver ID:')
      if (id) {
        setDriverId(id)
        localStorage.setItem('driverId', id)
      }
    }
  }, [])

  useEffect(() => {
    if (driverId) {
      fetchDeliveries()
      const interval = setInterval(fetchDeliveries, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [driverId])

  const fetchDeliveries = async () => {
    if (!driverId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/driver/deliveries?driverId=${driverId}`)
      const data = await response.json()
      if (data.success) {
        setDeliveries(data.deliveries)
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptDelivery = async (deliveryId: string) => {
    if (!driverId) return

    try {
      const response = await fetch(`/api/driver/deliveries/${deliveryId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      })

      const data = await response.json()
      if (data.success) {
        fetchDeliveries()
        if (selectedDelivery?.id === deliveryId) {
          setSelectedDelivery(data.delivery)
        }
      }
    } catch (error) {
      console.error('Error accepting delivery:', error)
      alert('Failed to accept delivery')
    }
  }

  const handlePickedUp = async (deliveryId: string) => {
    if (!driverId) return

    try {
      const response = await fetch(`/api/driver/deliveries/${deliveryId}/picked-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      })

      const data = await response.json()
      if (data.success) {
        fetchDeliveries()
        if (selectedDelivery?.id === deliveryId) {
          setSelectedDelivery(data.delivery)
        }
      }
    } catch (error) {
      console.error('Error marking as picked up:', error)
      alert('Failed to mark as picked up')
    }
  }

  const handleDelivered = async (deliveryId: string, driverNotes?: string) => {
    if (!driverId) return

    try {
      const response = await fetch(`/api/driver/deliveries/${deliveryId}/delivered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, driverNotes }),
      })

      const data = await response.json()
      if (data.success) {
        fetchDeliveries()
        setSelectedDelivery(null)
      }
    } catch (error) {
      console.error('Error marking as delivered:', error)
      alert('Failed to mark as delivered')
    }
  }

  const handleUpdateLocation = async (deliveryId: string) => {
    if (!location) {
      await requestLocation()
      return
    }

    try {
      await fetch(`/api/driver/deliveries/${deliveryId}/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      })
    } catch (error) {
      console.error('Error updating location:', error)
    }
  }

  if (!driverId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">Please enter your driver ID</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile-optimized header */}
      <div className="bg-indigo-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-2xl font-bold">Driver Dashboard</h1>
        {locationError && (
          <p className="text-sm text-yellow-300 mt-1">
            Location permission needed for GPS tracking
          </p>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading deliveries...</p>
          </div>
        ) : (
          <>
            {selectedDelivery ? (
              <DeliveryDetails
                delivery={selectedDelivery}
                onBack={() => setSelectedDelivery(null)}
                onAccept={handleAcceptDelivery}
                onPickedUp={handlePickedUp}
                onDelivered={handleDelivered}
                onUpdateLocation={handleUpdateLocation}
                location={location}
                locationError={locationError}
                requestLocation={requestLocation}
              />
            ) : (
              <DeliveryList
                deliveries={deliveries}
                onSelectDelivery={setSelectedDelivery}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

