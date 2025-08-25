import { useState, useEffect, useCallback, useRef } from 'react'

interface BookingUpdate {
  type: 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'booking_confirmed' | 'booking_declined' | 'booking_rescheduled' | 'booking_completed'
  booking: AdminBooking
  timestamp: string
}

export interface AdminBooking {
  id: string
  booking_reference: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  scheduled_date: string
  start_time: string
  status: 'pending' | 'processing' | 'payment_failed' | 'confirmed' | 'rescheduled' | 'in_progress' | 'completed' | 'declined' | 'cancelled' | 'no_show'
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
  total_price: number
  special_instructions?: string
  services: Array<{
    name: string
    base_price: number
  }>
  vehicle: {
    make: string
    model: string
    year?: number
    color?: string
  }
  address: {
    address_line_1: string
    city: string
    postal_code: string
  }
  created_at: string
  payment_link?: string
  payment_deadline?: string
}

interface UseRealTimeBookingsOptions {
  pollInterval?: number // in milliseconds, default 30000 (30 seconds)
  enableRealTimeUpdates?: boolean
  statusFilter?: string // Filter by booking status
  customerFilter?: string // Filter by customer name/email
}

interface UseRealTimeBookingsReturn {
  bookings: AdminBooking[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  refreshBookings: () => Promise<void>
  updateBookingStatus: (bookingId: string, status: AdminBooking['status']) => Promise<boolean>
  confirmBooking: (bookingId: string, sendEmail?: boolean) => Promise<boolean>
  cancelBooking: (bookingId: string, reason: string, refundAmount?: number) => Promise<boolean>
  rescheduleBooking: (bookingId: string, newDate: string, newTime: string, reason?: string) => Promise<boolean>
  getBookingById: (bookingId: string) => AdminBooking | undefined
  getBookingsByStatus: (status: AdminBooking['status']) => AdminBooking[]
  getTodaysBookings: () => AdminBooking[]
}

/**
 * Hook for managing real-time booking data in admin interface
 * Provides automatic polling, optimistic updates, and real-time sync
 */
export function useRealTimeBookings({
  pollInterval = 5000,
  enableRealTimeUpdates = true,
  statusFilter,
  customerFilter
}: UseRealTimeBookingsOptions = {}): UseRealTimeBookingsReturn {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const updateListenersRef = useRef<Set<(update: BookingUpdate) => void>>(new Set())

  /**
   * Fetch bookings data from API
   */
  const fetchBookings = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (customerFilter) {
        params.append('customer', customerFilter)
      }

      const queryString = params.toString()
      const urlBase = `/api/admin/bookings/all${queryString ? `?${queryString}` : ''}`
      const url = `${urlBase}${urlBase.includes('?') ? '&' : '?'}_ts=${Date.now()}`
      
      const response = await fetch(url, { cache: 'no-store' })
      
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
      console.error('Bookings fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, customerFilter])

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
        case 'booking_created':
          if (bookingIndex === -1) {
            updatedBookings.push(update.booking)
            // Sort by created date (newest first)
            updatedBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          }
          break
        
        case 'booking_updated':
        case 'booking_confirmed':
        case 'booking_cancelled':
        case 'booking_declined':
        case 'booking_rescheduled':
        case 'booking_completed':
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
   * Update booking status with optimistic updates
   */
  const updateBookingStatus = useCallback(async (bookingId: string, status: AdminBooking['status']): Promise<boolean> => {
    try {
      // Optimistic update
      const originalBookings = [...bookings]
      setBookings(currentBookings => 
        currentBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status }
            : booking
        )
      )

      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        // Revert optimistic update
        setBookings(originalBookings)
        
        const errorData = await response.json()
        setError(errorData.error?.message || 'Failed to update booking status')
        return false
      }

      const { data: updatedBooking } = await response.json()
      
      // Update with server response, merging with current booking data to prevent blank cards
      setBookings(currentBookings => 
        currentBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, ...updatedBooking.booking || updatedBooking }
            : booking
        )
      )

      // Trigger immediate refresh to sync with server
      setTimeout(() => fetchBookings(false), 100)

