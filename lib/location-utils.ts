/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 100) / 100 // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Get Google Maps navigation URL
 */
export function getGoogleMapsUrl(
  latitude: number,
  longitude: number,
  label?: string
): string {
  const query = encodeURIComponent(
    label || `${latitude},${longitude}`
  )
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${query}`
}

/**
 * Get Apple Maps navigation URL
 */
export function getAppleMapsUrl(
  latitude: number,
  longitude: number,
  label?: string
): string {
  return `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`
}

/**
 * Detect if device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Get appropriate map URL based on device
 */
export function getMapUrl(
  latitude: number,
  longitude: number,
  label?: string
): string {
  if (isIOS()) {
    return getAppleMapsUrl(latitude, longitude, label)
  }
  return getGoogleMapsUrl(latitude, longitude, label)
}

/**
 * Calculate estimated delivery time in minutes
 * Assumes average driving speed of 25 mph in city
 */
export function calculateEstimatedDeliveryTime(
  distanceInMiles: number,
  averageSpeedMph: number = 25
): number {
  return Math.round((distanceInMiles / averageSpeedMph) * 60)
}

/**
 * Format address for display
 */
export function formatAddress(address: any): string {
  if (!address) return ''
  
  if (typeof address === 'string') {
    return address
  }

  const parts: string[] = []
  if (address.street) parts.push(address.street)
  if (address.city) parts.push(address.city)
  if (address.state) parts.push(address.state)
  if (address.zipCode) parts.push(address.zipCode)

  return parts.join(', ')
}

