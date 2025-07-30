'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingFlowStore } from '@/lib/store/bookingFlowStore'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { 
  Calendar, 
  Car, 
  Clock,
  Sparkles,
  RefreshCw,
  ChevronRight
} from 'lucide-react'

interface QuickRebookWidgetProps {
  lastBooking?: {
    id: string
    booking_reference: string
    scheduled_date: string
    service: {
      name: string
      short_description?: string
      category?: string
    } | null
    vehicle: {
      make: string
      model: string
      year?: number
    } | null
    total_price: number
  }
}

export function QuickRebookWidget({ lastBooking }: QuickRebookWidgetProps) {
  const router = useRouter()
  const { initializeRebooking } = useBookingFlowStore()
  const [isRebooking, setIsRebooking] = useState(false)

  const handleQuickRebook = async () => {
    if (!lastBooking) return
    
    try {
      setIsRebooking(true)
      await initializeRebooking(lastBooking.id)
      router.push('/book')
    } catch (error) {
      console.error('Quick rebook failed:', error)
      setIsRebooking(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (!lastBooking) {
    return (
      <Card className="h-full">
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-brand-400" />
            Quick Rebook
          </h3>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-full bg-surface-tertiary flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 text-text-muted" />
          </div>
          <h4 className="font-medium text-text-primary mb-2">No previous bookings</h4>
          <p className="text-sm text-text-secondary mb-6">
            Complete your first booking to enable quick rebooking
          </p>
          <Button
            onClick={() => router.push('/book')}
            size="sm"
            className="w-full"
          >
            Book First Service
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-brand-400" />
            Quick Rebook
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/bookings')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Last Service Preview */}
        <div className="bg-surface-tertiary rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-text-primary">Last Service</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Car className="w-4 h-4 text-text-secondary" />
              <span className="text-sm text-text-primary">
                {lastBooking.vehicle ? `${lastBooking.vehicle.year || ''} ${lastBooking.vehicle.make} ${lastBooking.vehicle.model}`.trim() : 'Vehicle details pending'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-text-secondary" />
              <span className="text-sm text-text-primary">
                {lastBooking.service?.name || 'Service details pending'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-text-secondary" />
              <span className="text-sm text-text-secondary">
                {formatDate(lastBooking.scheduled_date)}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Same service</span>
          <span className="font-bold text-text-primary">£{lastBooking.total_price}</span>
        </div>

        {/* Quick Rebook Button */}
        <Button
          onClick={handleQuickRebook}
          disabled={isRebooking}
          className="w-full"
          leftIcon={
            isRebooking ? 
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> :
              <RefreshCw className="w-4 h-4" />
          }
        >
          {isRebooking ? 'Setting up...' : 'Book Same Service'}
        </Button>

        <p className="text-xs text-text-muted text-center">
          Same vehicle and service details. Choose new date & time.
        </p>
      </CardContent>
    </Card>
  )
}