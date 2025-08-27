'use client'

// Note: Removed rebook functionality - users should use PWA floating button
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { isNewUIEnabled } from '@/lib/config/feature-flags'
import { 
  Calendar, 
  Car,
  Sparkles,
  RefreshCw,
  ChevronRight
} from 'lucide-react'

interface QuickRebookWidgetProps {
  lastBooking?: {
    id: string
    booking_reference: string
    scheduled_date: string
    status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'declined'
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
  // Removed rebook functionality - widget now shows information only

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
      <Card className="h-full" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
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
          <p className="text-sm text-text-secondary text-center px-4">
            Complete your first booking to enable quick rebooking here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-brand-400" />
            Quick Rebook
          </h3>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Go to bookings"
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

        {/* Service information only - use PWA floating button to book */}
        <div className="text-center">
          <p className="text-xs text-text-muted px-2">
            Use the floating book button to rebook this service
          </p>
        </div>
      </CardContent>
    </Card>
  )
}