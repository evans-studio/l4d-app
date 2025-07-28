import { useState, useEffect, useCallback, useRef } from 'react'

interface TimeSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  is_available: boolean
  booking_id?: string
  last_updated: string
  booking_reference?: string
}

interface AvailabilityUpdate {
  type: 'slot_booked' | 'slot_released' | 'slot_created' | 'slot_deleted'
  slot: TimeSlot
  timestamp: string
}

interface UseRealTimeAvailabilityOptions {
  date: string
  pollInterval?: number // in milliseconds, default 30000 (30 seconds)
  enableRealTimeUpdates?: boolean
}

interface UseRealTimeAvailabilityReturn {
  timeSlots: TimeSlot[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  refreshAvailability: () => Promise<void>
  bookSlot: (slotId: string, bookingId: string) => Promise<boolean>
  releaseSlot: (slotId: string) => Promise<boolean>
  isSlotAvailable: (slotId: string) => boolean
}

/**
 * Hook for managing real-time availability data
 * Provides automatic polling, optimistic updates, and real-time sync
 */
export function useRealTimeAvailability({
  date,
  pollInterval = 30000,
  enableRealTimeUpdates = true
}: UseRealTimeAvailabilityOptions): UseRealTimeAvailabilityReturn {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const updateListenersRef = useRef<Set<(update: AvailabilityUpdate) => void>>(new Set())

  /**
   * Fetch availability data from API
   */
  const fetchAvailability = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      setError(null)

      const response = await fetch(`/api/time-slots/availability?date=${date}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.status}`)
      }

      const { data: slots, success } = await response.json()
      
      if (!success) {
        throw new Error('API returned unsuccessful response')
      }

