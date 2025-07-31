'use client'

import { useRouter } from 'next/navigation'
import { useOverlay } from '@/lib/overlay/context'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/composites/Card'
import { Badge } from '@/components/ui/primitives/Badge'
import { 
  Activity, 
  Calendar, 
  Car,
  CheckCircle,
  Clock,
  X,
  AlertCircle,
  ChevronRight
} from 'lucide-react'

interface RecentActivityWidgetProps {
  recentBookings: Array<{
    id: string
    booking_reference: string
    scheduled_date: string
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
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
    total_price: number
  }>
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'warning'
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'success'
  },
  in_progress: {
    label: 'In Progress',
    icon: Activity,
    color: 'brand'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'success'
  },
  cancelled: {
    label: 'Cancelled',
    icon: X,
    color: 'error'
  }
} as const

export function RecentActivityWidget({ recentBookings }: RecentActivityWidgetProps) {
  const router = useRouter()
  const { openOverlay } = useOverlay()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    })
  }

  const displayBookings = recentBookings.slice(0, 3)

  if (recentBookings.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-400" />
            Recent Activity
          </h3>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-full bg-surface-tertiary flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-text-muted" />
          </div>
          <h4 className="font-medium text-text-primary mb-2">No activity yet</h4>
          <p className="text-sm text-text-secondary mb-6">
            Your booking history will appear here
          </p>
          <Button
            onClick={() => router.push('/book')}
            size="sm"
            className="w-full"
          >
            Book Your First Service
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
            <Activity className="w-5 h-5 text-brand-400" />
            Recent Activity
          </h3>
          {recentBookings.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/bookings')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayBookings.map((booking) => {
          const config = statusConfig[booking.status]
          const StatusIcon = config.icon
          
          return (
            <div
              key={booking.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-surface-tertiary hover:bg-surface-secondary transition-colors cursor-pointer"
              onClick={() => openOverlay({
                type: 'booking-view',
                data: { bookingId: booking.id, booking }
              })}
            >
              {/* Status Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                config.color === 'brand' ? 'bg-brand-600/10' :
                config.color === 'success' ? 'bg-success-600/10' :
                config.color === 'warning' ? 'bg-warning-600/10' :
                config.color === 'error' ? 'bg-error-600/10' :
                'bg-surface-tertiary'
              }`}>
                <StatusIcon className={`w-4 h-4 ${
                  config.color === 'brand' ? 'text-brand-400' :
                  config.color === 'success' ? 'text-success-400' :
                  config.color === 'warning' ? 'text-warning-400' :
                  config.color === 'error' ? 'text-error-400' :
                  'text-text-muted'
                }`} />
              </div>

              {/* Booking Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-text-primary text-sm truncate">
                    {booking.service?.name || 'Service details pending'}
                  </p>
                  <Badge 
                    variant={config.color as any}
                    size="sm"
                  >
                    {config.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Car className="w-3 h-3" />
                  <span>
                    {booking.vehicle ? `${booking.vehicle.year || ''} ${booking.vehicle.make} ${booking.vehicle.model}`.trim() : 'Vehicle details pending'}
                  </span>
                  <span>•</span>
                  <span>{formatDate(booking.scheduled_date)}</span>
                </div>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="font-bold text-text-primary text-sm">
                  £{booking.total_price || 0}
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>

      {recentBookings.length > 3 && (
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/bookings')}
            className="w-full"
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            View All Bookings ({recentBookings.length})
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}