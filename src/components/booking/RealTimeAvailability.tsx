'use client'

import { useState } from 'react'
import { useRealTimeAvailability } from '@/hooks/useRealTimeAvailability'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/composites/Card'
import { Badge } from '@/components/ui/primitives/Badge'
import { RefreshCw, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react'

interface RealTimeAvailabilityProps {
  selectedDate: string
  onSlotSelect?: (slotId: string) => void
  showDebugInfo?: boolean
}

export function RealTimeAvailability({ 
  selectedDate,
  onSlotSelect,
  showDebugInfo = false
}: RealTimeAvailabilityProps) {
  const [testBookingId] = useState(`test-booking-${Date.now()}`)
  
  const {
    timeSlots,
    isLoading,
    error,
    lastUpdated,
    refreshAvailability,
    bookSlot,
    releaseSlot,
    isSlotAvailable
  } = useRealTimeAvailability({
    date: selectedDate,
    pollInterval: 30000, // 30 seconds
    enableRealTimeUpdates: true
  })

  const handleSlotBook = async (slotId: string) => {
    const success = await bookSlot(slotId, testBookingId)
    if (success && onSlotSelect) {
      onSlotSelect(slotId)
    }
  }

  const handleSlotRelease = async (slotId: string) => {
    await releaseSlot(slotId)
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Real-Time Availability</h3>
          <p className="text-sm text-muted-foreground">
            {formatDate(selectedDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <div className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAvailability}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center text-red-800">
              <XCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          </div>
        )}

        {isLoading && timeSlots.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading availability...
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No time slots available for this date
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Available
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-600" />
                Booked
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {timeSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`p-3 border rounded-lg transition-colors ${
                    slot.is_available
                      ? 'bg-green-50 border-green-200 hover:bg-green-100'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </span>
                    </div>
                    <Badge variant={slot.is_available ? 'success' : 'error'}>
                      {slot.is_available ? 'Available' : 'Booked'}
                    </Badge>
                  </div>

                  {!slot.is_available && slot.booking_reference && (
                    <div className="text-xs text-muted-foreground mb-2">
                      Booking: {slot.booking_reference}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {slot.is_available ? (
                      <Button
                        size="sm"
                        onClick={() => handleSlotBook(slot.id)}
                        className="flex-1"
                      >
                        Book Slot
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSlotRelease(slot.id)}
                        className="flex-1"
                      >
                        Release Slot
                      </Button>
                    )}
                  </div>

                  {showDebugInfo && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                      <div>ID: {slot.id}</div>
                      <div>Available: {isSlotAvailable(slot.id) ? 'Yes' : 'No'}</div>
                      <div>Updated: {new Date(slot.last_updated).toLocaleTimeString()}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {showDebugInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Debug Information</h4>
            <div className="text-sm font-mono space-y-1">
              <div>Total slots: {timeSlots.length}</div>
              <div>Available slots: {timeSlots.filter(s => s.is_available).length}</div>
              <div>Booked slots: {timeSlots.filter(s => !s.is_available).length}</div>
              <div>Last update: {lastUpdated?.toISOString() || 'Never'}</div>
              <div>Test booking ID: {testBookingId}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}