      setTimeSlots(slots || [])
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch availability'
      setError(errorMessage)
      console.error('Availability fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [date])

  /**
   * Start polling for updates
   */
  const startPolling = useCallback(() => {
    if (!enableRealTimeUpdates) return

    // Clear existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    // Set up new polling interval
    pollIntervalRef.current = setInterval(() => {
      fetchAvailability(false) // Don't show loading spinner for background updates
    }, pollInterval)
  }, [fetchAvailability, pollInterval, enableRealTimeUpdates])

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  /**
   * Handle real-time updates
   */
  const handleAvailabilityUpdate = useCallback((update: AvailabilityUpdate) => {
    setTimeSlots(currentSlots => {
      const updatedSlots = [...currentSlots]
      const slotIndex = updatedSlots.findIndex(slot => slot.id === update.slot.id)

      switch (update.type) {
        case 'slot_booked':
        case 'slot_released':
          if (slotIndex >= 0) {
            updatedSlots[slotIndex] = update.slot
          }
          break
        
        case 'slot_created':
          if (slotIndex === -1 && update.slot.date === date) {
            updatedSlots.push(update.slot)
            updatedSlots.sort((a, b) => a.start_time.localeCompare(b.start_time))
          }
          break
        
        case 'slot_deleted':
          if (slotIndex >= 0) {
            updatedSlots.splice(slotIndex, 1)
          }
          break
      }

      return updatedSlots
    })
    
    setLastUpdated(new Date(update.timestamp))
  }, [date])

  /**
   * Book a time slot with optimistic updates
   */
  const bookSlot = useCallback(async (slotId: string, bookingId: string): Promise<boolean> => {
    try {
      // Optimistic update
      setTimeSlots(currentSlots => 
        currentSlots.map(slot => 
          slot.id === slotId 
            ? { ...slot, is_available: false, booking_id: bookingId, last_updated: new Date().toISOString() }
            : slot
        )
      )

      const response = await fetch(`/api/time-slots/${slotId}/book`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ booking_id: bookingId })
      })

      if (!response.ok) {
        // Revert optimistic update
        setTimeSlots(currentSlots => 
          currentSlots.map(slot => 
            slot.id === slotId 
              ? { ...slot, is_available: true, booking_id: undefined }
              : slot
          )
        )
        
        const errorData = await response.json()
        setError(errorData.error?.message || 'Failed to book slot')
        return false
      }

      const { data: updatedSlot } = await response.json()
      
      // Update with server response
      setTimeSlots(currentSlots => 
        currentSlots.map(slot => 
          slot.id === slotId ? updatedSlot : slot
        )
      )

      return true
    } catch (err) {
      // Revert optimistic update
      setTimeSlots(currentSlots => 
        currentSlots.map(slot => 
          slot.id === slotId 
            ? { ...slot, is_available: true, booking_id: undefined }
            : slot
        )
      )
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to book slot'
      setError(errorMessage)
      return false
    }
  }, [])

  /**
   * Release a time slot (for cancellations)
   */
  const releaseSlot = useCallback(async (slotId: string): Promise<boolean> => {
    try {
      // Optimistic update
      setTimeSlots(currentSlots => 
        currentSlots.map(slot => 
          slot.id === slotId 
            ? { ...slot, is_available: true, booking_id: undefined, last_updated: new Date().toISOString() }
            : slot
        )
      )

      const response = await fetch(`/api/time-slots/${slotId}/release`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        // Revert optimistic update
        setTimeSlots(currentSlots => 
          currentSlots.map(slot => 
            slot.id === slotId 
              ? { ...slot, is_available: false }
              : slot
          )
        )
        
        const errorData = await response.json()
        setError(errorData.error?.message || 'Failed to release slot')
        return false
      }

      const { data: updatedSlot } = await response.json()
      
      // Update with server response
      setTimeSlots(currentSlots => 
        currentSlots.map(slot => 
          slot.id === slotId ? updatedSlot : slot
        )
      )

      return true
    } catch (err) {
      // Revert optimistic update
      setTimeSlots(currentSlots => 
        currentSlots.map(slot => 
          slot.id === slotId 
            ? { ...slot, is_available: false }
            : slot
        )
      )
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to release slot'
      setError(errorMessage)
      return false
    }
  }, [])

  /**
   * Check if a specific slot is available
   */
  const isSlotAvailable = useCallback((slotId: string): boolean => {
    const slot = timeSlots.find(s => s.id === slotId)
    return slot?.is_available ?? false
  }, [timeSlots])

  /**
   * Refresh availability data manually
   */
  const refreshAvailability = useCallback(async () => {
    await fetchAvailability(true)
  }, [fetchAvailability])

  // Initialize on mount and when date changes
  useEffect(() => {
    fetchAvailability(true)
  }, [fetchAvailability])

  // Set up polling when real-time updates are enabled
  useEffect(() => {
    if (enableRealTimeUpdates) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => stopPolling()
  }, [startPolling, stopPolling, enableRealTimeUpdates])

  // Set up real-time update listener
  useEffect(() => {
    if (!enableRealTimeUpdates) return

    // In a real implementation, this would set up WebSocket or Server-Sent Events
    // For now, we'll simulate it with the polling mechanism
    
    const listener = handleAvailabilityUpdate
    const updateListeners = updateListenersRef.current
    updateListeners.add(listener)

    return () => {
      updateListeners.delete(listener)
    }
  }, [handleAvailabilityUpdate, enableRealTimeUpdates])

  // Cleanup on unmount
  useEffect(() => {
    const updateListeners = updateListenersRef.current
    return () => {
      stopPolling()
      updateListeners.clear()
    }
  }, [stopPolling])

  // Handle visibility change - pause polling when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else if (enableRealTimeUpdates) {
        startPolling()
        // Refresh data when tab becomes visible again
        fetchAvailability(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enableRealTimeUpdates, startPolling, stopPolling, fetchAvailability])

  return {
    timeSlots,
    isLoading,
    error,
    lastUpdated,
    refreshAvailability,
    bookSlot,
    releaseSlot,
    isSlotAvailable
  }
}

/**
 * Hook for monitoring availability across multiple dates
 */
export function useMultiDateAvailability(dates: string[], pollInterval = 60000) {
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, TimeSlot[]>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMultiDateAvailability = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const promises = dates.map(date => 
        fetch(`/api/time-slots/availability?date=${date}`)
          .then(res => res.json())
          .then(data => ({ date, slots: data.data || [] }))
          .catch(err => ({ date, slots: [], error: err.message }))
      )

      const results = await Promise.all(promises)
      
      const newAvailabilityMap = new Map()
      results.forEach((result) => {
        if ('error' in result && result.error) {
          console.error(`Error fetching availability for ${result.date}:`, result.error)
        }
        newAvailabilityMap.set(result.date, result.slots)
      })

      setAvailabilityMap(newAvailabilityMap)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch multi-date availability'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [dates])

  useEffect(() => {
    if (dates.length > 0) {
      fetchMultiDateAvailability()
    }
  }, [fetchMultiDateAvailability, dates.length])

  // Set up polling for multi-date updates
  useEffect(() => {
    if (dates.length === 0) return

    const interval = setInterval(fetchMultiDateAvailability, pollInterval)
    return () => clearInterval(interval)
  }, [fetchMultiDateAvailability, pollInterval, dates.length])

  return {
    availabilityMap,
    isLoading,
    error,
    refreshAvailability: fetchMultiDateAvailability,
    getAvailabilityForDate: (date: string) => availabilityMap.get(date) || [],
    getTotalAvailableSlots: () => {
      let total = 0
      availabilityMap.forEach(slots => {
        total += slots.filter(slot => slot.is_available).length
      })
      return total
    }
  }
}