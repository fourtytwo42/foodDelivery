import {
  calculateDistance,
  getGoogleMapsUrl,
  getAppleMapsUrl,
  isIOS,
  getMapUrl,
  calculateEstimatedDeliveryTime,
  formatAddress,
} from '@/lib/location-utils'

describe('location-utils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      // Distance between San Francisco and Los Angeles (approximately 347 miles)
      const distance = calculateDistance(37.7749, -122.4194, 34.0522, -118.2437)
      expect(distance).toBeGreaterThan(340)
      expect(distance).toBeLessThan(360)
    })

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(37.7749, -122.4194, 37.7749, -122.4194)
      expect(distance).toBe(0)
    })

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-37.7749, -122.4194, -34.0522, -118.2437)
      expect(distance).toBeGreaterThan(0)
    })

    it('should calculate short distances accurately', () => {
      // Distance of about 1 mile
      const distance = calculateDistance(37.7749, -122.4194, 37.7899, -122.4194)
      expect(distance).toBeGreaterThan(0.9)
      expect(distance).toBeLessThan(1.1)
    })
  })

  describe('getGoogleMapsUrl', () => {
    it('should generate Google Maps URL with coordinates', () => {
      const url = getGoogleMapsUrl(37.7749, -122.4194)
      expect(url).toContain('google.com/maps')
      expect(url).toContain('37.7749')
      expect(url).toContain('-122.4194')
    })

    it('should include label in URL if provided', () => {
      const url = getGoogleMapsUrl(37.7749, -122.4194, 'San Francisco')
      expect(url).toContain('San%20Francisco')
    })
  })

  describe('getAppleMapsUrl', () => {
    it('should generate Apple Maps URL with coordinates', () => {
      const url = getAppleMapsUrl(37.7749, -122.4194)
      expect(url).toContain('maps.apple.com')
      expect(url).toContain('37.7749')
      expect(url).toContain('-122.4194')
    })
  })

  describe('isIOS', () => {
    it('should detect iOS device', () => {
      // Mock navigator for iOS
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      expect(isIOS()).toBe(true)
    })

    it('should return false for non-iOS device', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      })
      expect(isIOS()).toBe(false)
    })
  })

  describe('getMapUrl', () => {
    beforeEach(() => {
      // Reset navigator
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      })
    })

    it('should return Google Maps URL for non-iOS devices', () => {
      const url = getMapUrl(37.7749, -122.4194)
      expect(url).toContain('google.com/maps')
    })

    it('should return Apple Maps URL for iOS devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      const url = getMapUrl(37.7749, -122.4194)
      expect(url).toContain('maps.apple.com')
    })
  })

  describe('calculateEstimatedDeliveryTime', () => {
    it('should calculate delivery time based on distance', () => {
      const time = calculateEstimatedDeliveryTime(5, 25) // 5 miles at 25 mph
      expect(time).toBe(12) // 5/25 * 60 = 12 minutes
    })

    it('should use default speed if not provided', () => {
      const time = calculateEstimatedDeliveryTime(5)
      expect(time).toBeGreaterThan(0)
    })

    it('should handle zero distance', () => {
      const time = calculateEstimatedDeliveryTime(0, 25)
      expect(time).toBe(0)
    })
  })

  describe('formatAddress', () => {
    it('should format address object', () => {
      const address = {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
      }
      const formatted = formatAddress(address)
      expect(formatted).toBe('123 Main St, San Francisco, CA, 94102')
    })

    it('should handle address string', () => {
      const address = '123 Main St, San Francisco, CA 94102'
      const formatted = formatAddress(address)
      expect(formatted).toBe(address)
    })

    it('should handle missing fields', () => {
      const address = {
        street: '123 Main St',
        city: 'San Francisco',
      }
      const formatted = formatAddress(address)
      expect(formatted).toBe('123 Main St, San Francisco')
    })

    it('should handle empty/null address', () => {
      expect(formatAddress(null)).toBe('')
      expect(formatAddress(undefined)).toBe('')
      expect(formatAddress({})).toBe('')
    })
  })
})

