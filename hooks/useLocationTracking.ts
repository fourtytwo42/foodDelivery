import { useState, useEffect, useCallback } from 'react'

interface Location {
  latitude: number
  longitude: number
  accuracy?: number
}

export function useLocationTracking() {
  const [location, setLocation] = useState<Location | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const requestLocation = useCallback(() => {
    return new Promise<Location>((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'Geolocation is not supported by this browser'
        setError(err)
        reject(new Error(err))
        return
      }

      setIsLoading(true)
      setError(null)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || undefined,
          }
          setLocation(loc)
          setIsLoading(false)
          resolve(loc)
        },
        (err) => {
          let errorMessage = 'Failed to get location'
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Location permission denied'
              break
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable'
              break
            case err.TIMEOUT:
              errorMessage = 'Location request timeout'
              break
          }
          setError(errorMessage)
          setIsLoading(false)
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }, [])

  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return () => {}
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || undefined,
        })
        setError(null)
      },
      (err) => {
        let errorMessage = 'Failed to track location'
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location permission denied'
            break
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable'
            break
          case err.TIMEOUT:
            errorMessage = 'Location request timeout'
            break
        }
        setError(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return {
    location,
    error,
    isLoading,
    requestLocation,
    watchLocation,
  }
}