      return true
    } catch (err) {
      // Revert optimistic update
      setBookings(bookings)
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update booking status'
      setError(errorMessage)
      return false
    }
  }, [bookings, fetchBookings])

  /**
   * Confirm a booking
   */
  const confirmBooking = useCallback(async (bookingId: string, sendEmail = true): Promise<boolean> => {
    try {
      // Optimistic update
      const originalBookings = [...bookings]
      setBookings(currentBookings => 
        currentBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'confirmed' as AdminBooking['status'] }
            : booking
        )
      )

      const response = await fetch(`/api/admin/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sendEmail })
      })

      if (!response.ok) {
        // Revert optimistic update
        setBookings(originalBookings)
        
        const errorData = await response.json()
        setError(errorData.error?.message || 'Failed to confirm booking')
        return false
      }

      const { data: updatedBooking } = await response.json()
      
      // Update with server response, merging with current booking data to prevent blank cards
      setBookings(currentBookings => 
        currentBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, ...updatedBooking.booking || updatedBooking }
            : booking
        )
      )

      // Trigger immediate refresh to sync with server
      setTimeout(() => fetchBookings(false), 100)

      return true
    } catch (err) {
      // Revert optimistic update
      setBookings(bookings)
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm booking'
      setError(errorMessage)
      return false
    }
  }, [bookings, fetchBookings])

  /**
   * Cancel a booking
   */
  const cancelBooking = useCallback(async (bookingId: string, reason: string, refundAmount?: number): Promise<boolean> => {
    try {
      // Optimistic update
      const originalBookings = [...bookings]
      setBookings(currentBookings => 
        currentBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' as AdminBooking['status'] }
            : booking
        )
      )

      const response = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason, refundAmount })
      })

      if (!response.ok) {
        // Revert optimistic update
        setBookings(originalBookings)
        
        const errorData = await response.json()
        setError(errorData.error?.message || 'Failed to cancel booking')
        return false
      }

      const { data: updatedBooking } = await response.json()
      
      // Update with server response, merging with current booking data to prevent blank cards
      setBookings(currentBookings => 
        currentBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, ...updatedBooking.booking || updatedBooking }
            : booking
        )
      )

      // Trigger immediate refresh to sync with server
      setTimeout(() => fetchBookings(false), 100)

      return true
    } catch (err) {
      // Revert optimistic update
      setBookings(bookings)
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel booking'
      setError(errorMessage)
      return false
    }
  }, [bookings, fetchBookings])

  /**
   * Reschedule a booking
   */
  const rescheduleBooking = useCallback(async (bookingId: string, newDate: string, newTime: string, reason?: string): Promise<boolean> => {
    try {
      // Optimistic update
      const originalBookings = [...bookings]
      setBookings(currentBookings => 
        currentBookings.map(booking => 
          booking.id === bookingId 
            ? { 
                ...booking, 
                scheduled_date: newDate, 
                start_time: newTime, 
                status: 'rescheduled' as AdminBooking['status'] 
              }
            : booking
        )
      )

      const response = await fetch(`/api/admin/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newDate, newTime, reason })
      })

      if (!response.ok) {
        // Revert optimistic update
        setBookings(originalBookings)
        
        const errorData = await response.json()
        setError(errorData.error?.message || 'Failed to reschedule booking')
        return false
      }

      const { data: updatedBooking } = await response.json()
      
      // Update with server response, merging with current booking data to prevent blank cards
      setBookings(currentBookings => 
        currentBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, ...updatedBooking.booking || updatedBooking }
            : booking
        )
      )

      // Trigger immediate refresh to sync with server
      setTimeout(() => fetchBookings(false), 100)

      return true
    } catch (err) {
      // Revert optimistic update
      setBookings(bookings)
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to reschedule booking'
      setError(errorMessage)
      return false
    }
  }, [bookings, fetchBookings])

  /**
   * Get booking by ID
   */
  const getBookingById = useCallback((bookingId: string): AdminBooking | undefined => {
    return bookings.find(booking => booking.id === bookingId)
  }, [bookings])

  /**
   * Get bookings by status
   */
  const getBookingsByStatus = useCallback((status: AdminBooking['status']): AdminBooking[] => {
    return bookings.filter(booking => booking.status === status)
  }, [bookings])

  /**
   * Get today's bookings
   */
  const getTodaysBookings = useCallback((): AdminBooking[] => {
    const today = new Date().toISOString().split('T')[0]
    return bookings.filter(booking => booking.scheduled_date === today)
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
    updateBookingStatus,
    confirmBooking,
    cancelBooking,
    rescheduleBooking,
    getBookingById,
    getBookingsByStatus,
    getTodaysBookings
  }
}

/**
 * Hook for monitoring booking metrics and statistics
 */
export function useBookingMetrics(bookings: AdminBooking[]) {
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    processingBookings: 0,
    paymentFailedBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    declinedBookings: 0,
    noShowBookings: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    todaysBookings: 0,
    weeklyBookings: 0,
    monthlyBookings: 0
  })

  useEffect(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0] || ''
    
    // Create a copy of the date for week calculation
    const weekDate = new Date(now)
    weekDate.setDate(weekDate.getDate() - weekDate.getDay())
    const weekStart = weekDate.toISOString().split('T')[0] || today
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0] || today

    const newMetrics = {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      processingBookings: bookings.filter(b => b.status === 'processing').length,
      paymentFailedBookings: bookings.filter(b => b.status === 'payment_failed').length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      declinedBookings: bookings.filter(b => b.status === 'declined').length,
      noShowBookings: bookings.filter(b => b.status === 'no_show').length,
      totalRevenue: bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.total_price, 0),
      pendingRevenue: bookings
        .filter(b => ['pending', 'processing', 'confirmed', 'rescheduled', 'in_progress'].includes(b.status))
        .reduce((sum, b) => sum + b.total_price, 0),
      todaysBookings: bookings.filter(b => b.scheduled_date === today).length,
      weeklyBookings: bookings.filter(b => b.scheduled_date >= weekStart).length,
      monthlyBookings: bookings.filter(b => b.scheduled_date >= monthStart).length
    }

    setMetrics(newMetrics)
  }, [bookings])

  return metrics
}