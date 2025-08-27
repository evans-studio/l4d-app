import { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from '@/lib/utils/logger'

export interface CustomerBooking {
  id: string
  booking_reference: string
  scheduled_date: string
  scheduled_start_time: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'declined'
  total_price: number
  // Customer information now included for consistency with admin view
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  service: {
    name: string
    short_description?: string
    category?: string
  } | null
  vehicle: {
    make: string
    model: string
    year?: number
    color?: string
  } | null
  address: {
    address_line_1: string
    address_line_2?: string
    city: string
    postal_code: string
  } | null
  special_instructions?: string
  created_at: string
}

interface BookingUpdate {
  type: 'booking_updated' | 'booking_cancelled' | 'booking_confirmed' | 'booking_rescheduled' | 'booking_completed' | 'booking_declined'
  booking: CustomerBooking
  timestamp: string
}

interface UseCustomerRealTimeBookingsOptions {
  pollInterval?: number // in milliseconds, default 60000 (60 seconds)
  enableRealTimeUpdates?: boolean
  statusFilter?: CustomerBooking['status']
}

interface UseCustomerRealTimeBookingsReturn {
  bookings: CustomerBooking[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  refreshBookings: () => Promise<void>
  cancelBooking: (bookingId: string, reason: string) => Promise<boolean>
  requestReschedule: (bookingId: string, preferredDate: string, preferredTime: string, reason?: string) => Promise<boolean>
  getBookingById: (bookingId: string) => CustomerBooking | undefined
  getUpcomingBookings: () => CustomerBooking[]
  getPastBookings: () => CustomerBooking[]
  getBookingsByStatus: (status: CustomerBooking['status']) => CustomerBooking[]
}

/**
 * Hook for managing real-time booking data in customer dashboard
 * Provides automatic polling, optimistic updates, and real-time sync for customer bookings
 */
export function useCustomerRealTimeBookings({
  pollInterval = 60000, // 60 seconds for customer dashboard (less frequent than admin)
  enableRealTimeUpdates = true,
  statusFilter
}: UseCustomerRealTimeBookingsOptions = {}): UseCustomerRealTimeBookingsReturn {
  const [bookings, setBookings] = useState<CustomerBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const updateListenersRef = useRef<Set<(update: BookingUpdate) => void>>(new Set())

  /**
   * Fetch customer bookings from API
   */
  const fetchBookings = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      if (statusFilter) {
        params.append('status', statusFilter)
      }

      const queryString = params.toString()
      const url = `/api/customer/bookings${queryString ? `?${queryString}` : ''}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`)
      }

      const { data: bookingsData, success } = await response.json()
      
      if (!success) {
        throw new Error('API returned unsuccessful response')
      }

      setBookings(bookingsData || [])
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bookings'
      setError(errorMessage)
      logger.error('Customer bookings fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

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
      fetchBookings(false) // Don't show loading spinner for background updates
    }, pollInterval)
  }, [fetchBookings, pollInterval, enableRealTimeUpdates])

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
   * Handle real-time booking updates
   */
  const handleBookingUpdate = useCallback((update: BookingUpdate) => {
    setBookings(currentBookings => {
      const updatedBookings = [...currentBookings]
      const bookingIndex = updatedBookings.findIndex(booking => booking.id === update.booking.id)

      switch (update.type) {
        case 'booking_updated':
        case 'booking_confirmed':
        case 'booking_cancelled':
        case 'booking_rescheduled':
        case 'booking_completed':
        case 'booking_declined':
          if (bookingIndex >= 0) {
            updatedBookings[bookingIndex] = update.booking
          }
          break
      }

      return updatedBookings
    })
    
    setLastUpdated(new Date(update.timestamp))
  }, [])

  /**
   * Cancel a booking
   */
  const cancelBooking = useCallback(async (bookingId: string, reason: string): Promise<boolean> => {
    try {
      // Optimistic update
      const originalBookings = [...bookings]
      setBookings(currentBookings => 
        currentBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' as CustomerBooking['status'] }
            : booking
        )
      )

      const response = await fetch(`/api/customer/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })

      if (!response.ok) {
        // Revert optimistic update
        setBookings(originalBookings)
        
        const errorData = await response.json()
        setError(errorData.error?.message || 'Failed to cancel booking')
        return false
      }

      const { data: updatedBooking } = await response.json()
      
      // Update with server response
      setBookings(currentBookings => 
        currentBookings.map(booking => 
          booking.id === bookingId ? updatedBooking : booking
        )
      )

      return true
    } catch (err) {
      // Revert optimistic update
      setBookings(bookings)
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel booking'
      setError(errorMessage)
      return false
    }
  }, [bookings])

  /**
   * Request a reschedule
   */
  const requestReschedule = useCallback(async (bookingId: string, preferredDate: string, preferredTime: string, reason?: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/customer/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          preferred_date: preferredDate, 
          preferred_time: preferredTime, 
          reason 
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error?.message || 'Failed to request reschedule')
        return false
      }

      // Refresh bookings to get latest data
      await fetchBookings(false)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request reschedule'
      setError(errorMessage)
      return false
    }
  }, [fetchBookings])

  /**
   * Get booking by ID
   */
  const getBookingById = useCallback((bookingId: string): CustomerBooking | undefined => {
    return bookings.find(booking => booking.id === bookingId)
  }, [bookings])

  /**
   * Get upcoming bookings (future bookings)
   */
  const getUpcomingBookings = useCallback((): CustomerBooking[] => {
    const now = new Date()
    const today = now.toISOString().split('T')[0] || ''
    
    return bookings
      .filter(booking => {
        // Include bookings that are today or in the future
        return booking.scheduled_date >= today && 
               booking.status !== 'cancelled' && 
               booking.status !== 'completed'
      })
      .sort((a, b) => {
        // Sort by date and time (earliest first)
        const dateTimeA = new Date(`${a.scheduled_date}T${a.scheduled_start_time}`)
        const dateTimeB = new Date(`${b.scheduled_date}T${b.scheduled_start_time}`)
        return dateTimeA.getTime() - dateTimeB.getTime()
      })
  }, [bookings])

  /**
   * Get past bookings (completed or cancelled)
   */
  const getPastBookings = useCallback((): CustomerBooking[] => {
    const now = new Date()
    const today = now.toISOString().split('T')[0] || ''
    
    return bookings
      .filter(booking => {
        // Include completed/cancelled bookings or past bookings
        return booking.status === 'completed' || 
               booking.status === 'cancelled' ||
               booking.scheduled_date < today
      })
      .sort((a, b) => {
        // Sort by date and time (most recent first)
        const dateTimeA = new Date(`${a.scheduled_date}T${a.scheduled_start_time}`)
        const dateTimeB = new Date(`${b.scheduled_date}T${b.scheduled_start_time}`)
        return dateTimeB.getTime() - dateTimeA.getTime()
      })
  }, [bookings])

  /**
   * Get bookings by status
   */
  const getBookingsByStatus = useCallback((status: CustomerBooking['status']): CustomerBooking[] => {
    return bookings.filter(booking => booking.status === status)
  }, [bookings])

  /**
   * Refresh bookings data manually
   */
  const refreshBookings = useCallback(async () => {
    await fetchBookings(true)
  }, [fetchBookings])

  // Initialize on mount and when filters change
  useEffect(() => {
    fetchBookings(true)
  }, [fetchBookings])

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
    
    const listener = handleBookingUpdate
    const updateListeners = updateListenersRef.current
    updateListeners.add(listener)

    return () => {
      updateListeners.delete(listener)
    }
  }, [handleBookingUpdate, enableRealTimeUpdates])

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
        fetchBookings(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enableRealTimeUpdates, startPolling, stopPolling, fetchBookings])

  return {
    bookings,
    isLoading,
    error,
    lastUpdated,
    refreshBookings,
    cancelBooking,
    requestReschedule,
    getBookingById,
    getUpcomingBookings,
    getPastBookings,
    getBookingsByStatus
  }
}